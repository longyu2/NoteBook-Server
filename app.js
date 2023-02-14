const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const app = express();
const Router = require("./router");
const user_router = require("./Router/user")
const expressJwt = require("express-jwt");

// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(fs.readFileSync("config/server-config.json"));

// 默认加载项
app.use(cors());

app.use(
  expressJwt
    .expressjwt({
      secret: server_config.tokenKey, // 签名的密钥 或 PublicKey,
      algorithms: ["HS256"],
    })
    .unless({
      path: ["/v1/session", "/signup", "/testt"], // 指定路径不经过 Token 解析
    })
);

const bodyParser = require("body-parser");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// 设置路由
app.use("/v1", Router);
app.use("/v1",user_router)
let server;
// 若启用https,则读取密钥和证书
if (server_config.https) {
  const httpsOption = {
    key: fs.readFileSync(
      "../ssl/note.misaka-mikoto.cn_nginx/note.misaka-mikoto.cn.key"
    ),
    cert: fs.readFileSync(
      "../ssl/note.misaka-mikoto.cn_nginx/note.misaka-mikoto.cn_bundle.crt"
    ),
  };
  server = https.createServer(httpsOption, app);
} else {
  server = app;
}

server.listen(9999, () => {
  console.log("在线笔记本服务端已经启动");
});
