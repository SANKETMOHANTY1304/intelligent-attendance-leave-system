import express from 'express';
import { checkIn, checkOut, getDailyAttendance, getAttendanceHistory, getAllAttendance } from '../services/attendanceController.js';
import authAdmin from '../middleware/authAdmin.js';
import authEmployee from '../middleware/authEmployee.js';

const attendanceRouter = express.Router();

// POST /api/attendance/checkin → Employee checks in (Button: Check In)
attendanceRouter.post('/checkin', authEmployee, checkIn);

// PUT /api/attendance/checkout → Employee checks out (Button: Check Out)
attendanceRouter.put('/checkout', authEmployee, checkOut);

// GET /api/attendance/history → Get attendance history for logged-in employee
attendanceRouter.get('/history', authEmployee, getAttendanceHistory);

// GET /api/attendance/daily?date=... → All employees' status for a given day
attendanceRouter.get('/daily', authAdmin, getDailyAttendance);

// GET /api/attendance/all → Get all attendance records for admin
attendanceRouter.get('/all', authAdmin, getAllAttendance);

export default attendanceRouter;