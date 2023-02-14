const DAL = require("../DAL/user.js")
module.exports = {
	login: function (req) {
		const name = req.body.username
		const passwd = req.body.passwd
		return DAL.login(name, passwd)
	},
};
