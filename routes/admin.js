const express = require("express");
const { body } = require("express-validator");

const adminControllers = require("../controllers/admin");
const {
  noSpecialCharsNoWhiteSpacesAtTheStartAndAtTheEndRegex,
  passwordRegex,
  onlyAlphaNumericsAndUnderscores,
} = require("../util/regex");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post(
  "/login",
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  adminControllers.login
);

router.get("/logout", isAuth, adminControllers.logout);

router.post(
  "/student/create",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  body("email").optional().isEmail().normalizeEmail(),
  adminControllers.createStudent
);

router.put(
  "/student/update/:id",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  body("email").optional().trim().isEmail().normalizeEmail(),
  adminControllers.updateStudent
);

router.delete("/student/delete/:id", isAuth, adminControllers.deleteStudent);

router.get("/students", isAuth, adminControllers.getStudents);

router.get("/student/:id", isAuth, adminControllers.getStudent);

router.post(
  "/tutor/create",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  body("email").optional().isEmail().normalizeEmail(),
  body("name").optional().trim().isLength({ min: 3 }).escape(),
  body("expertise").optional().trim().escape(),
  body("contactDetails").optional(),
  adminControllers.createTutor
);

router.put(
  "/tutor/update/:id",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  body("email").optional().isEmail().normalizeEmail(),
  body("name").optional().trim().isLength({ min: 3 }).escape(),
  body("expertise").optional().trim().escape(),
  body("contactDetails").optional(),
  adminControllers.updateTutor
);

router.delete("/tutor/delete/:id", isAuth, adminControllers.deleteTutor);

router.get("/tutors", isAuth, adminControllers.getTutors);

router.get("/tutor/:id", isAuth, adminControllers.getTutor);

router.post(
  "/course/create",
  isAuth,
  body("courseName").trim().isLength({ min: 5 }).escape(),
  body("description").trim().isLength({ min: 10 }).escape(),
  adminControllers.createCourse
);

router.put(
  "/course/update/:id",
  isAuth,
  body("courseName").trim().isLength({ min: 5 }).escape(),
  body("description").trim().isLength({ min: 10 }).escape(),
  adminControllers.updateCourse
);

router.delete("/course/delete/:id", isAuth, adminControllers.deleteCourse);

router.get("/courses", isAuth, adminControllers.getCourses);

router.get("/course/:id", isAuth, adminControllers.getCourse);

router.get(
  "/dashboard/view",
  isAuth,
  adminControllers.getAdminDashboardDetails
);

module.exports = router;