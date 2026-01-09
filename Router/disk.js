const express = require("express");
const router = express.Router();
const multiparty = require("multiparty");

// disk省略相关抽象，直接实现上传下载功能，无数据库

const homeDir = "./public/upload/disk";
const fs = require("fs");

// 查找文件夹内的所有文件
router.get("/files/", async (req, res) => {
  if (!fs.existsSync(`./public/upload/disk`)) {
    res.send([]);
  } else {
    res.send(fs.readdirSync(homeDir));
  }
});

router.delete("/file/:filename", async (req, res) => {
  const name = req.params.filename;
  console.log(name);
});

//上传图片
router.post("/filesupload", async (req, res) => {
  let userId = req.user.userid; // 得到userid

  // 如果文件夹不存在，新建文件夹
  if (!fs.existsSync("./public")) {
    fs.mkdirSync("./public");
  }
  if (!fs.existsSync("./public/upload")) {
    fs.mkdirSync("./public/upload");
  }
  if (!fs.existsSync(`./public/upload/disk`)) {
    fs.mkdirSync(`./public/upload/disk`);
  }

  let form = new multiparty.Form({ uploadDir: `./public/upload/disk` });
  form.parse(req, (err, fields, files) => {
    if (files.file.length < 100) {
      let originPath;
      let imgUrlStr = "";
      for (let i = 0; i < files.file.length; i++) {
        const file = files.file[i];

        file.path = file.path.replaceAll("\\", "/");
        originPath = form.uploadDir + "/" + file.originalFilename;
        const uploadDirFiles = fs.readdirSync(form.uploadDir);

        // 由于上传系统已经自动随机命名，这里若文件夹中没有重名文件就将这个随机名重命名回文件本来的名字
        if (uploadDirFiles.indexOf(file.originalFilename) == -1) {
          fs.renameSync(file.path, originPath);
          imgUrlStr += originPath.replace("./public/", "");
        } else {
          imgUrlStr += file.path.replace("public/", "");
        }
      }

      res.send({
        status: 200,
        message: "上传文件成功",
        url: imgUrlStr,
      });
    }
  });
});
module.exports = router;
