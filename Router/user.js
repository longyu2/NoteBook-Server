const express = require("express");
const router = express.Router();
const BLL = require("../BLL/user.js");

// 登录
router.post("/session", (req, res) => {
  BLL.login(req).then((data) => {
    res.send(data);
  });
});

module.exports = router;
