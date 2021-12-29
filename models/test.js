var mongoose = require("mongoose");

var testSchema = new mongoose.Schema({
  name: {
    type: String
  },
  upc: {
    type: String
  },
});

module.exports = mongoose.model('Test', testSchema)
