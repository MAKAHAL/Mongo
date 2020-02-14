var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var path = require("path");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios"); 
var request = require('request');
//instead of axios
var cheerio = require("cheerio");


// Require all models
var db = require("./models");

var PORT = 3000;
// for es6
mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/Mongo", { useNewUrlParser: true });

// my handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main", partialsDir: path.join(__dirname, "/views/layouts/notes")}));
app.set('view engine', 'handlebars');


// for my terminal 
// mongoose.connect(MONGODB_URI);
// var conn = mongoose.connection;

// conn.on('error', function(error) {
//     console.log('Mongoose error: ', error);
// });

// conn.once('open', function() {
//     console.log('Mongoose connection successful.');
// });

// Routes
app.get("/", function(req, res) {
  db.Article.find({saved: false}, function(error, data) {
      var hbsObject = {
          article: data
      };
      console.log(hbsObject);
      res.render("home", hbsObject);
  })
})

app.get("/saved", function(req, res) {
  db.Article.find({saved: true})
  .populate("notes")
  .exec(function(error, articles) {
      var hbsObject = {
          article: articles
      };
      res.render("saved", hbsObject);
  });
});



// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.nytimes.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .text();
     result.link = $(this)
 .find("a")
 .attr("href");
        console.log('result', result);

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          // console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          // console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
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

// Create a new note
app.post("/notes/save/:id", function(req, res) {
  var newNote = new db.Note ({
      body: req.body.text,
      article: req.params.id
  });
  newNote.save(function(error, note) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {notes: note}})
  .exec(function(err) {
      if (err) {
          console.log(err);
          res.send(err);
      } else {
          res.send(note);
      }
      });    
  });
});
// Route for saving/updating an Article's associated Note
app.post("/articles/save/:id", function(req, res) {

      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
     db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
    
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
//to delete the article we add app.post delete
app.post("/articles/delete/:id", function(req, res) {
  db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false, notes: [] }, function(err) {
      if (err) {
          console.log(err);
          res.end(err);
      }    
      else {
          db.Note.deleteMany({ article: req.params.id })
          .exec(function(err) {
              if (err) {
                  console.log(err);
                  res.end(err);
              } else
              res.send("Article Deleted");
          });
      }        
  }); 
});
// Delete a note that we created online 147
app.delete('/notes/delete/:note_id/:article_id', function(req, res) {
  db.Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
      if (err) {
          console.log(err);
          res.send(err);
      } else {
          db.Article.findOneAndUpdate({ _id: req.params.article_id }, {$pull: {notes: req.params.note_id}})
          .exec(function(err) {
              if (err) {
                  console.log(err);
                  res.send(err);
              } else {
                  res.end("Note Deleted");
              }
          });
      }
  });
});

app.listen(PORT, function() {
  console.log(`App running on port ${PORT}!`);
})
