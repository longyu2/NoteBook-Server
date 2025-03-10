const mysql = require("mysql");
const fs = require("fs");

// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(fs.readFileSync("config/server-config.json"));
const db = mysql.createPool(server_config.mysql_setting);
module.exports = db;
