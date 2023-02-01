const DAL_folder = require("../DAL/folder.js");
module.exports = {
  // 往文件夹添加文章
  FolderAddArticle: (req) => {
    console.log(req.body);
    const folder_id = req.body.folder_id;
    const check_id_list = req.body.check_id_list;

    check_id_list.forEach((element) => {
      return DAL_folder.FolderAddArticle(element, folder_id);
    });
  },
};
