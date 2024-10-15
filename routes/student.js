const express = require("express");
const { body } = require("express-validator");

const studentController = require("../controllers/student");
const {
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
  studentController.login
);

router.get("/logout", isAuth, studentController.logout);

router.put(
  "/update",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("name")
    .optional()
    .if((value) => value !== "")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("email")
    .optional()
    .if((value) => value !== "")
    .isEmail()
    .normalizeEmail(),
  studentController.updateStudent
);

router.put(
  "/update-password",
  isAuth,
  body("currentPassword")
    .trim()
    .isLength({ min: 6 })
    .matches(passwordRegex)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  studentController.updatePassword
);

router.get("/profile", isAuth, studentController.getProfile);

router.get("/view-tutor/:tutorId", isAuth, studentController.viewTutor);

router.post(
  "/find-tutors",
  isAuth,
  body("courses").isArray(),
  body("availability").isArray(),
  studentController.findTutor
);

router.get("/courses", isAuth, studentController.getCourses);

router.get("/connect-tutor/:tutorId", isAuth, studentController.connectTutor);

router.get("/connected-tutors", isAuth, studentController.getConnectedTutors);

module.exports = router;
