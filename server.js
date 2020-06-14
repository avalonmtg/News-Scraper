var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars")

var axios = require("axios");
var cheerio = require("cheerio");
var frontend = require("./routes/frontend");

var db = require("./models");

var PORT = process.env.PORT || 3000;


var app = express();


app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/samscraper";
mongoose.connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });


app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(frontend)


app.get("/test", function (req, res) { res.render("saved") });

app.get("/scrape", function (req, res) {
  axios.get("https://www.nytimes.com").then(res => {
    var $ = cheerio.load(res.data)
    console.log($, "$")
    
    $(".assetWrapper").each((i, element) => {
      console.log(element, "element")
      var result = {}
       result.title = $(element).find("h2").text().trim()
      result.link = $(element).find("a").attr("href")
      result.summary = $(element).find("p").text().trim()
      db.Article.create(result).then(() => {
      
      })
      .catch(err => {
        console.log(err)
      })

    })
    res.send("Scraped Articles")
   
  });

})


app.get("/articles", function (req, res) {
  
  db.Article.find({})
    .then(function (dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function (err) {
    
      res.json(err);
    });
});


app.get("/articles/:id", function (req, res) {
  
  db.Article.findOne({ _id: req.params.id })
   
    .populate("note")
    .then(function (dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function (err) {
      
      res.json(err);
    });
});


app.post("/articles/:id", function (req, res) {
  
  db.Note.create(req.body)
    .then(function (dbNote) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function (err) {
  
      res.json(err);
    });
});

app.delete("/articles/:id", function (req, res) {
 
  db.Article.remove({ _id: req.params.id })

    .then(function (dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function (err) {
   
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
