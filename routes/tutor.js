const express = require("express");
const { body } = require("express-validator");

const tutorControllers = require("../controllers/tutor");
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
  tutorControllers.login
);

router.get("/logout", isAuth, tutorControllers.logout);

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
  body("expertise")
    .optional()
    .isArray()
    .custom((value) => {
      for (const [index, element] of value) {
        if (typeof element !== "string") {
          throw new Error("Invalid element found in the array");
        }
        value[index] = element.trim();
      }
      return true;
    }),
  body("contactDetails").optional(),
  body("availability").optional().isArray(),
  tutorControllers.updateTutor
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
  tutorControllers.updatePassword
);

router.get("/view-students", isAuth, tutorControllers.getProfileViewedStudents);

router.get(
  "/connection-requests",
  isAuth,
  tutorControllers.getPendingConnectionRequests
);

router.get(
  "/accepted-requests",
  isAuth,
  tutorControllers.getAcceptedConnectionRequests
);

router.post(
  "/request/:studentId",
  isAuth,
  body("status").isIn(["accepted", "rejected"]),
  tutorControllers.handleConnectionRequest
);

router.get("/profile", isAuth, tutorControllers.getProfile);

router.get("/courses", isAuth, tutorControllers.getCourses);

router.get("/view-student/:id", isAuth, tutorControllers.viewStudent);

module.exports = router;
