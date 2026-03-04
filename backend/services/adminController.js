import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const countWorkingDays = (year, month) => {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};
const dayStart = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const dayEnd = (date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
const PRESENT_STATUSES = ["Logged In", "Late", "Present", "Half-day"];

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
/**
 * GET /api/employees/admin/dashboard?type=monthly|yearly&year=2026&month=2
 * Returns:
 *  - stats               → Total Employees, Present Today, On Leave Today, Pending Approvals
 *  - attendanceTrend     → monthly or yearly attendance % (line chart)
 *  - departmentAttendance → per-department attendance % (bar chart)
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const type = req.query.type || "monthly";
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    // 1. Top cards
    const [totalEmployees, presentToday, onLeaveToday, pendingApprovals] =
      await Promise.all([
        Employee.countDocuments(),
        Attendance.countDocuments({
          date: { $gte: dayStart(now), $lte: dayEnd(now) },
          status: { $in: PRESENT_STATUSES },
        }),
        LeaveRequest.countDocuments({
          status: "Approved",
          start_date: { $lte: dayEnd(now) },
          end_date: { $gte: dayStart(now) },
        }),
        LeaveRequest.countDocuments({ status: "Pending" }),
      ]);

    // 2. Attendance trend (line chart)
    const attendanceTrend = [];
    const totalEmp = totalEmployees;
    if (totalEmp > 0) {
      if (type === "monthly") {
        for (let m = 1; m <= 12; m++) {
          const start = new Date(year, m - 1, 1);
          const end = new Date(year, m, 0, 23, 59, 59);
          const workDays = countWorkingDays(year, m);
          const present = await Attendance.countDocuments({
            date: { $gte: start, $lte: end },
            status: { $in: PRESENT_STATUSES },
          });
          const pct = workDays > 0 ? Math.round((present / (workDays * totalEmp)) * 100) : 0;
          attendanceTrend.push({
            label: new Date(year, m - 1, 1).toLocaleString("default", { month: "short" }),
            attendancePct: pct,
          });
        }
      } else {
        for (let y = year - 4; y <= year; y++) {
          const start = new Date(y, 0, 1);
          const end = new Date(y, 11, 31, 23, 59, 59);
          let workDays = 0;
          for (let m = 1; m <= 12; m++) workDays += countWorkingDays(y, m);
          const present = await Attendance.countDocuments({
            date: { $gte: start, $lte: end },
            status: { $in: PRESENT_STATUSES },
          });
          const pct = workDays > 0 ? Math.round((present / (workDays * totalEmp)) * 100) : 0;
          attendanceTrend.push({ label: String(y), attendancePct: pct });
        }
      }
    }

    // 3. Department-wise attendance (bar chart)
    const deptStart = new Date(year, month - 1, 1);
    const deptEnd = new Date(year, month, 0, 23, 59, 59);
    const workDays = countWorkingDays(year, month);
    const employees = await Employee.find({}, "_id department");
    const deptMap = {};
    employees.forEach((emp) => {
      if (!deptMap[emp.department]) deptMap[emp.department] = [];
      deptMap[emp.department].push(emp._id);
    });
    const departmentAttendance = await Promise.all(
      Object.entries(deptMap).map(async ([dept, ids]) => {
        const present = await Attendance.countDocuments({
          employee_id: { $in: ids },
          date: { $gte: deptStart, $lte: deptEnd },
          status: { $in: PRESENT_STATUSES },
        });
        const pct = workDays > 0 ? Math.round((present / (workDays * ids.length)) * 100) : 0;
        return { department: dept, attendancePct: pct, employeeCount: ids.length };
      })
    );

    // Format response to match frontend expectations
    // Frontend getDashboardData() reads response.dashboard
    // Frontend expects: dashboard.stats, dashboard.trends.labels/data, dashboard.departments[].attendancePercentage
    const trendLabels = attendanceTrend.map(t => t.label);
    const trendData = attendanceTrend.map(t => t.attendancePct);

    // Calculate average attendance for the stats card
    const avgAtt = trendData.length > 0 ? Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.filter(v => v > 0).length || 0) : 0;

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalEmployees,
          presentToday,
          onLeaveToday,
          pendingLeaves: pendingApprovals,
          averageAttendance: avgAtt || 0,
        },
        trends: { type, year, labels: trendLabels, data: trendData },
        departments: departmentAttendance.map(d => ({
          department: d.department,
          attendancePercentage: d.attendancePct,
          employeeCount: d.employeeCount,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

