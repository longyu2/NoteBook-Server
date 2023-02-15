const db = require("./db.js");

module.exports = {
  // 往文件夹添加文章
  FolderAddArticle: (notebookid, folderid) => {
    let sql_str =
      "select * from folder_notebook where notebookid =?;";
    return new Promise((resolve, reject) => {
      // 必须判断文章是否已经存在于文件夹，否则数据库重复插入报错
      db.query(sql_str, [notebookid], (err, results) => {
        if (err) {
          reject(err)
          return
        }
        console.log(results)
        if (results.length == 0) {
          sql_str = "insert into folder_notebook values(?,?)";
          db.query(sql_str, [folderid, notebookid], (err, results) => {
            if (err) {
              reject(err);
              return
            }
            resolve({ status: "添加成功",data:`notebokid为${notebookid}的文章已经移入folderid为${folderid}的文件夹`})
          })
        }
        // 如果不等于0，说明该文章在表里有记录，也就是说该文章属于一个文件夹，此时需要做的，是修改，而不是添加
        else{
          sql_str = "update folder_notebook set folder_id = ? where notebookid = ?";
          db.query(sql_str, [folderid, notebookid], (err, results) => {
            if (err) {
              reject(err);
              return
            }
            resolve({ status: "添加成功",data:`notebokid为${notebookid}的文章已经移入folderid为${folderid}的文件夹`})
          })
        }
      });


    }).catch(()=>{})


  },
};
