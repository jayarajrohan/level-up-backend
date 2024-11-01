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
    id: {
      type: String,
      required: true,
    },
    recentDate: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const requestedStudentSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    requestDate: {
      type: Date,
      required: true,
    },
    requestStatus: {
      type: String,
      enum: ["accepted", "rejected", "pending"],
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
    studentRequests: {
      type: [requestedStudentSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tutor", tutorSchema);
