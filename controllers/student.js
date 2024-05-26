const { validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Student = require("../models/student");
const Course = require("../models/course");
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
  let foundStudent;

  Student.findOne({ username: data.username })
    .then((student) => {
      if (!student) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }

      foundStudent = student;

      return bcrypt.compare(data.password, student.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Password is wrong");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          username: foundStudent.username,
          id: foundStudent._id.toString(),
          role: "student",
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token: token,
        role: "STUDENT",
        tutor: {
          id: foundStudent._id.toString(),
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

exports.updateStudent = (req, res, next) => {
  const studentId = req.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "student") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  Student.findOne({ username: data.username })
    .then((studentDoc) => {
      if (studentDoc && studentDoc._id.toString() !== studentId) {
        const error = new Error("Student username already exist");
        error.statusCode = 409;
        throw error;
      }

      return Student.findById(studentId);
    })
    .then(async (studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }

      studentDoc.username = data.username;
      studentDoc.name = data.name;
      studentDoc.email = data.email;

      return studentDoc.save();
    })
    .then((student) => {
      res
        .status(200)
        .json({ message: "Student updated", id: student._id.toString() });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getProfile = (req, res, next) => {
  if (req.role !== "student") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const studentId = req.id;
  const excludedField = "password";
  Student.findById(studentId, { [excludedField]: 0 })
    .then((studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }

      res
        .status(200)
        .json({ message: "Student fetched successfully", tutor: studentDoc });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.viewTutor = (req, res, next) => {
  const tutorId = req.params.tutorId;
  const studentId = req.id;
  if (req.role !== "student") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  let foundStudent;
  const excludedField = "password";
  Student.findById(studentId)
    .then((studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }
      foundStudent = studentDoc;
      return Tutor.findById(tutorId, { [excludedField]: 0 });
    })
    .then((tutorDoc) => {
      if (!tutorDoc) {
        const error = new Error("Tutor does not exist");
        error.statusCode = 404;
        throw error;
      }

      const isStudent = tutorDoc.students.find(
        (student) => student.id === studentId
      );

      if (isStudent) {
        isStudent.count += 1;
        isStudent.recentDate = new Date();
        return tutorDoc.save();
      }

      tutorDoc.students.push({
        id: foundStudent._id,
        username: foundStudent.username,
        name: foundStudent.name,
        email: foundStudent.email,
        recentDate: new Date(),
        count: 1,
      });

      return tutorDoc.save();
    })
    .then((tutorDoc) => {
      const tutor = { ...tutorDoc.toObject() };
      delete tutor.students;

      res.status(200).json({
        message: "Tutor details fetched successfully",
        tutor: tutor,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

const getTimeInMinutes = (hour, minutes, isTo = false) => {
  return hour === 0 && isTo ? 1440 : hour * 60 + minutes;
};

const isTimeInRange = (studentTimeRange, tutorTimeRange) => {
  if (
    getTimeInMinutes(studentTimeRange.fromHour, studentTimeRange.fromMinute) <=
      getTimeInMinutes(tutorTimeRange.fromHour, tutorTimeRange.fromMinute) &&
    getTimeInMinutes(studentTimeRange.toHour, studentTimeRange.toMinute, true) >
      getTimeInMinutes(tutorTimeRange.fromHour, tutorTimeRange.fromMinute)
  ) {
    return true;
  }

  if (
    getTimeInMinutes(tutorTimeRange.fromHour, tutorTimeRange.fromMinute) <=
      getTimeInMinutes(
        studentTimeRange.fromHour,
        studentTimeRange.fromMinute
      ) &&
    getTimeInMinutes(tutorTimeRange.toHour, tutorTimeRange.toMinute, true) >
      getTimeInMinutes(studentTimeRange.fromHour, studentTimeRange.fromMinute)
  ) {
    return true;
  }

  if (
    getTimeInMinutes(studentTimeRange.toHour, studentTimeRange.toMinute, true) >
      getTimeInMinutes(tutorTimeRange.fromHour, tutorTimeRange.fromMinute) &&
    getTimeInMinutes(
      studentTimeRange.toHour,
      studentTimeRange.toMinute,
      true
    ) <= getTimeInMinutes(tutorTimeRange.toHour, tutorTimeRange.toHour, true)
  ) {
    return true;
  }

  if (
    getTimeInMinutes(tutorTimeRange.toHour, tutorTimeRange.toMinute, true) >
      getTimeInMinutes(
        studentTimeRange.fromHour,
        studentTimeRange.fromMinute
      ) &&
    getTimeInMinutes(tutorTimeRange.toHour, tutorTimeRange.toMinute, true) <=
      getTimeInMinutes(studentTimeRange.toHour, studentTimeRange.toHour, true)
  ) {
    return true;
  }

  return false;
};

const isTutorAvailable = (tutor, studentAvailability) => {
  return tutor.availability.some((availability) =>
    studentAvailability.find(
      (sa) =>
        sa.availableDay === availability.availableDay &&
        isTimeInRange(sa.timeRange, availability.timeRange)
    )
  );
};

exports.findTutor = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "student") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);
  const excludedFields = "-password -students";
  if (data.courses.length === 0 && data.availability.length !== 0) {
    Tutor.find({}, excludedFields)
      .then((tutors) => {
        const filteredTutors = tutors.filter((tutor) =>
          isTutorAvailable(tutor, data.availability)
        );

        res.status(200).json({
          tutors: filteredTutors,
        });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  }

  if (data.courses.length !== 0 && data.availability.length === 0) {
    Tutor.find({}, excludedFields)
      .then((tutors) => {
        const filteredTutors = tutors.filter((tutor) =>
          data.courses.some((course) => tutor.expertise.includes(course))
        );

        res.status(200).json({
          tutors: filteredTutors,
        });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  }

  if (data.courses.length === 0 && data.availability.length === 0) {
    Tutor.find({}, excludedFields)
      .then((tutors) => {
        res.status(200).json({
          tutors,
        });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  }

  if (data.courses.length !== 0 && data.availability.length !== 0) {
    Tutor.find({}, excludedFields)
      .then((tutors) => {
        const filteredTutors = tutors.filter(
          (tutor) =>
            data.courses.some((course) => tutor.expertise.includes(course)) &&
            isTutorAvailable(tutor, data.availability)
        );

        res.status(200).json({
          tutors: filteredTutors,
        });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  }
};

exports.getCourses = (req, res, next) => {
  if (req.role !== "student") {
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
  const studentId = req.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "student") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);
  let student;

  console.log(studentId);

  Student.findById(studentId)
    .then((studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }
      student = studentDoc;
      return bcrypt.compare(data.currentPassword, tutorDoc.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Current password is wrong");
        error.statusCode = 422;
        throw error;
      }

      return bcrypt.hash(data.password, 12);
    })
    .then((hashedPassword) => {
      console.log(student);
      student.password = hashedPassword;
      return student.save();
    })
    .then((student) => {
      res.status(200).json({
        message: "Student password updated",
        id: student._id.toString(),
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
