
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use('/components', express.static('node_modules'));

app.use('/api/data', function(req, res) {
  var data = [
    { id: 1, text: 'hello' },
    { id: 2, text: 'goodbye' }
  ];

  res.send(data);
});

app.listen(2000, function () {
  console.log('Listening on port 2000');
});
