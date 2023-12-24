const express = require("express");
const router = express.Router();
const BLL = require("../BLL/folders");

//查询文件夹
router.get("/folders", async (req, res) => {
  res.send(await BLL.queryFolder(req));
});

//新建文件夹
router.post("/folders", async (req, res) => {
  res.send(await BLL.createFolder(req));
});

// 往文件夹添加文章
router.put("/FolderAddArticle", async (req, res) => {
  res.send(await BLL.FolderAddArticle(req));
});

// 修改文件夹
router.put("/folders", async (req, res) => {
  res.send(await BLL.updateFolderName(req));
});

// 删除文件夹
router.delete("/folders", async (req, res) => {
  res.send(await BLL.deleteFolderById(req));
});
module.exports = router;
