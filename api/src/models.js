const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  price: { type: Number, required: true },
  ecommerce: { type: String, required: true }
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
