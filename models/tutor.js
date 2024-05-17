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

const availabilitySchema = new Schema(
  {
    availableDay: {
      type: String,
      required: true,
    },
    timeRange: {
      type: new Schema(
        {
          fromHour: {
            type: Number,
            required: true,
          },
          fromMinute: {
            type: Number,
            required: true,
          },
          toHour: {
            type: Number,
            required: true,
          },
          toMinute: {
            type: Number,
            required: true,
          },
        },
        { _id: false }
      ),
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
    email: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      required: true,
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
    contactDetails: {
      type: contactDetailsSchema,
      required: false,
    },
    availability: {
      type: [availabilitySchema],
      required: false,
    },
    students: {
      type: [studentSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tutor", tutorSchema);
