const express = require("express");
const router = express.Router();
const BLL = require("../BLL/user.js");

// 登录
router.post("/session", async (req, res) => {
  res.send(await BLL.login(req));
});

// 注册
router.post("/user", async (req, res) => {
  res.send(await BLL.Regist(req));
});

// 修改密码
router.post("/passwd", async (req, res) => {
  res.send(await BLL.UpdatePasswd(req));
});

// 测试token是否有效
router.get("/testToken", (req, res) => {
  res.send("success");
});

module.exports = router;
