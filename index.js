var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;


var Articles, Shares, Views, Clicks, UpVotes, DownVotes;

var url = 'mongodb://localhost:27017/interactions';
MongoClient.connect(url, function(err, db) {
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


var express = require('express');
var app = express();

app.use(express.static('public'));
app.use('/components', express.static('node_modules'));

app.get('/api/views', function(req, res) {
  try {
    var query;
    if(req.query.query) {
      query = JSON.parse(req.query.query);
    }
    Views.find(query).toArray(function(err, views) {
      res.send(views);
    });
  } catch(e) {
    console.log(e);
    res.send(e);
  }
});

app.get('/api/articles', function(req, res) {
  //TODO Connect to mongoDB and query that shit
  var data = [
    { lat: 54.70831, lng: -97.871324},
    { lat: 54.70831, lng: -96.871324},
    { lat: 54.70831, lng: -95.871324},
    { lat: 54.70831, lng: -94.871324},
    { lat: 54.70831, lng: -93.871324}
  ];

  res.send(data);
});

app.listen(2000, function () {
  console.log('Listening on port 2000');
});
