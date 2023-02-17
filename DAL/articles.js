const db = require("./db.js");
const db_promise = require("./db_promise")
module.exports = {
  // 根据json上传文章
  ByJsonSaveArticle: (queryList) => {
    const sql_str = "insert into Notebooklist values(?,?,?,?,?,?);";
    db.query(sql_str, queryList, (err, results) => {
      if (err) {
        console.error(err);
      }
      return "成功";
    });
  },

  // 根据文件夹id查询文章列表
  byFolderIdQueryArticle: function (folderid) {
    let sql =
      "select * from folder_notebook s1,notebooklist s2 where s1.notebookid = s2.Notebookid and s1.folder_id = ?";
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
    const sql_str = "select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook );"
    return new Promise((resolve, reject) => {
      db.query(sql_str, (err, results) => {
        if (err) {
          reject(err)
          return
        }
        const data = JSON.parse(JSON.stringify(results))
        resolve({ status: "成功", data: data })
      })
    })
  },

  // 查询所有文章
  SelAllArticle:function(){
    return db_promise.query("select * from Notebooklist;",[])
  },

  // 增加文章
  AddArticle: function (userid, folderid) {
    let sql_str = "insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'',now(),now(),'')"
    // 调用3级promise 执行三条语句
    return db_promise.query(sql_str, [])
      .then(data => {
        sql_str = "select  * from Notebooklist order by  Notebookid desc limit 1 ;"
        return db_promise.query(sql_str, [])   // 查询第一条
      })
      .then(data => {
        // 对于无文件夹的新建，无需为folder_article表插入记录
        if (folderid == -1 || folderid == -2) {
          console.log("无文件夹")   
          return { status: "成功", data: {message:"新建一篇文章，未放入任何文件夹",articleInfo:data[0]} }
        }
        else {
          const notebookid = data[0].Notebookid   // 从上一次查询中取出刚刚创建完成的文章id
          sql_str = "insert into folder_notebook values(?,?);"
          db_promise.query(sql_str,[folderid,notebookid])
          return { status: "成功", data:{message:"新建一篇文章,放入了文件夹",articleInfo:data[0]}}
        }
      })
  }
}
