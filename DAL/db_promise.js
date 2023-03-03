const mysql = require("mysql");
const fs = require("fs");
// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(fs.readFileSync("config/server-config.json"));
const db = mysql.createPool(server_config.mysql_setting);

module.exports = {
  query: function (sql_str, QueryOPtions) {
    return new Promise((resolve, reject) => {
      db.query(sql_str, QueryOPtions, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(JSON.parse(JSON.stringify(results)));
      });
    });
  },
};
