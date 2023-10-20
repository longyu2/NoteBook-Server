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

// 根据id查询文章信息
router.get("/article/:aid", function (req, res) {
  BLL.ByIdGetArticle(req).then((data) => res.send(data));
});

// 从json文件导入文章
router.post("/ByJsonSaveArticle", (req, res) => {
  BLL.ByJsonSaveArticle(req).then((data) => res.send(data));
});

// 根据id数组删除
router.delete("/articles", function (req, res) {
  BLL.DeleteArticles(req).then((data) => res.send(data));
});

// 修改文章
router.put("/article", function (req, res) {
  BLL.UpdateArticle(req).then((data) => res.send(data));
});

module.exports = router;
