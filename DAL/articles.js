const e = require("express");
const db = require("./db.js");
const db_promise = require("./db_promise");
const fs = require("fs");

module.exports = {
  /* ===== 搜索（卡片列表用）=====
     旧的 Search 是字符串拼接，`%` / `_` 会被当成通配符，单引号还能直接改写 SQL，
     而且 select * 会把上千篇全文一次吐出来。这里换成全参数化 + 分页 + 只取卡片字段。

     用 instr() 而不是 like：instr 是字面量子串匹配，用户搜「50%」不会被 % 通配掉。
     instr 在 utf8mb4_general_ci 下大小写不敏感，和原来的 like 行为一致。

     snippet 直接由数据库切好：以首个命中位置为锚，往前留 80 字再取 320 字，
     命中在标题里（instr(content)=0）时 greatest 兜底成从第 1 个字开始。
     前端拿到这段再自己居中裁一次，所以这里给宽一点没关系。 */
  SearchCards: ({ userid, q, limit, offset }) => {
    const sql_str = `
      select Notebookid, authorid, title, createtime, updatetime,
             is_public, is_ai_generated,
             char_length(content) as length,
             substring(content, greatest(1, instr(content, ?) - 80), 320) as snippet
      from Notebooklist
      where authorid = ?
        and (instr(title, ?) > 0 or instr(content, ?) > 0)
      order by createtime desc
      limit ? offset ?;`;
    return db_promise.query(sql_str, [q, userid, q, q, limit, offset]);
  },

  /** 搜索命中总数，给前端显示「找到 N 篇」和判断还有没有下一页 */
  CountSearch: ({ userid, q }) => {
    const sql_str = `
      select count(*) as total
      from Notebooklist
      where authorid = ?
        and (instr(title, ?) > 0 or instr(content, ?) > 0);`;
    return db_promise.query(sql_str, [userid, q, q]);
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
  SelAllArticle: async function (userid) {
    const data = await db_promise.query(
      "select * from Notebooklist where authorid = ? order by createtime desc;",
      [userid]
    );
    for (let i = 0; i < data.length; i++) {
      data[i].length = data[i].content.length;
      data[i].content = data[i].content.substring(0, 16);
    }
    return { status: "成功", data: data };
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

  /** 删除文章 */
  DeleteArticles: async (article_id) => {
    // 如果该文章存在于文件夹中，先删除 folder_article 中的记录，否则会受到外键约束
    let sql_str = "delete from folder_notebook where Notebookid = ?";
    await db_promise.query(sql_str, [article_id]);

    // 然后删除该文章所有的图片
    sql_str = `select img_path from images where notebookid = ${article_id};`;
    const images = await db_promise.query(sql_str);

    // 紧急修复，不再删除图片文件，严重bug，多篇文章引用同一图片的可能性未被考虑，会直接影响到其他文章的图片显示，导致图片无法显示
    // for (let i = 0; i < images.length; i++) {
    //   try {
    //     fs.renameSync(
    //       `./public/${images[i].img_path}`,
    //       `./public/${images[i].img_path.split(".").join("____此图片已删除.")}`
    //     ); //删除图片文件
    //   } catch (err) {
    //     // console.error(err);
    //   }
    // }

    // 清除图片表中的记录
    sql_str = `delete  from images where notebookid = ${article_id};`;
    await db_promise.query(sql_str);

    sql_str = "delete from Notebooklist where Notebookid = ?;";

    return db_promise.query(sql_str, [article_id]);
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

  /** 标记文章正文是否由 AI 生成（V002 新增字段）
   *  单独一个接口，不混进 UpdateArticle：
   *  顶部状态栏的开关手上只有 id，没有 title/content，
   *  走整篇保存会把正文覆盖成空。 */
  SetAiGenerated: (article_id, flag) => {
    let sql_str =
      "update Notebooklist set is_ai_generated = ? where Notebookid = ?";
    return db_promise
      .query(sql_str, [flag ? 1 : 0, article_id])
      .then((data) => {
        return {
          status: "200",
          data: flag ? 1 : 0,
          message: "修改成功",
        };
      });
  },

  /** 标记文章是否公开（V004 新增字段）
   *  和 SetAiGenerated 同理：单独一条 update，只改这一列。 */
  SetPublic: (article_id, flag) => {
    let sql_str = "update Notebooklist set is_public = ? where Notebookid = ?";
    return db_promise
      .query(sql_str, [flag ? 1 : 0, article_id])
      .then((data) => {
        return {
          status: "200",
          data: flag ? 1 : 0,
          message: "修改成功",
        };
      });
  },

  /** 公开文章列表（免鉴权接口用）
   *  只取卡片需要的字段：正文只截前 300 字当摘要，
   *  免得一次把上千篇全文吐出去。 */
  SelPublicArticles: () => {
    const sql_str = `
      select Notebookid, authorid, title, createtime, updatetime,
             left(content, 300) as excerpt,
             char_length(content) as length
      from Notebooklist
      where is_public = 1
      order by createtime desc;`;
    return db_promise.query(sql_str, []);
  },

  /** 单篇公开文章（免鉴权接口用）
   *  必须 is_public = 1 —— 非公开的文章在这里要「当作不存在」，
   *  不能因为知道了 id 就能读到正文。 */
  ByIdGetPublicArticle: (article_id) => {
    const sql_str =
      "select Notebookid, authorid, title, createtime, updatetime, content " +
      "from Notebooklist where Notebookid = ? and is_public = 1";
    return db_promise.query(sql_str, [article_id]);
  },
};
