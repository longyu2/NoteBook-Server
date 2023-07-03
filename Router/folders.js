const express = require("express");
const router = express.Router();
const BLL = require("../BLL/folders");

//查询文件夹
router.get("/folders", function (req, res) {
  BLL.queryFolder(req).then((data) => {
    console.log(data);
    res.send(data);
  });
});

//新建文件夹
router.post("/folders", function (req, res) {
  BLL.createFolder(req).then((data) => res.send(data));
});

// 往文件夹添加文章
router.put("/FolderAddArticle", (req, res) => {
  BLL.FolderAddArticle(req).then((data) => {
    res.send(data);
  });
});

// 修改文件夹
router.put("/folders", (req, res) => {
  BLL.updateFolderName(req).then((data) => res.send(data));
});

// 删除文件夹
router.delete("/folders", (req, res) => {
  BLL.deleteFolderById(req).then((data) => res.send(data));
});
module.exports = router;
