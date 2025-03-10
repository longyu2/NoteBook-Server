const e = require("express");
const db = require("./db.js");
const db_promise = require("./db_promise");
module.exports = {
  // 搜索
  Search: async ({ userid, queryKey }) => {
    const sql_str = `select * from Notebooklist where (title like '%${queryKey}%' or content like '%${queryKey}%') and authorid ='${userid}';`;

    return db_promise.query(sql_str, []);
  },
  // 查询字数
  wordCount: async (userid, fid) => {
    let sql_str;
    if (fid == -2) {
      sql_str = `select * from Notebooklist where  authorid ='${userid}' ;`;
    } else if (fid == -1) {
      sql_str = `select * from Notebooklist where Notebookid not in (select notebookid from folder_notebook) and  authorid ='${userid}';`;
    } else {
      sql_str = `select * from Notebooklist s1, folder_notebook s2 where s2.notebookid = s1.Notebookid and  s1.authorid ='${userid}' and s2.folder_id = '${fid}';`;
    }

    return db_promise.query(sql_str, []);
  },

  // 根据json上传文章
  ByJsonSaveArticle: (Notebooklist, folderName, user_id) => {
    // 新建一个文件夹进行存储这些文章
    let sql_str = "insert into folders (userid,folder_name )values (?,?);";

    // 第一次查询，promise 链的入口，新建文件夹
    return (
      db_promise
        .query(sql_str, [user_id, folderName])
        // 第二次查询，存储所有文章
        .then((data) => {
          let sql_str2 =
            "insert into Notebooklist (Notebookid,authorid,title,createtime,updatetime,content) values(?,?,?,?,?,?);";
          for (let i = 0; i < Notebooklist.length; i++) {
            // 进行文章的插入
            const Promise_article = db_promise.query(sql_str2, [
              Notebooklist[i].notebookid,
              Notebooklist[i].authorid,
              Notebooklist[i].title,
              Notebooklist[i].createtime,
              Notebooklist[i].updatetime,
              Notebooklist[i].content,
            ]);

            if (i == Notebooklist.length - 1) {
              return Promise_article;
            }
          }
        })
        .then((data) => {
          // 第三次，开始为文章添加文件夹信息
          let sql_str3 =
            "insert into folder_notebook values ((select folder_id from folders where folder_name = ?),?);";
          let index = 0;

          for (let j = 0; j < Notebooklist.length; j++) {
            let Promise_article_folder = db_promise
              .query(sql_str3, [folderName, Notebooklist[j].notebookid])
              .then((data) => {
                index++;
              });
            if (j == Notebooklist.length - 1) {
              return "成功";
            }
          }
        })
    );
  },

  // 根据文件夹id查询文章
  byFolderIdQueryArticle: function (folderid, userid) {
    let sql =
      "select * from folder_notebook s1,Notebooklist s2 where s1.notebookid = s2.Notebookid and s1.folder_id = ? and s2.authorid = ? order by createtime desc";
    return new Promise((resolve, reject) => {
      db.query(sql, [folderid, userid], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ status: "查询成功", data: result });
      });
    });
  },

  // 查询未分类的文章
  SelUnclassifiedArticle: function (userid) {
    const sql_str =
      "select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook ) and authorid = ?  order by createtime desc;";
    return new Promise((resolve, reject) => {
      db.query(sql_str, [userid], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        const data = JSON.parse(JSON.stringify(results));

        // 对data里的字段进行裁剪 ，使其不要过长，占用带宽

        resolve({ status: "成功", data: data });
      });
    });
  },

  // 查询所有文章
  SelAllArticle: function (userid) {
    return db_promise
      .query(
        "select * from Notebooklist where authorid = ? order by createtime desc;",
        [userid]
      )
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          data[i].content = data[i].content.substring(0, 16);
        }
        return { status: "成功", data: data };
      });
  },

  // 修改创建时间
  UpdateCreatetime: (notebookId, newCreatetime) => {
    let sql_str =
      "update Notebooklist set createtime = ? where Notebookid = ? ";
    return db_promise
      .query(sql_str, [newCreatetime, notebookId])
      .then((data) => {
        return {
          status: "200",
          data: `id为${notebookId}的文章的创建时间已经修改为${newCreatetime}`,
        };
      });
  },

  // 增加文章
  AddArticle: function (userid, folderid) {
    let sql_str =
      "insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (?,'',now(),now(),'')";
    // 调用3级promise 执行三条语句
    return db_promise
      .query(sql_str, [userid])
      .then((data) => {
        sql_str =
          "select  * from Notebooklist order by  Notebookid desc limit 1 ;";
        return db_promise.query(sql_str, []); // 查询第一条
      })
      .then((data) => {
        // 对于无文件夹的新建，无需为folder_article表插入记录
        if (folderid == -1 || folderid == -2) {
          return {
            status: "成功",
            data: {
              message: "新建一篇文章，未放入任何文件夹",
              articleInfo: data[0],
            },
          };
        } else {
          const newArticle = data[0];
          const notebookid = newArticle.Notebookid; // 从上一次查询中取出刚刚创建完成的文章id
          sql_str = "insert into folder_notebook values(?,?);";
          return db_promise
            .query(sql_str, [folderid, notebookid])
            .then((results) => {
              return {
                status: "成功",
                data: {
                  message: "新建一篇文章,放入了文件夹",
                  articleInfo: newArticle,
                },
              };
            });
        }
      });
  },

  // 导出文章和文件夹信息
  Output: function () {
    return db_promise.query("select * from Notebooklist", []).then((data) => {
      return db_promise
        .query("select * from folder_notebook", [])
        .then((data2) => {
          return { Notebooklist: data, folder_notebook: data2 };
        });
    });
  },

  // 根据id查询文章
  ByIdGetArticle: (article_id) => {
    let sql_str = "select * from Notebooklist where Notebookid =?";
    return db_promise.query(sql_str, [article_id]);
  },

  DeleteArticles: (article_id) => {
    // 如果该文章存在于文件夹中，先删除 folder_article 中的记录，否则会受到外键约束
    let sql_str = "delete from folder_notebook where Notebookid = ?";
    return db_promise.query(sql_str, [article_id]).then((data) => {
      sql_str = "delete from Notebooklist where Notebookid = ?;";
      return db_promise.query(sql_str, [article_id]);
    });
  },

  // 修改文章
  UpdateArticle: (title, content, article_id) => {
    let sql_str =
      "update Notebooklist set title=?,content=?,updatetime=now() where Notebookid = ?";
    return db_promise
      .query(sql_str, [title, content, article_id])
      .then((data) => {
        return "修改成功";
      });
  },
};
