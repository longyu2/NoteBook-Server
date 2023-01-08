const express = require('express')
const router = express.Router()
const fs = require('fs')
const mysql = require("mysql");


// 读取配置文件，根据配置文件决定要加载的项
const server_config = JSON.parse(fs.readFileSync("server-config.json"));
const db = mysql.createPool(server_config.mysql_setting)



router.get("/getNotebookList",function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    sql_str = "select * from Notebooklist"
    db.query(sql_str,(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(results)
    })           
      
})
router.post("/byIdSelContent",function(req,res){
    Notebookid = req.body.id
    // 查询
    sql_str = "select * from Notebooklist where Notebookid =?"
    db.query(sql_str,[Notebookid],(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(results)    
    })
})
router.get("/addnewNotebook",function(req,res){
    sql_str="insert into Notebooklist(authorid,title,createtime,updatetime,content)  values (1,'',now(),now(),'')"
    //数据库增加
    db.query(sql_str,[],(err,results)=>{})
    //数据库查询
    sql_str="select  *  from Notebooklist where Notebookid = (select max(Notebookid) from Notebooklist) "
    db.query(sql_str,[],(err,results)=>{
        res.send(results)
    })
})
// 修改文章
router.post("/updateContent",function(req,res){
    sql_str = "update Notebooklist set title=?,content=?,updatetime=now() where Notebookid = ?"
    db.query(sql_str,[req.body.title,req.body.content,req.body.Notebookid],(err,results)=>{})
    res.send("修改成功")
})

// 导出
router.get("/output.json",function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Content-Type', 'routerlication/octet-stream')
   
    sql_str = "select * from Notebooklist"
    db.query(sql_str,(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(JSON.stringify(results))
    })           
   
})



// 根据id删除
router.post('/delContent',function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    
    const del_list = req.body.del_sql_notebookid_list
    
    del_list.forEach(element => {
       
        byIdDel(element)        // 调用封装好的单条删除
    });
    res.send("删除成功")
})


 // 由于删除单次只能一条，故封装为函数
 function byIdDel (Notebookid){
    const sql_str="delete from Notebooklist where Notebookid = ?;"
    db.query(sql_str,[Notebookid],(err,results)=>{
        return results
    })
 }


 module.exports = router