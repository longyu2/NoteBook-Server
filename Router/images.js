const express = require("express");
const router = express.Router();
const BLL = require("../BLL/images");

//增加图片
router.post("/image", async (req, res) => {
  res.send(await BLL.imageAdd(req));
});

module.exports = router;
