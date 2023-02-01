const db = require("./db.js");

module.exports = {
  ByJsonSaveArticle: (queryList) => {
    const sql_str = "insert into Notebooklist values(?,?,?,?,?,?);";
    db.query(sql_str, queryList, (err, results) => {
      if (err) {
        console.error(err);
      }
      return "成功";
    });
  },
  byFolderIdQueryArticle: function () {
    let sql = "select * from userinfo";
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("mqsql数据已取出");
        resolve(result);
      });
    });
  },
};
