const { validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/admin");
const Student = require("../models/student");
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
  let foundAdmin;

  Admin.findOne({ username: data.username })
    .then((admin) => {
      if (!admin) {
        const error = new Error("Admin does not exist");
        error.statusCode = 404;
        throw error;
      }

      foundAdmin = admin;

      return bcrypt.compare(data.password, admin.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Password is wrong");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          username: foundAdmin.username,
          id: foundAdmin._id.toString(),
          role: "admin",
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token: token,
        role: "ADMIN",
        admin: {
          id: foundAdmin._id.toString(),
          firstName: foundAdmin.firstName,
          lastName: foundAdmin.lastName,
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

exports.createStudent = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  Student.findOne({ username: data.username })
    .then((studentDoc) => {
      if (studentDoc) {
        const error = new Error("Student username already exist");
        error.statusCode = 409;
        throw error;
      }

      bcrypt
        .hash(data.password, 12)
        .then((hashedPassword) => {
          const student = new Student({
            username: data.username,
            email: data.email,
            name: data.name,
            password: hashedPassword,
          });

          return student.save();
        })
        .then((student) => {
          res
            .status(201)
            .json({ message: "Student created", id: student._id.toString() });
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updateStudent = (req, res, next) => {
  const studentId = req.params.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
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
      studentDoc.email = data.email;
      studentDoc.name = data.name;
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

exports.updateStudentPassword = (req, res, next) => {
  const studentId = req.params.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
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

      bcrypt
        .hash(data.password, 12)
        .then((hashedPassword) => {
          student.password = hashedPassword;
          return student.save();
        })
        .then((student) => {
          res.status(200).json({
            message: "Student password updated",
            id: student._id.toString(),
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

exports.deleteStudent = (req, res, next) => {
  const studentId = req.params.id;

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  Student.deleteOne({ _id: studentId })
    .then(() => {
      return Tutor.updateMany({}, { $pull: { students: { id: studentId } } });
    })
    .then(() => {
      res.status(200).json({
        message: "Student deleted",
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getStudents = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const excludedField = "password";
  Student.find({}, { [excludedField]: 0 })
    .then((students) => {
      res
        .status(200)
        .json({ message: "Students fetched successfully", students: students });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getStudent = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const studentId = req.params.id;

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

exports.createTutor = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  Tutor.findOne({ username: data.username })
    .then((tutorDoc) => {
      if (tutorDoc) {
        const error = new Error("Tutor username already exist");
        error.statusCode = 409;
        throw error;
      }

      bcrypt
        .hash(data.password, 12)
        .then((hashedPassword) => {
          const tutor = new Tutor({
            username: data.username,
            password: hashedPassword,
            name: data.name,
            email: data.email,
            expertise: data.expertise,
            contactDetails: data.contactDetails,
          });

          return tutor.save();
        })
        .then((tutor) => {
          res
            .status(201)
            .json({ message: "Tutor created", id: tutor._id.toString() });
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
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

  if (req.role !== "admin") {
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
      tutorDoc.username = data.username;
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
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updateTutorPassword = (req, res, next) => {
  const tutorId = req.params.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
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

exports.deleteTutor = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const tutorId = req.params.id;

  Tutor.deleteOne({ _id: tutorId })
    .then(() => {
      res.status(200).json({
        message: "Tutor deleted",
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getTutors = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const excludedField = "password";
  Tutor.find({}, { [excludedField]: 0 })
    .then((tutors) => {
      res
        .status(200)
        .json({ message: "Tutors fetched successfully", tutors: tutors });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getTutor = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const tutorId = req.params.id;

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

exports.createCourse = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  const course = new Course({
    courseName: data.courseName,
    description: data.description,
  });

  Course.findOne({ courseName: data.courseName })
    .then((courseDoc) => {
      if (courseDoc) {
        const error = new Error("Course with same name already exist");
        error.statusCode = 409;
        throw error;
      }

      return course.save();
    })
    .then((course) => {
      res
        .status(201)
        .json({ message: "Course created", id: course._id.toString() });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updateCourse = (req, res, next) => {
  const courseId = req.params.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.data = errors.array();
    throw error;
  }

  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const data = matchedData(req);

  Course.findOne({ courseName: data.courseName })
    .then((courseDoc) => {
      if (courseDoc) {
        const error = new Error("Course with same name already exist");
        error.statusCode = 409;
        throw error;
      }

      return Course.findById(courseId);
    })
    .then((courseDoc) => {
      if (!courseDoc) {
        const error = new Error("Course does not exist");
        error.statusCode = 404;
        throw error;
      }

      courseDoc.courseName = data.courseName;
      courseDoc.description = data.description;

      return courseDoc.save();
    })
    .then((course) => {
      res
        .status(200)
        .json({ message: "Course updated", id: course._id.toString() });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.deleteCourse = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const courseId = req.params.id;

  Course.deleteOne({ _id: courseId })
    .then(() => {
      res.status(200).json({
        message: "Course deleted",
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getCourses = (req, res, next) => {
  if (req.role !== "admin") {
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

exports.getCourse = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const courseId = req.params.id;

  Course.findById(courseId)
    .then((courseDoc) => {
      if (!courseDoc) {
        const error = new Error("Course does not exist");
        error.statusCode = 404;
        throw error;
      }

      res
        .status(200)
        .json({ message: "Course fetched successfully", course: courseDoc });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getAdminDashboardDetails = async (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  let studentsCount;
  let tutorsCount;
  let coursesCount;

  await Student.countDocuments({})
    .then((count) => (studentsCount = count))
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });

  await Tutor.countDocuments({})
    .then((count) => (tutorsCount = count))
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });

  await Course.countDocuments({})
    .then((count) => (coursesCount = count))
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });

  res.status(200).json({
    message: "Admin dashboard details fetched successfully",
    dashboardDetails: {
      studentsCount,
      tutorsCount,
      coursesCount,
    },
  });
};
