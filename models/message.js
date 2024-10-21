const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    senderUsername: {
      type: String,
      required: true,
    },
    receiverUsername: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
