const express = require("express");
const router = express.Router();
const fs = require("fs");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");

const BLL_notebookList = require("./BLL/articles.js");
const BLL_folder = require("./BLL/folders.js");

// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(
  fs.readFileSync("./config/server-config.json")
);

const db = mysql.createPool(server_config.mysql_setting);

module.exports = router;
