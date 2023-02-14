const express = require('express')
const router = express.Router()
const BLL = require("../BLL/articles")

// 获取文章
router.get("/articles", (req, res) => {
    // 如果没有查询信息id，返回全部，如果有。按查询信息查询
   if(req.query.folderid == null){
    res.send({status:"查询失败",data:"请给与正确参数来查询！"})
   }
   else{
     BLL.byFolderIdQueryArticle(req).then(data=>{res.send(data)})
   }
})

module.exports = router