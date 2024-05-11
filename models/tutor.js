const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const socialMediaSchema = new Schema(
  {
    facebook: {
      type: String,
      required: false,
    },
    twitter: {
      type: String,
      required: false,
    },
    linkedIn: {
      type: String,
      required: false,
    },
    youtube: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const contactDetailsSchema = new Schema(
  {
    mobileNumber: {
      type: String,
      required: false,
    },
    whatsAppNumber: {
      type: String,
      required: false,
    },
    socialMedia: {
      type: socialMediaSchema,
      required: false,
    },
  },
  { _id: false }
);

const tutorSchema = new Schema(
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
    expertise: {
      type: [String],
      required: false,
    },
    availability: {
      type: Boolean,
      required: false,
    },
    contactDetails: {
      type: contactDetailsSchema,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tutor", tutorSchema);
