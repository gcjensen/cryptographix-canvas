var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NetworkSchema = new Schema({
  name: String,
  owner: String,
  graph: Schema.Types.Mixed
});

module.exports = mongoose.model('Network', NetworkSchema);
