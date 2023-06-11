const db = require("./db.js");
const db_promise = require("./db_promise");
module.exports = {
  // 根据json上传文章
  ByJsonSaveArticle: (Notebooklist, folder_notebook) => {
    // 这里未做校验，上传时如果有notebookid 与数据库中已经存在的notebookid 冲突，程序会崩溃。所以此脚本仅仅可用于上传至空的数据库中
    let sql_str = "insert into Notebooklist values(?,?,?,?,?,?);";
    Notebooklist.forEach((element) => {
      db_promise.query(sql_str, [
        element.Notebookid,
        element.authorid,
        element.title,
        element.createtime,
        element.updatetime,
        element.content,
      ]);
    });
    sql_str = "insert into folder_notebook values(?,?);";
    folder_notebook.forEach((element) => {
      db_promise.query(sql_str, [element.folder_id, element.notebookid]);
    });
    return new Promise((resolve, reject) => {
      resolve("成功");
    });
  },

  // 根据文件夹id查询文章
  byFolderIdQueryArticle: function (folderid) {
    let sql =
      "select * from folder_notebook s1,Notebooklist s2 where s1.notebookid = s2.Notebookid and s1.folder_id = ? order by createtime desc";
    return new Promise((resolve, reject) => {
      db.query(sql, [folderid], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ status: "查询成功", data: result });
      });
    });
  },

  // 查询未分类的文章
  SelUnclassifiedArticle: function () {
    const sql_str =
      "select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook ) order by createtime desc;";
    return new Promise((resolve, reject) => {
      db.query(sql_str, (err, results) => {
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
  SelAllArticle: function () {
    return db_promise
      .query("select * from Notebooklist order by createtime desc;", [])
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          data[i].content = data[i].content.substring(0, 16);
        }
        return { status: "成功", data: data };
      });
  },

  // 增加文章
  AddArticle: function (userid, folderid) {
    let sql_str =
      "insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'',now(),now(),'')";
    // 调用3级promise 执行三条语句
    return db_promise
      .query(sql_str, [])
      .then((data) => {
        sql_str =
          "select  * from Notebooklist order by  Notebookid desc limit 1 ;";
        return db_promise.query(sql_str, []); // 查询第一条
      })
      .then((data) => {
        // 对于无文件夹的新建，无需为folder_article表插入记录
        if (folderid == -1 || folderid == -2) {
          console.log("无文件夹");
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
};
