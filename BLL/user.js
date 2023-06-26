const DAL = require("../DAL/user.js");
module.exports = {
  login: function (req) {
    const name = req.body.username;
    const passwd = req.body.passwd;
    return DAL.login(name, passwd);
  },

  Regist: function (req) {
    const name = req.body.username;
    const passwd = req.body.userpwd;
    const email = req.body.email;
    const verify = req.body.verify;

    return DAL.regist(name, passwd, email, verify);
  },
  UpdatePasswd: function (req) {
    const name = req.body.username;
    const passwd = req.body.passwd;
    return DAL.UpdatePasswd(name, passwd);
  },
};
