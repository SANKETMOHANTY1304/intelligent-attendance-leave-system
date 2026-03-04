import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";

// Unified login with role parameter
export const unifiedLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check required fields
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing email, password, or role" });
    }

    // Validate role
    if (!["admin", "employee"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'admin' or 'employee'" });
    }

    if (role === "admin") {
      // Admin login
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { email: adminEmail, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        role: "admin",
        admin: {
          name: "Admin",
          email: adminEmail
        }
      });
    } else {
      // Employee login
      const employee = await Employee.findOne({ email });
      if (!employee) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, employee.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: employee._id, role: "employee" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Employee login successful",
        token,
        role: "employee",
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation
        }
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};
