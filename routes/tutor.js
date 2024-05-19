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
  "/update/:id",
  isAuth,
  body("username")
    .trim()
    .isLength({ min: 5 })
    .matches(onlyAlphaNumericsAndUnderscores)
    .escape(),
  body("password").trim().isLength({ min: 6 }).matches(passwordRegex).escape(),
  body("name").optional().trim().isLength({ min: 3 }).escape(),
  body("email").optional().isEmail().normalizeEmail(),
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
  body("availability").isArray(),
  tutorControllers.updateTutor
);

router.get(
  "/view-students/:id",
  isAuth,
  tutorControllers.getProfileViewedStudents
);

router.get("/profile/:id", isAuth, tutorControllers.getProfile);

module.exports = router;
