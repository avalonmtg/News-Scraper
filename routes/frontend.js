var router = require ("express").Router() 
var db = require ("../models")
router.get("/", function(req, res){
res.render("index")
})

module.exports=router