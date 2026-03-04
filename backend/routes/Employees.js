import express from 'express'
import {
  findallEmployee,
  getEmployeeDashboard,
  findEmployeeByName,
  getCurrentEmployeeProfile,
  updateCurrentEmployeeProfile,
  updateProfilePicture
} from '../services/Employee_service.js';
import { getAdminDashboard } from '../services/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
import authEmployee from '../middleware/authEmployee.js';
import upload from '../middleware/uploadImage.js';

const employeeRouter = express.Router();

employeeRouter.get('/allemployee', authAdmin, findallEmployee)

// Search employee by name (e.g., /api/employees/search?name=Arjun)
employeeRouter.get('/search', authAdmin, findEmployeeByName)

// ==================== PROFILE ROUTES ====================
// GET /api/employees/me/profile - Get current logged-in employee's profile 
employeeRouter.get('/me/profile', authEmployee, getCurrentEmployeeProfile)

// PUT /api/employees/me/profile - Update current logged-in employee's profile info (name, email)
employeeRouter.put('/me/profile', authEmployee, updateCurrentEmployeeProfile)

// PUT /api/employees/me/profile/picture - Update profile picture only
employeeRouter.put('/me/profile/picture', authEmployee, upload.single('profilePicture'), updateProfilePicture)

// ==================== DASHBOARD ROUTES ====================
// GET /api/employees/admin/dashboard?type=monthly|yearly&year=2026&month=2
employeeRouter.get('/admin/dashboard', authAdmin, getAdminDashboard)

// GET /api/employees/me/dashboard?type=monthly|yearly&year=2026
employeeRouter.get('/me/dashboard', authEmployee, getEmployeeDashboard)

export default employeeRouter
