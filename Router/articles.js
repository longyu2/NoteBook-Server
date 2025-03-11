const express = require("express");
const router = express.Router();
const BLL = require("../BLL/articles");
const multiparty = require("multiparty");

const fs = require("fs");

const marked = require("marked");
const db_promise = require("../DAL/db_promise");
const { log } = require("console");

// 搜索功能
// 获取文章
router.get("/search/:key", async (req, res) => {
  res.send(await BLL.Search(req));
});

// 获取文章
router.get("/articles", async (req, res) => {
  res.send(await BLL.byFolderIdQueryArticle(req));
});

// 新建文章
router.post("/articles", async (req, res) => {
  res.send(await BLL.AddArticle(req));
});
router.get("/backups", async (req, res) => {
  res.send(await BLL.Output(req));
});

// 根据id查询文章信息
router.get("/article/:aid", async (req, res) => {
  res.send(await BLL.ByIdGetArticle(req));
});

// 从json文件导入文章
router.post("/ByJsonSaveArticle", async (req, res) => {
  res.send(await BLL.ByJsonSaveArticle(req));
});

// 根据id数组删除
router.delete("/articles", async (req, res) => {
  res.send(await BLL.DeleteArticles(req));
});

// 修改文章
router.put("/article", async (req, res) => {
  res.send(await BLL.UpdateArticle(req));
});

//上传图片
router.post("/upload", (req, res) => {
  let userId = req.user.userid; // 得到userid

  // 如果文件夹不存在，新建文件夹
  if (!fs.existsSync("./public")) {
    fs.mkdirSync("./public");
  }
  if (!fs.existsSync("./public/upload")) {
    fs.mkdirSync("./public/upload");
  }
  if (!fs.existsSync(`./public/upload/${userId}`)) {
    fs.mkdirSync(`./public/upload/${userId}`);
  }

  let form = new multiparty.Form({ uploadDir: `./public/upload/${userId}` });
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

// 修改创建日期
router.put("/createtime", async (req, res) => {
  res.send(await BLL.UpdateCreatetime(req));
});

// 将文章生成可以暴露给外界访问的html
// 修改创建日期
router.put("/pubarticle/:aid", (req, res) => {
  // 借助bll查询
  BLL.ByIdGetArticle(req).then((data) => {
    const article = data[0];
    let document = marked.parse(`# ${article.title}\n${article.content}`);
    let str = `<!DOCTYPE html>
    <html lang = "en" >
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">

                <meta name="color-scheme" content="light dark">
                <link rel="stylesheet" href="github-markdown.css">
                    <title>${article.title}</title>
                      <style>
                        body {
                            box-sizing: border-box;
                            min-width: 200px;
                            max-width: 980px;
                            margin: 0 auto;
                            padding: 45px;
                        }
            
                        @media (prefers-color-scheme: dark) {
                            body {
                                background-color: #0d1117;
                            }
                        }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.3/gh-fork-ribbon.min.css">
                    <style>
                        .github-fork-ribbon:before {
                            background-color: #121612;
                        }
                    </style>
                </head>
                <body>
                         <article class="markdown-body">
                    ${document}
                    </article>
                </body>
      </html>`;

    fs.writeFileSync(`public/pubhtml/${req.params.aid}.html`, str);
    res.send({
      status: "200",
      url: `pubhtml/${req.params.aid}.html`,
    });
  });
});

// 查看生涯总字数
router.get("/wordCount/:fid", async (req, res) => {
  res.send(await BLL.wordCount(req));
});

module.exports = router;
