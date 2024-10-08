const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const app = express();
const dayjs = require("dayjs");

var compression = require("compression");
//尽量在其他中间件前使用compression
app.use(compression());

// 路由
const user_router = require("./Router/user");
const articles_router = require("./Router/articles.js");
const folders_router = require("./Router/folders");
const images_router = require("./Router/images");
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
        path: [/^\/v1\/pubarticle.*/, "/v1/session", "/v1/user"], // 指定路径不经过 Token 解析
      }),
  );
}

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

server.listen(9999, () => {
  console.log("server is running in 9999");
});
