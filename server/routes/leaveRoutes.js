import express from "express";
import { applyLeave, approveLeave, rejectLeave, getAllLeaves, getPendingLeaves, getLeaveBalance } 
from "../services/leaveController.js";

const leavesRoutes = express.Router();

// GET /api/leaves → Get all leaves (optional filters: ?employee_id=emp_123&year=2026)
leavesRoutes.get("/", getAllLeaves);

// GET /api/leaves/pending → Get pending leaves only
leavesRoutes.get("/pending", getPendingLeaves);

// GET /api/leaves/balance/{emp_id} → Get remaining leave days for employee
leavesRoutes.get("/balance/:emp_id", getLeaveBalance);

// POST /api/leaves/apply → Apply for leave + validate overlap + check yearly limit
leavesRoutes.post("/apply", applyLeave);

// PUT /api/leaves/{id}/approve → Approve leave + auto-mark attendance as 'On Leave'
leavesRoutes.put("/:id/approve", approveLeave);

// PUT /api/leaves/{id}/reject → Reject leave with reason
leavesRoutes.put("/:id/reject", rejectLeave);

export default leavesRoutes;