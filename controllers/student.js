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
        student: {
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
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
        .json({ message: "Student fetched successfully", student: studentDoc });
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
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
        recentDate: new Date(),
        count: 1,
      });

      return tutorDoc.save();
    })
    .then((tutorDoc) => {
      const tutor = { ...tutorDoc.toObject() };
      delete tutor.students;

      const isStudentConnectedWithTutor = tutor.studentRequests.find(
        (rs) => rs.id === req.id
      );

      delete tutor.studentRequests;

      if (
        !isStudentConnectedWithTutor ||
        isStudentConnectedWithTutor.requestStatus !== "accepted"
      ) {
        delete tutor.contactDetails;
      }

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

exports.connectTutor = (req, res, next) => {
  const tutorId = req.params.tutorId;
  const studentId = req.id;
  if (req.role !== "student") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
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

      const isStudent = tutorDoc.studentRequests.find(
        (student) => student.id === studentId
      );

      if (isStudent) {
        if (isStudent.requestStatus === "accepted") {
          const error = new Error("You are already connected with the tutor");
          error.statusCode = 409;
          throw error;
        } else if (isStudent.requestStatus === "pending") {
          const error = new Error("Another request already pending");
          error.statusCode = 409;
          throw error;
        } else if (
          isStudent.requestStatus === "rejected" &&
          moment(new Date()).diff(moment(isStudent.requestDate), "seconds") <=
            604800
        ) {
          const error = new Error(
            "You have to wait 7 days from your last request to send a new request"
          );
          error.statusCode = 409;
          throw error;
        }

        isStudent.requestDate = new Date();
        isStudent.requestStatus = "pending";
        return tutorDoc.save();
      }

      tutorDoc.studentRequests.push({
        id: foundStudent._id,
        requestDate: new Date(),
        requestStatus: "pending",
      });

      return tutorDoc.save();
    })
    .then(() => {
      res.status(200).json({
        message: "Connection request sent successfully",
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
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
          tutors: filteredTutors.map((ft) => {
            const doc = ft.toObject();
            const isStudentConnectedWithTutor = doc.studentRequests.find(
              (rs) => rs.id === req.id
            );

            delete doc.studentRequests;

            return {
              ...doc,
              requestStatusWithTutor: isStudentConnectedWithTutor || false,
            };
          }),
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
          tutors: filteredTutors.map((ft) => {
            const doc = ft.toObject();
            const isStudentConnectedWithTutor = doc.studentRequests.find(
              (rs) => rs.id === req.id
            );

            delete doc.studentRequests;

            return {
              ...doc,
              requestStatusWithTutor: isStudentConnectedWithTutor || false,
            };
          }),
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
          tutors: tutors.map((ft) => {
            const doc = ft.toObject();
            const isStudentConnectedWithTutor = doc.studentRequests.find(
              (rs) => rs.id === req.id
            );

            delete doc.studentRequests;

            return {
              ...doc,
              requestStatusWithTutor: isStudentConnectedWithTutor || false,
            };
          }),
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
          tutors: filteredTutors.map((ft) => {
            const doc = ft.toObject();
            const isStudentConnectedWithTutor = doc.studentRequests.find(
              (rs) => rs.id === req.id
            );

            delete doc.studentRequests;

            return {
              ...doc,
              requestStatusWithTutor: isStudentConnectedWithTutor || false,
            };
          }),
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
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
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  const data = matchedData(req);
  let student;

  Student.findById(studentId)
    .then((studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }
      student = studentDoc;
      return bcrypt.compare(data.currentPassword, studentDoc.password);
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

exports.getConnectedTutors = (req, res, next) => {
  const studentId = req.id;

  if (req.role !== "student") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  Student.findById(studentId)
    .then((studentDoc) => {
      if (!studentDoc) {
        const error = new Error("Student does not exist");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        message: "Connected Tutors Fetched Successfully",
        connectedTutors: studentDoc.connectedTutors,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
