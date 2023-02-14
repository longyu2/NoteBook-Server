const DAL = require("../DAL/articles");

module.exports = {
  ByJsonSaveArticle: (req) => {
    const inputJsonObj = req.body;
    inputJsonObj.forEach((x) => {
      let queryList = [
        x.Notebookid,
        x.authorid,
        x.title,
        x.createtime,
        x.updatetime,
        x.content,
      ];
      DAL.ByJsonSaveArticle(queryList);
    });
    return "成功";
  },

  // 根据folder_id 查询 文章
  byFolderIdQueryArticle:(req)=>{
    const folderid = req.query.folderid
    console.log(req.query)
    return DAL.byFolderIdQueryArticle(folderid)
  }
};
