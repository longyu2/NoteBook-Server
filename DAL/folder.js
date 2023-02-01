const db = require("./db.js");

module.exports = {
  // 往文件夹添加文章
  FolderAddArticle: (notebookid, folderid) => {
    let sql_str =
      "select count(*) as count from folder_notebook where notebookid =? and  folder_id=?;";
    db.query(sql_str, [notebookid, folderid], (err, results) => {
      if (err) {
        console.error(err);
      } else {
        const count_result = JSON.parse(JSON.stringify(results))[0];

        // 必须判断文章是否已经存在于文件夹，否则数据库重复插入报错
        if (count_result.count == 0) {
          sql_str = "insert into folder_notebook values(?,?)";
          db.query(sql_str, [folderid, notebookid], (err, results) => {
            if (err) {
              console.error(err);
            } else {
              return "添加到文件夹成功";
            }
          });
        }
      }
    });
  },
};
