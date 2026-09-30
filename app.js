const express = require("express");
const multiparty = require("multiparty");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const app = express();
const dayjs = require("dayjs");
const path = require("path");
const unzipper = require("unzipper");
var compression = require("compression");
//尽量在其他中间件前使用compression
app.use(compression());

// 路由
const user_router = require("./Router/user");
const articles_router = require("./Router/articles.js");
const folders_router = require("./Router/folders");
const images_router = require("./Router/images");
const disk_router = require("./Router/disk");

const expressJwt = require("express-jwt");

// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(fs.readFileSync("config/server-config.json"));

// 默认加载项
app.use(cors());
app.use(express.static("public"));

// 根据配置项决定加载
if (server_config.token_Verify === true) {
  app.use(
    expressJwt
      .expressjwt({
        secret: server_config.tokenKey, // 签名的密钥 或 PublicKey,
        algorithms: ["HS256"],
        requestProperty: "user",
      })
      .unless({
        path: [
          /^\/v1\/pubarticle.*/,
          "/v1/session",
          "/v1/user",
          "/upload/disk",
          "/upload/thumbnails",
          "/v1/deploy",
          "/v1/deploy-server",
        ], // 指定路径不经过 Token 解析
      })
  );
}

// 一个特殊的硬盘接口，用来部署前端,必须在body-paser之前
app.post("/v1/deploy", async (req, res) => {
  // ===== 0. 校验部署密钥 =====
  const secret = req.headers["x-deploy-secret"];
  if (!secret || secret !== server_config.deploySecret) {
    return res.status(403).send({ status: 403, message: "forbidden" });
  }

  const frontPath = path.resolve("./public/front");
  // 没有front就建立
  if (!fs.existsSync(frontPath)) {
    fs.mkdirSync(frontPath, { recursive: true });
  }
  const tmpDir = path.resolve("./public/tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // 1. 用 multiparty 接收 zip
  const form = new multiparty.Form({ uploadDir: tmpDir });
  console.log("23");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res
        .status(400)
        .send({ status: 400, message: "上传解析失败", error: err.message });
    }
    if (!files.file || files.file.length === 0) {
      return res.status(400).send({ status: 400, message: "没有收到文件" });
    }

    const zipFile = files.file[0];
    const zipPath = zipFile.path;

    try {
      // 2. 清空前端目录
      if (fs.existsSync(frontPath)) {
        fs.rmSync(frontPath, { recursive: true, force: true });
      }
      fs.mkdirSync(frontPath, { recursive: true });

      // 3. 解压到 front 目录
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: frontPath }))
        .promise();

      // 4. 删除临时 zip
      fs.rmSync(zipPath, { force: true });
      console.log("成功");
      res.send({ status: 200, message: "部署成功", url: "/front/" });
    } catch (e) {
      console.error("部署失败：", e);
      res
        .status(500)
        .send({ status: 500, message: "部署失败", error: e.message });
    }
  });
});

const { exec } = require("child_process");

app.post("/v1/deploy-server", (req, res) => {
  const secret = req.headers["x-deploy-secret"];
  if (!secret || secret !== server_config.deploySecret) {
    return res.status(403).send({ status: 403, message: "forbidden" });
  }

  const distPath = path.resolve("./dist.js");
  const bakPath = path.resolve("./dist.js.bak");
  const tmpDir = path.resolve("./public/tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const form = new multiparty.Form({ uploadDir: tmpDir });

  form.parse(req, async (err, fields, files) => {
    if (err)
      return res
        .status(400)
        .send({ status: 400, message: "解析失败", error: err.message });
    if (!files.file || files.file.length === 0) {
      return res.status(400).send({ status: 400, message: "没有收到文件" });
    }

    const uploaded = files.file[0].path;

    try {
      // 1. 备份旧版本
      if (fs.existsSync(distPath)) {
        fs.copyFileSync(distPath, bakPath);
      }

      // 2. 覆盖新版本
      fs.copyFileSync(uploaded, distPath);
      fs.rmSync(uploaded, { force: true });

      // 3. 先响应，再重启
      res.send({ status: 200, message: "部署成功，重启中" });

      setTimeout(() => {
        exec("pm2 reload dist", (e, stdout, stderr) => {
          if (e) {
            console.error("重启失败:", e, stderr);
            // 重启失败，恢复旧版本
            if (fs.existsSync(bakPath)) {
              fs.copyFileSync(bakPath, distPath);
              exec("pm2 reload dist");
            }
          } else {
            console.log("重启成功:", stdout);
          }
        });
      }, 500);
    } catch (e) {
      console.error("部署失败:", e);
      res.status(500).send({ status: 500, message: e.message });
    }
  });
});

const bodyParser = require("body-parser");
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(bodyParser.json({ limit: "100mb" })); //设置post body数据的大小

// 读取请求信息中间件
app.use(function (req, res, next) {
  const now = dayjs();
  console.log(now.format("YYYY/MM/DD HH:mm:ss"), "    ", req.url);
  next();
});

// 设置路由
app.use("/v1", user_router);
app.use("/v1", articles_router);
app.use("/v1", folders_router);
app.use("/v1", images_router);
app.use("/v1", disk_router);

let server;
// 若启用https,则读取密钥和证书
if (server_config.https.verify) {
  const httpsOption = {
    key: fs.readFileSync(server_config.https.ssl_key_address),
    cert: fs.readFileSync(server_config.https.ssl_crt_address),
  };
  server = https.createServer(httpsOption, app);
} else {
  server = app;
}

// 捕获token 错误
app.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send("invalid token");
  }
});

server.listen(server_config.port, () => {
  console.log("服务器已经启动，端口是 " + server_config.port);
});
