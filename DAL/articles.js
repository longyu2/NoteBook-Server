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
  SearchCards: ({ userid, q, folderid, limit, offset, sort, order }) => {
    /* 排序白名单：列名不能用占位符，所以只能靠枚举映射成写死的 SQL 片段，
       请求里的 sort/order 永远只是「选哪一项」，绝不会被拼进语句。
       sort=createtime 按创建时间（默认），sort=updatetime 按更新时间，sort=word 按正文字数；
       order=asc 正序，其余一律倒序。

       第二个排序键固定 Notebookid desc：库里大量 0 字/同秒创建的文章，
       只按首列排的话它们之间顺序由 MySQL 随便给，翻页会出现重复或漏掉。 */
    const sort_column =
      sort === "word"
        ? "char_length(content)"
        : sort === "updatetime"
          ? "updatetime"
          : "createtime";
    const sort_order = order === "asc" ? "asc" : "desc";

    /* 搜索范围：folderid 传了具体值（不是 -2 全部）就限定在该文件夹里。
       阅览模式勾了「当前文件夹」时走这里；主页搜索不带这个参数，行为和原来一致。 */
    let scope = "";
    const params = [q, userid, q, q];
    if (folderid === -1) {
      scope +=
        " and Notebookid not in (select notebookid from folder_notebook)";
    } else if (folderid !== -2 && folderid !== undefined && folderid !== null) {
      scope +=
        " and Notebookid in (select notebookid from folder_notebook where folder_id = ?)";
      params.push(folderid);
    }
    params.push(limit, offset);

    const sql_str = `
      select Notebookid, authorid, title, createtime, updatetime,
             is_public, is_ai_generated,
             char_length(content) as length,
             substring(content, greatest(1, instr(content, ?) - 80), 320) as snippet
      from Notebooklist
      where authorid = ?
        and (instr(title, ?) > 0 or instr(content, ?) > 0)${scope}
      order by ${sort_column} ${sort_order}, Notebookid desc
      limit ? offset ?;`;
    return db_promise.query(sql_str, params);
  },

  /** 搜索命中总数，给前端显示「找到 N 篇」和判断还有没有下一页 */
  CountSearch: ({ userid, q, folderid }) => {
    let scope = "";
    const params = [userid, q, q];
    if (folderid === -1) {
      scope +=
        " and Notebookid not in (select notebookid from folder_notebook)";
    } else if (folderid !== -2 && folderid !== undefined && folderid !== null) {
      scope +=
        " and Notebookid in (select notebookid from folder_notebook where folder_id = ?)";
      params.push(folderid);
    }

    const sql_str = `
      select count(*) as total
      from Notebooklist
      where authorid = ?
        and (instr(title, ?) > 0 or instr(content, ?) > 0)${scope};`;
    return db_promise.query(sql_str, params);
  },

  /* ===== 阅览模式：全量文章分页列表 =====
     和搜索的区别只有「不筛关键词」，其余（排序白名单、分页、字段裁剪）完全一致，
     所以卡片和搜索页是同一套观感。

     排序白名单和 SearchCards 同一套规矩：列名不能用占位符，只能枚举映射成写死片段。
     第二排序键固定 Notebookid desc，防 0 字/同秒文章翻页重复漏项。

     snippet 给 content 开头一段 —— 阅览模式没有命中位置，前端当作纯文本预览，
     不做高亮。长度跟搜索的 snippet 对齐（320）。 */
  ListCards: ({ userid, folderid, limit, offset, sort, order }) => {
    const sort_column =
      sort === "word"
        ? "char_length(content)"
        : sort === "updatetime"
          ? "updatetime"
          : "createtime";
    const sort_order = order === "asc" ? "asc" : "desc";

    let where = "n.authorid = ?";
    const params = [userid];

    /* 文件夹筛选：-2 = 全部笔记（默认，不加条件），-1 = 未分类，
       其余是具体 folder_id —— 走 folder_notebook 关联。 */
    if (folderid === -1) {
      where +=
        " and n.Notebookid not in (select notebookid from folder_notebook)";
    } else if (folderid !== -2 && folderid !== undefined && folderid !== null) {
      where +=
        " and n.Notebookid in (select notebookid from folder_notebook where folder_id = ?)";
      params.push(folderid);
    }

    const sql_str = `
      select n.Notebookid, n.authorid, n.title, n.createtime, n.updatetime,
             n.is_public, n.is_ai_generated,
             char_length(n.content) as length,
             substring(n.content, 1, 320) as snippet
      from Notebooklist n
      where ${where}
      order by ${sort_column} ${sort_order}, n.Notebookid desc
      limit ? offset ?;`;
    return db_promise.query(sql_str, [...params, limit, offset]);
  },

  /** 阅览模式的总数，给分页器用 */
  CountList: ({ userid, folderid }) => {
    let where = "n.authorid = ?";
    const params = [userid];

    if (folderid === -1) {
      where +=
        " and n.Notebookid not in (select notebookid from folder_notebook)";
    } else if (folderid !== -2 && folderid !== undefined && folderid !== null) {
      where +=
        " and n.Notebookid in (select notebookid from folder_notebook where folder_id = ?)";
      params.push(folderid);
    }

    const sql_str = `select count(*) as total from Notebooklist n where ${where};`;
    return db_promise.query(sql_str, params);
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
    /* 和 SelAllArticle 保持一致：额外带出真实字数（char_length）并把 content 截到 16 字，
       否则主页列表卡片的「N 字」在这个分支下全是 0（前端读 item.length，此前只有
       «全部笔记» 分支才赋这个字段）。
       select * 之上再补 char_length，避免把上千篇全文都传回前端。 */
    let sql =
      "select s1.*, s2.*, char_length(s2.content) as length, substring(s2.content, 1, 16) as content " +
      "from folder_notebook s1, Notebooklist s2 " +
      "where s1.notebookid = s2.Notebookid and s1.folder_id = ? and s2.authorid = ? " +
      "order by s2.createtime desc";
    return new Promise((resolve, reject) => {
      db.query(sql, [folderid, userid], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        /* s1.* 和 s2.* 都带 Notebookid，后出现的 s2.content 会覆盖 s1 的同名列；
           上面已把 s2.content 换成 16 字截断版，这里只需补回字符串类型的 length
           （char_length 在 mysql 驱动里可能回字符串，前端做 `|| 0` 前先转数字）。 */
        const data = result.map((row) => ({
          ...row,
          length: parseInt(row.length, 10) || 0,
        }));
        resolve({ status: "查询成功", data: data });
      });
    });
  },

  // 查询未分类的文章
  SelUnclassifiedArticle: function (userid) {
    /* 同样补齐 length + 截断 content，理由见 byFolderIdQueryArticle */
    const sql_str =
      "select *, char_length(content) as length, substring(content, 1, 16) as content " +
      "from Notebooklist where Notebookid not in (select notebookid from folder_notebook) " +
      "and authorid = ? order by createtime desc;";
    return new Promise((resolve, reject) => {
      db.query(sql_str, [userid], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        const data = JSON.parse(JSON.stringify(results));
        for (let i = 0; i < data.length; i++) {
          data[i].length = parseInt(data[i].length, 10) || 0;
        }

        resolve({ status: "成功", data: data });
      });
    });
  },

  // 查询所有文章
  SelAllArticle: async function (userid) {
    /* 只取卡片需要的字段：正文截到 16 字当预览，另用 char_length 带出真实字数。
       不要用「先查全文再 data[i].length = content.length」那套 —— 全文会白传一遍，
       而且 JS 的 .length 数的是 UTF-16 码元，含 emoji 时和 MySQL 的 char_length 对不上。 */
    const data = await db_promise.query(
      "select Notebookid, authorid, title, createtime, updatetime, " +
        "is_public, is_ai_generated, char_length(content) as length, " +
        "substring(content, 1, 16) as content " +
        "from Notebooklist where authorid = ? order by createtime desc;",
      [userid]
    );
    for (let i = 0; i < data.length; i++) {
      data[i].length = parseInt(data[i].length, 10) || 0;
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
