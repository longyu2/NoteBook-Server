const express = require("express");
const router = express.Router();
const BLL = require("../BLL/user.js");

// 登录
router.post("/session", (req, res) => {
  BLL.login(req).then((data) => {
    res.send(data);
  });
});

// 修改密码
router.post("/passwd", (req, res) => {
  BLL.UpdatePasswd(req).then((data) => {
    res.send(data);
  });
});

module.exports = router;
