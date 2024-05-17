const { validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Tutor = require("../models/tutor");
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

      res.cookie("token", token, {
        httpOnly: process.env.COOKIE_SETTINGS_HTTP_ONLY === "true",
        secure: process.env.COOKIE_SETTINGS_SECURE === "true",
        sameSite: "none",
      });

      res.status(200).json({
        token: token,
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
  try {
    res.clearCookie("token", {
      httpOnly: process.env.COOKIE_SETTINGS_HTTP_ONLY === "true",
      secure: process.env.COOKIE_SETTINGS_SECURE === "true",
      sameSite: "none",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateTutor = (req, res, next) => {
  const tutorId = req.params.id;
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
    .then(async (tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }

      return bcrypt
        .hash(data.password, 12)
        .then((hashedPassword) => {
          tutorDoc.username = data.username;
          tutorDoc.password = hashedPassword;
          tutorDoc.name = data.name;
          tutorDoc.email = data.email;
          tutorDoc.expertise = data.expertise;
          tutorDoc.contactDetails = data.contactDetails;

          return tutorDoc.save();
        })
        .then((tutor) => {
          res
            .status(200)
            .json({ message: "Tutor updated", id: tutor._id.toString() });
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updateAvailability = (req, res, next) => {
  const tutorId = req.params.id;
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

  Tutor.findById(tutorId)
    .then(async (tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }
      tutorDoc.availability = data.availability;
      return tutorDoc.save();
    })
    .then((tutor) => {
      res.status(200).json({
        message: "Tutor availability updated",
        availability: tutor.availability,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getAvailability = (req, res, next) => {
  const tutorId = req.params.id;

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
        message: "Availability Fetched Successfully",
        availability: tutorDoc.availability,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getProfileViewedStudents = (req, res, next) => {
  const tutorId = req.params.id;

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
