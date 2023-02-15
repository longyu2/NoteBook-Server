const DAL = require("../DAL/articles");

module.exports = {
  ByJsonSaveArticle: (req) => {
   
    return new Promise((reslove,reject)=>{
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
      reslove ("成功")
    }) 
  },

  // 根据folder_id 查询 文章
  byFolderIdQueryArticle: (req) => {
    const folderid = req.query.folderid;
    if(folderid == -1){
      // 若folderid == 1 ，则说明需要查询未分类文章
      return DAL.SelUnclassifiedArticle()
    }
    console.log(req.query);
    return DAL.byFolderIdQueryArticle(folderid);
  },
};
