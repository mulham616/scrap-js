const mongoose = require('mongoose');

const { Schema } = mongoose;

const JsonDataSceme = new Schema({
  num_process: { type: String, index: { unique: true } },
  json: { type: Object }
});

// export our module to use in server.js
module.exports = mongoose.model('JsonData', JsonDataSceme);
