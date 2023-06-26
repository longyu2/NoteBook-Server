"use strict";
const nodemailer = require("nodemailer");

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

async function main(message) {
  console.log("走到main");
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `${message.fromName} <longyu@violet-evergarden.net>`, // sender address
    to: message.toAdress, // list of receivers
    subject: message.subject, // Subject line
    text: message.text, // plain text body
    html: message.html, // html body
  });
  console.log("Message sent: %s", info.messageId);
}
