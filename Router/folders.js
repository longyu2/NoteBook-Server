const express = require("express");
const router = express.Router();
const BLL = require("../BLL/folders")

// 往文件夹添加文章
router.put("/FolderAddArticle", (req, res) => {
  BLL.FolderAddArticle(req).then((data) => {
    res.send(data)
  });
});


module.exports = router;
