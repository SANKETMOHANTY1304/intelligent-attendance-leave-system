
import jwt from "jsonwebtoken";

// Middleware to authenticate employee
const authEmployee = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's an employee token
    if (decoded.role !== "employee") {
      return res.status(403).json({ message: "Access denied. Employee access required." });
    }

    // Attach employee info to request
    req.employee = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

export default authEmployee;
