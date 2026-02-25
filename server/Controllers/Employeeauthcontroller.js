
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";

// Employee Registration - generates token on successful registration
export const employeeRegister = async (req, res) => {
  try {
    const { name, email, password, department, designation, base_salary, joining_date } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing required details" });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.json({ success: false, message: "Employee with this email already exists" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee data object
    const employeeData = {
      name,
      email,
      password: hashedPassword,
      department,
      designation,
      base_salary,
      joining_date,
    };

    // Save employee to database
    const newEmployee = new Employee(employeeData);
    const employee = await newEmployee.save();

    // Generate JWT token
    const token = jwt.sign({ id: employee._id, role: "employee" }, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: "Employee registered successfully",
      token,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Employee Login - generates token on successful login
export const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.json({ success: false, message: "Missing email or password" });
    }

    // Find employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // Check password using bcrypt compare
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: employee._id, role: "employee" }, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

