
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use('/components', express.static('node_modules'));

app.use('/api/articles', function(req, res) {
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
