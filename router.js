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
router.get("/getNotebookList", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let sql_str = "select * from Notebooklist";
  db.query(sql_str, (err, results) => {
    if (err) return console.log(err.message);
    res.send(results);
  });
});
router.post("/byIdSelContent", function (req, res) {
  Notebookid = req.body.id;
  // 查询
  let sql_str = "select * from Notebooklist where Notebookid =?";
  db.query(sql_str, [Notebookid], (err, results) => {
    if (err) return console.log(err.message);
    res.send(results);
  });
});

// 修改文章
router.post("/updateContent", function (req, res) {
  console.log(req.body);
  let sql_str =
    "update Notebooklist set title=?,content=?,updatetime=now() where Notebookid = ?";
  db.query(
    sql_str,
    [req.body.title, req.body.content, req.body.Notebookid],
    (err, results) => {
      res.send("修改成功");
    }
  );
});

// 根据id删除
router.post("/delContent", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const del_list = req.body.del_sql_notebookid_list;

  del_list.forEach((element) => {
    byIdDel(element); // 调用封装好的单条删除
  });
  res.send("删除成功");
});

//查询文件夹
router.get("/QueryFolder", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let sql_str = "select * from folders";
  db.query(sql_str, [], (err, results) => {
    if (err) return console.log(err.message);
    const folders = JSON.parse(JSON.stringify(results));
    res.send(folders);
  });
});

// 删除文件夹

// 从json文件导入文章
router.post("/ByJsonSaveArticle", (req, res) => {
  BLL_notebookList.ByJsonSaveArticle(req).then((data) => res.send(data));
});

// 由于删除单次只能一条，故封装为函数
function byIdDel(Notebookid) {
  // 如果该文章存在于文件夹中，先删除 folder_article 中的记录，否则会受到外键约束
  let sql_str = "delete from folder_notebook where Notebookid = ?";
  db.query(sql_str, [Notebookid], (err, results) => {
    if (err) {
      console.error(err);
    } else {
      // 如无误，则继续
      sql_str = "delete from Notebooklist where Notebookid = ?;";
      db.query(sql_str, [Notebookid], (err, results) => {
        if (err) {
          console.error(err);
        }
        return results;
      });
    }
  });
}

// 测试token是否有效
router.get("/testToken", (req, res) => {
  res.send("success");
});

module.exports = router;
