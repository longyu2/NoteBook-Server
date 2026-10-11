const { promises } = require("nodemailer/lib/xoauth2");
const DAL = require("../DAL/articles");
const articles = require("../DAL/articles");

module.exports = {
  /* 搜索（卡片列表）
     返回 { list, total, page, size, q } —— total 用来显示「找到 N 篇」并判断还有没有下一页。
     空关键词直接短路，不打库。 */
  SearchCards: async (req) => {
    const userid = req.user.userid;
    const q = String(req.query.q == null ? "" : req.query.q).trim();

    /* 排序：sort = time（创建时间）| word（正文字数），order = desc（默认）| asc。
       这里就把非法值收敛成默认值，DAL 拿到的只有白名单枚举。 */
    const sort = req.query.sort === "word" ? "word" : "time";
    const order = req.query.order === "asc" ? "asc" : "desc";

    if (q === "") {
      return {
        status: "成功",
        data: { list: [], total: 0, page: 1, size: 0, q: "", sort, order },
      };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const size = Math.min(50, Math.max(1, parseInt(req.query.size, 10) || 24));
    const offset = (page - 1) * size;

    const [list, countRows] = await Promise.all([
      DAL.SearchCards({ userid, q, limit: size, offset, sort, order }),
      DAL.CountSearch({ userid, q }),
    ]);

    return {
      status: "成功",
      data: {
        list,
        total: countRows[0] ? countRows[0].total : 0,
        page,
        size,
        q,
        sort,
        order,
      },
    };
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

  /** 批量删除 */
  DeleteArticles: async (req) => {
    const del_list = req.body.del_sql_notebookid_list;

    for (let i = 0; i < del_list.length; i++) {
      await DAL.DeleteArticles(del_list[i]);
    }

    console.log("qb");
    return "删除已全部完成";
  },

  UpdateArticle: (req) => {
    let [title, content, article_id] = [
      req.body.title,
      req.body.content,
      req.body.Notebookid,
    ];
    return DAL.UpdateArticle(title, content, article_id);
  },

  // 标记文章正文是否由 AI 生成
  SetAiGenerated: (req) => {
    const article_id = req.body.Notebookid;
    const flag = req.body.is_ai_generated;
    return DAL.SetAiGenerated(article_id, flag);
  },

  // 标记文章是否公开
  SetPublic: (req) => {
    const article_id = req.body.Notebookid;
    const flag = req.body.is_public;
    return DAL.SetPublic(article_id, flag);
  },

  /* ===== 下面两个给免鉴权的公开页用，不接受 userid 过滤 ===== */

  // 公开文章列表（卡牌用）
  PublicList: async () => {
    const data = await DAL.SelPublicArticles();
    return { status: "成功", data: data };
  },

  // 单篇公开文章
  PublicArticle: async (req) => {
    const data = await DAL.ByIdGetPublicArticle(req.params.aid);
    return { status: "成功", data: data };
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
    const fid = req.params.fid;
    const notebookList = await DAL.wordCount(userid, fid);
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
