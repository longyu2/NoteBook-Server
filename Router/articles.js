const express = require("express");
const router = express.Router();
const BLL = require("../BLL/articles");
const multiparty = require("multiparty");
const fs = require("fs");
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

//上传文件
router.post("/upload", (req, res) => {
  let form = new multiparty.Form({ uploadDir: "./public/upload" });
  form.parse(req, (err, fields, files) => {
    // 保证只上传一个文件
    if (files.file.length === 1) {
      const file = files.file[0];
      file.path = file.path.replace("\\", "/");

      // 实际上是使用发送过来的文件本名
      let newpath = form.uploadDir + "/" + file.originalFilename;
      // 要保证新文件与旧文件全不重名，才更换为上传名，如有重名，使用随机名
      const uploadDirFiles = fs.readdirSync(form.uploadDir);

      if (uploadDirFiles.indexOf(file.originalFilename) == -1) {
        fs.renameSync(file.path, newpath);

        res.send({
          status: 200,
          message: "上传文件成功",
          url: newpath.replace("public/", ""),
        });
      } else {
        res.send({
          status: 200,
          message: "上传文件与已有文件重名，已自动随机命名",
          url: file.path.replace("public/", ""),
        });
      }
    }
  });
});

// 修改创建日期
router.put("/createtime", function (req, res) {
  BLL.UpdateCreatetime(req).then((data) => res.send(data));
});

module.exports = router;
