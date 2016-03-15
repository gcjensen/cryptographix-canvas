var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
  
var UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});
 
UserSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(user.password, salt, function (err, hash) {
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});
 
UserSchema.methods.checkPassword = function (providedPassword, cb) {
  bcrypt.compare(providedPassword, this.password, function (err, success) {
    if (err) return cb(err);
    cb(null, success);
  });
};
 
module.exports = mongoose.model('User', UserSchema);