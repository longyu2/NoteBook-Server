const DAL = require("../DAL/images.js");

module.exports = {
  /** 图片上传后，信息写入数据库 */
  imageAdd: (req) => {
    const imagePath = req.body.imagePath;
    const Notebookid = req.body.Notebookid;
    return DAL.imageAdd(imagePath, Notebookid);
  },
};
