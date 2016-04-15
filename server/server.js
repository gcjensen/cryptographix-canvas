var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport    = require('passport');
var database    = require('./config/database');
var secret      = require('./config/secret');
var User        = require('./app/models/user');
var Network     = require('./app/models/network');
var port        = process.env.PORT || 8080;
var jwt         = require('jwt-simple');
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(passport.initialize());
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
require('./config/passport')(passport);
var routes = express.Router();
app.use('/api', routes); 

// create a new user with the username and password
routes.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({ success: false, msg: 'Please provide a username and password' });
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    newUser.save(function(err) {
      if (err) {
        return res.json({ success: false, usernameTaken: true });
      }
      var token = jwt.encode(newUser, secret.key);
      // seemed to be some weird requirement that token is prefixed with JWT
      res.json({ success: true, token: 'JWT ' + token, username: newUser.username });
    });
  }
});
 
// authenticate user and provide them with their unique JWT
routes.post('/login', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (!user) {
      // user is given generic message regardless of whether the username or password is wrong
      res.send({success: false, msg: 'Login failed.'});
    } else {
      user.checkPassword(req.body.password, function (err, success) {
        if (success && !err) {
          var token = jwt.encode(user, secret.key);
          // seemed to be some weird requirement that token is prefixed with JWT
          res.json({success: true, token: 'JWT ' + token, username: user.username});
        } else {
          // user is given generic message regardless of whether the username or password is wrong
          res.send({success: false, msg: 'Login failed'});
        }
      });
    }
  });
});

routes.post('/addNetwork', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = req.headers.authorization.split(' ')[1];
  var decoded = jwt.decode(token, secret.key);
  User.findOne({
    username: decoded.username
  }, function(err, user) {
    if (!user) {
      return res.status(403).send({success: false, msg: 'Sign in to save your network'});
    } else {   
      console.log(req.body);
      var newNetwork = new Network({
        owner: decoded.username,
        graph: req.body
      });
      newNetwork.markModified('network');
      newNetwork.save(function(err) {
        if (err) {
          return res.json({success: false, msg: 'Error.'});
        }
        res.json({success: true, msg: 'Successful saved network.'});
      });
    }
  });
});

routes.get('/getAllNetworks', function(req, res) {
  Network.find({}, function(err, projects) {
    res.json(projects);
  });
});

// get the networks of a signed in user
routes.get('/getUserNetworks', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = req.headers.authorization.split(' ')[1];
  var decoded = jwt.decode(token, secret.key);
  User.findOne({
    username: decoded.username
  }, function(err, user) {
    if (!user) {
      return res.status(403).send({success: false, msg: 'Sign in to retrieve your saved projects.'});
    } else {    
      Network.find({
        owner: user.username
      }, function(err, networks) {
        res.json(networks);
      });
    }
  });
});

routes.post('/updateNetwork', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = req.headers.authorization.split(' ')[1];
  var decoded = jwt.decode(token, secret.key);
  User.findOne({
    username: decoded.username
  }, function(err, user) {
    if (!user) {
      return res.status(403).send({success: false, msg: 'Sign in to update your project.'});
    } else {    
      Network.findOne({'graph.id': req.body.id }, function(err, network) {
        if (!network || network.owner !== user.username) {
          return res.json({success: false, msg: 'Project does not exist.'});
        } else {
          network.graph = req.body;
          network.markModified('graph');
          network.save(function(err) {
            if (err) {
              return res.json({success: false, msg: 'Error.'});
            }
            res.json({success: true, msg: 'Successful updated network.'});
          });
        }
      });
    }
  });
});

routes.delete('/deleteNetwork', function(req, res) {
  Network.findOneAndRemove({'graph.id': req.body.id }, function(network, err) {
    if (err) {
      return res.json({success: false, msg: 'Error.'});
    }
    res.json({success: true, msg: 'Successful deleted network.'});
  });
});