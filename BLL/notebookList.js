const DAL_notebookList = require("../DAL/notebookList.js");

module.exports = {
  ByJsonSaveArticle: (req) => {
    const inputJsonObj = req.body;

    inputJsonObj.forEach((x) => {
      queryList = [
        x.Notebookid,
        x.authorid,
        x.title,
        x.createtime,
        x.updatetime,
        x.content,
      ];
      DAL_notebookList.ByJsonSaveArticle(queryList);
    });
    return "成功";
  },
  blltest: function () {
    return DAL_notebookList.byFolderIdQueryArticle().then((rows) => {
      console.log("re bll");
      const s = rows[0];
      console.log(rows[0]);
      return s;
    });
  },
};
