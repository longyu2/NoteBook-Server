const db = require('./db.js')

module.exports = 
{
   ByJsonSaveArticle:(queryList)=>{
       
       const sql_str = 'insert into Notebooklist values(?,?,?,?,?,?);'
       db.query(sql_str,queryList,(err,results)=>{
           if (err){console.error(err)}
           return "成功"
       })
   }
}