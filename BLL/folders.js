const DAL = require("../DAL/folders.js");
module.exports = {
  queryFolder: (req) => {
    const userid = req.user.userid;
    return DAL.queryFolder(userid);
  },
  // createFolder创建文件夹
  createFolder: (req) => {
    const userid = req.user.userid;
    const folder_name = req.body.folder_name;
    return DAL.createFolder(folder_name, userid);
  },

  // 往文件夹添加文章
  FolderAddArticle: (req) => {
    const folder_id = req.body.folder_id;
    const article_id = req.body.article_id;
    return DAL.FolderAddArticle(article_id, folder_id);
  },

  // 修改文件夹名
  updateFolderName: (req) => {
    const folder_id = req.body.folder_id;
    const newName = req.body.newName;
    return DAL.updateFolderName(folder_id, newName);
  },
  // 删除文件夹
  deleteFolderById: (req) => {
    const folder_id = req.query.folder_id;
    return DAL.deleteFolderById(folder_id);
  },
};
