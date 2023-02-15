const express = require("express");
const router = express.Router();
const BLL = require("../BLL/user.js");

router.post("/session", (req, res) => {
  BLL.login(req).then((data) => {
    console.log(data);
    res.send(data);
  });
});

module.exports = router;
