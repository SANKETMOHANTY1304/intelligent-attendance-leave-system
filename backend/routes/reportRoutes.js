import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import { 
  getLeaveUtilizationReport,
  getAttendanceSummaryReport,
  getDepartmentAveragesReport,
  getSalaryReport
} from '../services/reportController.js';

const reportsRouter = express.Router();

// Apply admin authentication to all routes
reportsRouter.use(authAdmin);

// ==================== REPORT ROUTES ====================

/**
 * GET /api/reports/leave-utilization?year=2026
 * Returns: Employee-wise leave allocation, used, and remaining leaves (YEARLY)
 */
reportsRouter.get('/leave-utilization', getLeaveUtilizationReport);

/**
 * GET /api/reports/attendance-summary?month=1&year=2026
 * Returns: Overall attendance statistics for the month
 */
reportsRouter.get('/attendance-summary', getAttendanceSummaryReport);

/**
 * GET /api/reports/department-averages?month=1&year=2026
 * Returns: Department-wise attendance and leave statistics
 */
reportsRouter.get('/department-averages', getDepartmentAveragesReport);

/**
 * GET /api/reports/salary?month=1&year=2026
 * Returns: Salary report for all employees
 */
reportsRouter.get('/salary', getSalaryReport);

export default reportsRouter;