import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Employee, { DEPARTMENTS, DEPARTMENT_SALARIES } from "../models/Employee.js";

// Employee Registration
export const employeeRegister = async (req, res) => {

  try {
    const { name, email, password, department, joining_date } = req.body;

    // Predefined list of designations
    const DESIGNATIONS = ["Manager", "Developer", "HR", "Accountant", "Team Lead", "Analyst", "Support", "Intern"];

    // Check required fields
    if (!name || !email || !password || !department) {
      return res.json({ success: false, message: "Missing required details (name, email, password, department)" });
    }

    // Validate department
    if (!DEPARTMENTS.includes(department)) {
      return res.json({ 
        success: false, 
        message: `Invalid department. Must be one of: ${DEPARTMENTS.join(", ")}` 
      });
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

    // Assign random designation
    const randomDesignation = DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)];

    // Create employee data object with salary based on department
    const employeeData = {
      name,
      email,
      password: hashedPassword,
      department,
      designation: randomDesignation,
      base_salary: DEPARTMENT_SALARIES[department],
      joining_date: joining_date || new Date(),
    };

    // Save employee to database
    const newEmployee = new Employee(employeeData);
    const employee = await newEmployee.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, role: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Employee registered successfully",
      token,
      role: "employee",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        base_salary: employee.base_salary
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
  
