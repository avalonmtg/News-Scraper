var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars")
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
var frontend = require("./routes/frontend");
// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/samscraper";
mongoose.connect(MONGODB_URI);
// Routes

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(frontend)
// A GET route for scraping the echoJS website
app.get("/test", function(req,res) {res.render("saved")});
app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com").then (res => {
    var $=cheerio.load(res.data)
    var scrapedArticles = []
    $(".assetWrapper").each((i, element) => {
      var result = {}
      result.title = $(this).find("h2").text().trim()
      result.link = $(this).find("a").attr("href")
      result.description = $(this).find("p").text().trim()
      db.Article.create(result).then (() => {

      })
      .catch(err => {
        console.log(err)
      })
scrapedArticles.push(result)
    })
    console.log(scrapedArticles)
    res.send(scrapedArticles)
  })

    });


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.delete("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that updates the matching one in our db...
  db.Article.remove({ _id: req.params.id})

  .then(function(dbArticle) {
    // If we were able to successfully find an Article with the given id, send it back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });
});



// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
