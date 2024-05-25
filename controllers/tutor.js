const { validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Tutor = require("../models/tutor");
const Course = require("../models/course");
const { jwtSecret } = require("../util/jwt-secret");

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }
  const data = matchedData(req);
  let foundTutor;

  Tutor.findOne({ username: data.username })
    .then((tutor) => {
      if (!tutor) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }

      foundTutor = tutor;

      return bcrypt.compare(data.password, tutor.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Password is wrong");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          username: foundTutor.username,
          id: foundTutor._id.toString(),
          role: "tutor",
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token: token,
        role: "TUTOR",
        tutor: {
          id: foundTutor._id.toString(),
        },
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.logout = (req, res, next) => {
  res.status(200).json({ message: "Logged out successfully" });
};

exports.updateTutor = (req, res, next) => {
  const tutorId = req.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "tutor") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  Tutor.findOne({ username: data.username })
    .then((tutorDoc) => {
      if (tutorDoc && tutorDoc._id.toString() !== tutorId) {
        const error = new Error("Tutor username already exist");
        error.statusCode = 409;
        throw error;
      }

      return Tutor.findById(tutorId);
    })
    .then((tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }

      tutorDoc.username = data.username;
      tutorDoc.name = data.name;
      tutorDoc.email = data.email;
      tutorDoc.expertise = data.expertise;
      tutorDoc.contactDetails = data.contactDetails;
      tutorDoc.availability = data.availability;

      return tutorDoc.save();
    })
    .then((tutor) => {
      res
        .status(200)
        .json({ message: "Tutor updated", id: tutor._id.toString() });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getProfileViewedStudents = (req, res, next) => {
  const tutorId = req.id;

  if (req.role !== "tutor") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  Tutor.findById(tutorId)
    .then(async (tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Profile Viewed Students Fetched Successfully",
        students: tutorDoc.students,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getProfile = (req, res, next) => {
  if (req.role !== "tutor") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const tutorId = req.id;
  const excludedField = "password";
  Tutor.findById(tutorId, { [excludedField]: 0 })
    .then((tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }

      res
        .status(200)
        .json({ message: "Tutor fetched successfully", tutor: tutorDoc });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getCourses = (req, res, next) => {
  if (req.role !== "tutor") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  Course.find({})
    .then((courses) => {
      res
        .status(200)
        .json({ message: "Courses fetched successfully", courses: courses });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updatePassword = (req, res, next) => {
  const tutorId = req.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "tutor") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);
  let tutor;

  Tutor.findById(tutorId)
    .then((tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }
      tutor = tutorDoc;
      return bcrypt.compare(data.currentPassword, tutorDoc.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Current password is wrong");
        error.statusCode = 422;
        throw error;
      }

      bcrypt
        .hash(data.password, 12)
        .then((hashedPassword) => {
          tutor.password = hashedPassword;
          return tutor.save();
        })
        .then((tutor) => {
          res.status(200).json({
            message: "Tutor password updated",
            id: tutor._id.toString(),
          });
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
