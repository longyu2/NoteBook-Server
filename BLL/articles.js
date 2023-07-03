const DAL = require("../DAL/articles");

module.exports = {
  // 根据json 上传文章
  ByJsonSaveArticle: (req) => {
    let Notebooklist = req.body.Notebooklist;
    let folder_notebook = req.body.folder_notebook;
    return DAL.ByJsonSaveArticle(Notebooklist, folder_notebook);
  },

  // 根据folder_id 查询 文章
  byFolderIdQueryArticle: (req) => {
    let folderid = req.query.folderid;
    let userid = req.user.userid;
    if (req.query.folderid == null || req.query.folderid == undefined) {
      folderid = -2; // 若请求头不含folderid，则查询全部文章
    }

    if (folderid == -1) {
      // 若folderid == -1 ，则说明需要查询未分类文章
      return DAL.SelUnclassifiedArticle(userid);
    } else if (folderid == -2) {
      // 若folderid == -1 ，则说明需要查询全部文章
      return DAL.SelAllArticle(userid);
    } else {
      return DAL.byFolderIdQueryArticle(folderid, userid); // 既不是查询全部，也不是查询未分类，而是根据文件夹id查询
    }
  },

  // 新增文章
  AddArticle: function (req) {
    console.log(req.user);
    const folderid = req.body.folderid;
    let userid = req.user.userid;

    if (req.user === undefined) {
      userid = 1;
      console.log("usd");
      console.log(userid);
    }

    return DAL.AddArticle(userid, folderid);
  },

  // 导出文章和文件夹信息
  Output: function (req) {
    return DAL.Output();
  },
};
