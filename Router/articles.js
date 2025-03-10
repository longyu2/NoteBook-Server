const express = require("express");
const router = express.Router();
const BLL = require("../BLL/articles");
const multiparty = require("multiparty");

const fs = require("fs");

const marked = require("marked");

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
