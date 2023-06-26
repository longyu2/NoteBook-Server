const db = require("./db.js");
const fs = require("fs");
const jwt = require("jsonwebtoken");
// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(
  fs.readFileSync("./config/server-config.json")
);

// 临时存放验证码的变量
let verify_code = {};

module.exports = {
  login: function (name, passwd) {
    const sql_str =
      "select * from userinfo where username = ? and userpwd = ?;";
    return new Promise((resolve, reject) => {
      db.query(sql_str, [name, passwd], (err, results) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        let token;
        if (results.length > 0) {
          token =
            "Bearer " +
            jwt.sign(
              {
                userid: results[0].userid,
                admin: true,
              },
              server_config.tokenKey,
              {
                expiresIn: 3600 * 24 * 3,
              }
            );
        }

        console.log("df");
        if (results.length > 0) {
          resolve({ status: "成功", data: { token: token } });
        } else {
          resolve({ status: "失败", data: { error_status: "账号或密码错误" } });
        }
      });
    }).catch(() => {});
  },

  // 注册
  regist: function (name, passwd, email, verify) {
    console.log(verify);
    console.log(passwd);

    // verify 为空，发送验证码
    if (verify == "") {
      let X = "";
      for (let i = 0; i < 6; i++) {
        X += Math.floor(Math.random() * 10);
      }
      verify_code.name = name;
      verify_code.code = X;
      const message = {
        fromName: "在线笔记",
        toAdress: email,
        subject: "注册验证码",
        text: "验证码0000",
        html: `
        您好，${name},请输入下面的验证码来完成注册。如果不是您本人操作，请忽略此消息。
        <br/>
        <b>${X}</b>`,
      };

      return new Promise((resolve, reject) => {
        async function main() {
          // send mail with defined transport object
          const info = await transporter.sendMail({
            from: `${message.fromName} <longyu@violet-evergarden.net>`, // sender address
            to: message.toAdress, // list of receivers
            subject: message.subject, // Subject line
            text: message.text, // plain text body
            html: message.html, // html body
          });
          console.log("Message sent: %s", info.messageId);
          resolve("成功");
        }
        main().catch(console.error);
      });
    }
    // verify 不为空，检验验证码是否正确
    else {
      console.log(verify_code.code);

      if (verify == verify_code.code && name == verify_code.name) {
        let sql_str =
          "insert into userinfo (username,userpwd,email) values(?,?,?)";
        return new Promise((resolve, reject) => {
          db.query(sql_str, [name, passwd, email], (err, results) => {
            if (err) {
              reject(err);
            }
            resolve({ code: 200, status: "注册成功" });
          });
        });
      }
    }
  },

  UpdatePasswd: function (name, passwd) {
    const sql_str = "update  userinfo set userpwd =? where username = ? ;";
    return new Promise((resolve, reject) => {
      db.query(sql_str, [passwd, name], (err, results) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }

        resolve({ status: "成功", data: "修改成功" });
      });
    });
  },
};

("use strict");
const nodemailer = require("nodemailer");
const { resolve } = require("path");
const db_promise = require("./db_promise.js");

const transporter = nodemailer.createTransport({
  host: "smtp.exmail.qq.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "longyu@violet-evergarden.net",
    pass: "20010506longyuL.",
  },
});
