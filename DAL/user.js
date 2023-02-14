const db = require("./db.js");
const fs = require("fs")
const jwt = require("jsonwebtoken")

// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(
  fs.readFileSync("./config/server-config.json")
);

module.exports = {


  login: function (name, passwd) {
    const sql_str =
      "select * from userinfo where username = ? and userpwd = ?;";
    return new Promise((resolve, reject) => {
      db.query(sql_str,[name,passwd] ,(err, results) => {
        if (err) {
          console.log(err)
          reject(err)
          return
        }
        const token =
          "Bearer " +
          jwt.sign(
            {
              _id: 1,
              admin: true,
            },
            server_config.tokenKey,
            {
              expiresIn: 3600 * 24 * 3,
            }
          );
        console.log("df")
        if (results.length > 0) {
          console.log("成功")
          resolve({ status: "成功", data: { token: token } })
        }
        else {
          console.log("失败")

          resolve({ status: "失败", data: { error_status: "账号或密码错误" } })
        }
      });
    }).catch(()=>{});
  },














}
