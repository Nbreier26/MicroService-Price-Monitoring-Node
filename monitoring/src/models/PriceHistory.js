const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true 
  },
  price: { 
    type: Number,
    required: true 
  },
  timestamp: { 
    type: Date,
    default: Date.now 
  }
});

module.exports = mongoose.model('PriceHistory', priceHistorySchema);