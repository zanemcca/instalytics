var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;


var Articles, Subarticles, Shares, Views, Clicks, UpVotes, DownVotes;

var url = 'mongodb://localhost:27017/';

MongoClient.connect(url + 'interactions', function(err, db) {
  // Create a test collection
  db.collection('view', function(err, collection) {
    Views = collection;
    db.collection('click', function(err, collection) {
      Clicks = collection;
      db.collection('upVote', function(err, collection) {
        UpVotes = collection;
        db.collection('downVote', function(err, collection) {
          DownVotes = collection;
          db.collection('share', function(err, collection) {
            Shares = collection;
          });
        });
      });
    });
  });
});

MongoClient.connect(url + 'articles', function(err, db) {
  // Create a test collection
  db.collection('article', function(err, collection) {
    Articles = collection;
    db.collection('subarticle', function(err, collection) {
      Subarticles = collection;
    });
  });
});


var express = require('express');
var app = express();

var process = function(Model, req, res) {
  try {
    var query;
    if(req.query.query) {
      query = JSON.parse(req.query.query);
    }
    Model.find(query).toArray(function(err, items) {
      res.send(items);
    });
  } catch(e) {
    console.log(e);
    res.send(e);
  }
};

app.use(express.static('public'));
app.use('/components', express.static('node_modules'));

app.get('/api/views', function(req, res) {
  process(Views, req, res);
});
app.get('/api/upvotes', function(req, res) {
  process(UpVotes, req, res);
});
app.get('/api/downvotes', function(req, res) {
  process(DownVotes, req, res);
});
app.get('/api/shares', function(req, res) {
  process(Shares, req, res);
});
app.get('/api/clicks', function(req, res) {
  process(Clicks, req, res);
});
app.get('/api/articles', function(req, res) {
  process(Articles, req, res);
});
app.get('/api/subarticles', function(req, res) {
  process(Subarticles, req, res);
});

app.listen(2000, function () {
  console.log('Listening on port 2000');
});
