const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    username: String,
    text: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
