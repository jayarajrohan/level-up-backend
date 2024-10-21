const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const connectedTutorsSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    connectedTutors: {
      type: [connectedTutorsSchema],
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
