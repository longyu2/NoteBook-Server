const db_promise = require("./db_promise");

module.exports = {
  /** 用户上传图片后，将信息保存到数据库 */
  imageAdd: (imagePath, Notebookid) => {
    let sql_str = `insert into images (Notebookid,img_path ) values (${Notebookid},'${imagePath}');`;
    return db_promise.query(sql_str);
  },
};
