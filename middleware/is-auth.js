const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../util/jwt-secret");

module.exports = (req, res, next) => {
  const cookie = req.headers.cookie;
  let token;

  console.log(cookie, "cookie");

  if (!cookie) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  const cookies = cookie.split(";");

  cookies.forEach((cookie) => {
    if (cookie.trim().startsWith("token")) {
      token = cookie.split("=")[1];
    }
  });

  if (!token) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, jwtSecret);
  } catch {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  req.id = decodedToken.id;
  req.role = decodedToken.role;
  next();
};
