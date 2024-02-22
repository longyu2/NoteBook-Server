const { promises } = require("nodemailer/lib/xoauth2");
const DAL = require("../DAL/articles");
const articles = require("../DAL/articles");

module.exports = {
  // 搜索功能
  Search: async (req) => {
    const userid = req.user.userid;
    const queryKey = req.params.key;
    return await DAL.Search({ queryKey, userid });
  },

  // 根据id查询文章
  ByIdGetArticle: (req) => {
    const article_id = req.params.aid;
    return DAL.ByIdGetArticle(article_id);
  },
  // 根据json 上传文章
  ByJsonSaveArticle: (req) => {
    let Notebooklist = req.body.Notebooklist; // 存储着所有需存储的文章的对象数组
    let folderName = req.body.folderName; // 存储着这一次所有文章的文件夹名
    let user_id = req.user.userid;
    return DAL.ByJsonSaveArticle(Notebooklist, folderName, user_id);
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
    const folderid = req.body.folderid;
    let userid = req.user.userid;

    if (req.user === undefined) {
      userid = 1;
    }

    return DAL.AddArticle(userid, folderid);
  },

  // 导出文章和文件夹信息
  Output: function (req) {
    return DAL.Output();
  },

  DeleteArticles: (req) => {
    const del_list = req.body.del_sql_notebookid_list;
    return new Promise((resolve, reject) => {
      let index = 0;
      del_list.forEach((article_id) => {
        DAL.DeleteArticles(article_id); // 调用封装好的单条删除
        if (index == del_list.length - 1) {
          resolve("删除全部完成");
        }
        index++;
      });
    });
  },

  UpdateArticle: (req) => {
    let [title, content, article_id] = [
      req.body.title,
      req.body.content,
      req.body.Notebookid,
    ];
    return DAL.UpdateArticle(title, content, article_id);
  },
  // 更改创建时间
  UpdateCreatetime: (req) => {
    const notebookId = req.body.notebookId;
    const newCreatetime = req.body.newCreatetime;
    return DAL.UpdateCreatetime(notebookId, newCreatetime);
  },

  // 获取生涯总字数
  wordCount: async (req) => {
    const userid = req.user.userid;
    const notebookList = await DAL.wordCount(userid);
    let count = 0;
    for (let i = 0; i < notebookList.length; i++) {
      count += notebookList[i].content.length;
    }
    return {
      status: 200,
      data: count,
      message: "成功",
    };
  },
};
