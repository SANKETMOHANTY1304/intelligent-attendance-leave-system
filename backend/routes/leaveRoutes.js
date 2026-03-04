import express from "express";
import { applyLeave, approveLeave, rejectLeave, getAllLeaves, getPendingLeaves, getLeaveBalance, getMyLeaves } 
from "../services/leaveController.js";
import authAdmin from "../middleware/authAdmin.js";
import authEmployee from "../middleware/authEmployee.js";

const leavesRoutes = express.Router();

// GET /api/leaves → Get all leaves (optional filters: ?employee_id=emp_123&year=2026)
leavesRoutes.get("/",authAdmin, getAllLeaves);

// GET /api/leaves/pending → Get pending leaves only
leavesRoutes.get("/pending",authAdmin, getPendingLeaves);

// GET /api/leaves/balance → Get remaining leave days for authenticated employee
leavesRoutes.get("/balance", authEmployee, getLeaveBalance);

// GET /api/leaves/my → Get employee's own leave requests (with filters)
leavesRoutes.get("/my", authEmployee, getMyLeaves);

// POST /api/leaves/apply → Apply for leave + validate overlap + check yearly limit
leavesRoutes.post("/apply", authEmployee, applyLeave);

// PUT /api/leaves/{id}/approve → Approve leave + auto-mark attendance as 'On Leave'
leavesRoutes.put("/:id/approve", authAdmin, approveLeave);

// PUT /api/leaves/{id}/reject → Reject leave with reason
leavesRoutes.put("/:id/reject", authAdmin, rejectLeave);

export default leavesRoutes;