var mongoose = require("mongoose");

var stockSchema = new mongoose.Schema({
  testID: {
    type: String
  },
  isInStock: {
    type: Boolean
  },
  purchaseLink: {
    type: String
  },
  store: {
      type: String
  },
  storeID: {
      type: String
  },
  testType: {
    type: String
  },
  lastUpdated: {
    type: Date
  },
  pricePer: {
    type: Number
  },
  count: {
    type: Number
  }
});

module.exports = mongoose.model('Stock', stockSchema)
