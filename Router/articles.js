const express = require("express");
const router = express.Router();
const BLL = require("../BLL/articles");

// 获取文章
router.get("/articles", (req, res) => {
  BLL.byFolderIdQueryArticle(req).then((data) => res.send(data));
});

// 新建文章
router.post("/articles", (req, res) => {
  BLL.AddArticle(req).then((data) => res.send(data));
});
router.get("/backups", (req, res) => {
  BLL.Output(req).then((data) => res.send(data));
});

module.exports = router;
