const db = require("./db.js");

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
  SelUnclassifiedArticle:function(){
    const sql_str = "select  * from Notebooklist where Notebookid not in (select notebookid from folder_notebook );"
    return new Promise((resolve,reject)=>{
      db.query(sql_str,(err,results)=>{
        if(err){
          reject(err)
          return
        }
        const data = JSON.parse(JSON.stringify(results))
        resolve({status:"成功",data:data})
      })
    })
  } 
};
