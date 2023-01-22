const DAL_notebookList = require('../DAL/notebookList.js')

module.exports =  {
    ByJsonSaveArticle:  (req)=> {
        const inputJsonObj = req.body
        
        inputJsonObj.forEach(x => {
            queryList = [x.Notebookid,x.authorid,x.title,x.createtime,x.updatetime,x.content]
            DAL_notebookList.ByJsonSaveArticle(queryList)
        });
        return "成功"
    },
}