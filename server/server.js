var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var database    = require('./config/database');
var Network     = require('./app/models/network');
var port        = process.env.PORT || 8080;
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.listen(port);

app.use(function (req, res, next) {
    // Allow requests from localhost
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

mongoose.connect(database.url); 
var routes = express.Router();
app.use('/api', routes); 

routes.post('/addNetwork', function(req, res) {
  var newNetwork = new Network({
    graph: req.body
  });
  newNetwork.markModified('graph');
  newNetwork.save(function(err) {
    if (err) {
      console.log(err);
      return res.json({success: false, msg: 'Error.'});
    }
    res.json({success: true, msg: 'Successful saved network.'});
  });
});

routes.get('/getNetworks', function(req, res) {
  Network.find({}, function(err, networks) {
    res.json(networks);
  });
});

routes.post('/updateNetwork', function(req, res) {
  Network.findOne({
    'graph.id': req.body.id
  }, function(err, network) {
    network.graph = req.body;
    network.markModified('graph');
    network.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Error.'});
      }
      res.json({success: true, msg: 'Successful updated network.'});
    });
  });
});