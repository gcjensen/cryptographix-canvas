var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NetworkSchema = new Schema({
  graph: Schema.Types.Mixed
});

module.exports = mongoose.model('Network', NetworkSchema);
