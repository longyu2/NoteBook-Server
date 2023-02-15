const DAL_folder = require("../DAL/folders.js");
module.exports = {
  // 往文件夹添加文章
  FolderAddArticle: (req) => {
    const folder_id = req.body.folder_id;
    const article_id = req.body.article_id;
    return DAL_folder.FolderAddArticle(article_id, folder_id);
  },
};
