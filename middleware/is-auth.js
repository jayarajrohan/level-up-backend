const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../util/jwt-secret");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);

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
