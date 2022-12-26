const express = require("express")
const mysql = require('mysql')
const cors = require('cors')
const https = require('https')
const fs = require("fs")

const httpsOption = {
    key : fs.readFileSync("../ltyis.com_nginx/ltyis.com.key"),
    cert: fs.readFileSync("../ltyis.com_nginx/ltyis.com_bundle.crt")
}


const app = express()




app.use(cors())
const bodyParser = require('body-parser')

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



const db = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'20010506longyuL.',
    database:'NotebookDB',
    timezone:"08:00"
})


const server = https.createServer(httpsOption, app)


server.listen(9999,()=>{
    console.log("在线笔记本服务端已经启动")
})




app.get("/getNotebookList",function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    sql_str = "select * from Notebooklist"
    db.query(sql_str,(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(results)
    })           
      
})
app.post("/byIdSelContent",function(req,res){
    Notebookid = req.body.id
    // 查询
    sql_str = "select * from Notebooklist where Notebookid =?"
    db.query(sql_str,[Notebookid],(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(results)    
    })
})
app.get("/addnewNotebook",function(req,res){
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
app.post("/updateContent",function(req,res){
    sql_str = "update Notebooklist set title=?,content=?,updatetime=now() where Notebookid = ?"
    db.query(sql_str,[req.body.title,req.body.content,req.body.Notebookid],(err,results)=>{})
    res.send("修改成功")
})

// 导出
app.get("/output.json",function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Content-Type', 'application/octet-stream')
   
    sql_str = "select * from Notebooklist"
    db.query(sql_str,(err,results)=>{
        if(err) return console.log(err.message)      
        res.send(JSON.stringify(results))
    })           
   
})




// 根据id删除
app.post('/delContent',function(req,res){
    res.setHeader('Access-Control-Allow-Origin','*')
    // console.log(req.body)

    const del_list = req.body.del_sql_notebookid_list
    

    del_list.forEach(element => {
        console.log(element)
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