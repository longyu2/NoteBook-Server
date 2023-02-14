const express = require("express");
const router = express.Router();
const fs = require("fs");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");

const BLL_notebookList = require("./BLL/articles.js");
const BLL_folder = require("./BLL/folder.js");

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
router.get("/addnewNotebook", function (req, res) {
  let sql_str =
    "insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'',now(),now(),'')";
  //数据库增加
  db.query(sql_str, [], (err, results) => {
    // 必须嵌套进回调函数，不然查询会先执行
    //数据库查询
    sql_str =
      "select  *  from Notebooklist where Notebookid = (select max(Notebookid) from Notebooklist) ";
    db.query(sql_str, [], (err, results) => {
      res.send(results);
    });
  });
});
// 修改文章
router.post("/updateContent", function (req, res) {
  let sql_str =
    "update Notebooklist set title=?,content=?,updatetime=now() where Notebookid = ?";
  db.query(
    sql_str,
    [req.body.title, req.body.content, req.body.Notebookid],
    (err, results) => {}
  );
  res.send("修改成功");
});

// 导出
router.get("/output", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "routerlication/octet-stream");

  let sql_str = "select * from Notebooklist";
  db.query(sql_str, (err, results) => {
    if (err) return console.log(err.message);
    res.send(JSON.stringify(results));
  });
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

//新建文件夹
router.post("/CreateFolder", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let sql_str = "insert into  folders  (folder_name) values (?)";
  db.query(sql_str, [req.body.folder_name], (err, results) => {
    if (err) return console.log(err.message);

    // 新建完成后查询最新文件夹并返回
    db.query(
      "select * from  folders order by folder_id desc limit 1",
      [],
      (err, results) => {
        if (err) return console.log(err.message);
        res.send(JSON.parse(JSON.stringify(results)));
      }
    );
  });
});

// 删除文件夹

// 从json文件导入文章
router.post("/ByJsonSaveArticle", (req, res) => {
  res.send(BLL_notebookList.ByJsonSaveArticle(req));
});

// 往文件夹添加文章
router.post("/FolderAddArticle", (req, res) => {
  BLL_folder.FolderAddArticle(req).then((data) => res.send(data));
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
