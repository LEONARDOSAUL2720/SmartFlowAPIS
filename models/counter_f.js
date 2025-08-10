const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number
}, {
  collection: 'counters'
});

module.exports = mongoose.model('Counter', counterSchema);
