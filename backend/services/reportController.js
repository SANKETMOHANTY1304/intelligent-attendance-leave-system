import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest, { LEAVE_RULES } from "../models/LeaveRequest.js";
import { calculateMonthlySalary } from "./salaryController.js";
import { calculateTotalAllowance } from "./leaveController.js";

/**
 * Generate Leave Utilization Report
 * Shows employee-wise leave allocation, used, and remaining (YEARLY)
 */
export const getLeaveUtilizationReport = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        error: "Year is required",
        usage: "/api/reports/leave-utilization?year=2026"
      });
    }

    const yearNum = parseInt(year);

    // Get all employees
    const employees = await Employee.find({}).sort({ name: 1 });

    // Get all leave requests for the year (to calculate used leaves)
    const startOfYear = new Date(yearNum, 0, 1);
    const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);

    const leaveUtilization = await Promise.all(
      employees.map(async (employee) => {
        // Get approved leaves for this employee in the year
        const approvedLeaves = await LeaveRequest.find({
          employee_id: employee._id,
          status: "Approved",
          $or: [
            { start_date: { $gte: startOfYear, $lte: endOfYear } },
            { end_date: { $gte: startOfYear, $lte: endOfYear } },
            { start_date: { $lte: startOfYear }, end_date: { $gte: endOfYear } }
          ]
        });

        // Calculate used leaves by type
        const usedLeaves = {
          Casual: 0,
          Sick: 0,
          Earned: 0,
          Unpaid: 0
        };

        approvedLeaves.forEach(leave => {
          const daysDiff = Math.ceil(
            (new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)
          ) + 1;
          const leaveDays = leave.half_day_type ? 0.5 : daysDiff;
          usedLeaves[leave.leave_type] += leaveDays;
        });

        // Calculate total allocated leaves (excluding Unpaid which is unlimited)
        const casualAlloc = calculateTotalAllowance(employee, "Casual", endOfYear);
        const sickAlloc = calculateTotalAllowance(employee, "Sick", endOfYear);
        const earnedAlloc = calculateTotalAllowance(employee, "Earned", endOfYear);

        const totalAllocated = casualAlloc + sickAlloc + earnedAlloc;

        const totalUsed = usedLeaves.Casual + usedLeaves.Sick + usedLeaves.Earned;
        const remaining = totalAllocated - totalUsed;

        return {
          employee: employee.name,
          employee_id: employee._id,
          department: employee.department,
          total: totalAllocated,
          used: totalUsed,
          remaining: remaining,
          breakdown: {
            casual: {
              allocated: casualAlloc,
              used: usedLeaves.Casual,
              remaining: casualAlloc - usedLeaves.Casual
            },
            sick: {
              allocated: sickAlloc,
              used: usedLeaves.Sick,
              remaining: sickAlloc - usedLeaves.Sick
            },
            earned: {
              allocated: earnedAlloc,
              used: usedLeaves.Earned,
              remaining: earnedAlloc - usedLeaves.Earned
            },
            unpaid: { used: usedLeaves.Unpaid }
          }
        };
      })
    );

    res.status(200).json({
      year: yearNum,
      data: leaveUtilization
    });

  } catch (error) {
    console.error("Error generating leave utilization report:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Attendance Summary Report
 * Shows overall attendance statistics for the month
 */
export const getAttendanceSummaryReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: "Month and year are required",
        usage: "/api/reports/attendance-summary?month=1&year=2026"
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59);

    // Calculate working days
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      if (date.getDay() !== 0) workingDays++;
    }

    // Get all employees
    const employees = await Employee.find({});

    // Get all attendance records for the month
    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const summary = {
      total_employees: employees.length,
      working_days: workingDays,
      total_present: 0,
      total_late: 0,
      total_absent: 0,
      average_attendance_rate: 0,
      details: []
    };

    employees.forEach(employee => {
      const empAttendance = attendanceRecords.filter(
        record => record.employee_id.toString() === employee._id.toString()
      );

      const joiningDate = new Date(employee.joining_date);
      const effectiveStart = joiningDate > startOfMonth ? joiningDate : startOfMonth;
      let empWorkingDays = 0;
      const currentDate = new Date(effectiveStart);

      while (currentDate <= endOfMonth) {
        if (currentDate.getDay() !== 0) empWorkingDays++;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const presentCount = empAttendance.filter(
        r => r.status === "Present" || r.status === "Logged In"
      ).length;
      const lateCount = empAttendance.filter(r => r.status === "Late").length;
      const absentCount = empWorkingDays - empAttendance.length;

      summary.total_present += presentCount;
      summary.total_late += lateCount;
      summary.total_absent += absentCount;

      summary.details.push({
        employee: employee.name,
        employee_id: employee._id,
        department: employee.department,
        working_days: empWorkingDays,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendance_rate: empWorkingDays > 0
          ? Math.round((empAttendance.length / empWorkingDays) * 100 * 100) / 100
          : 0
      });
    });

    const totalPossibleDays = summary.details.reduce((sum, emp) => sum + emp.working_days, 0);
    summary.average_attendance_rate = totalPossibleDays > 0
      ? Math.round(((summary.total_present + summary.total_late) / totalPossibleDays) * 100 * 100) / 100
      : 0;

    res.status(200).json({
      period: { month: monthNum, year: yearNum },
      summary
    });

  } catch (error) {
    console.error("Error generating attendance summary:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Department Averages Report
 * Shows department-wise attendance and leave statistics
 */
export const getDepartmentAveragesReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: "Month and year are required",
        usage: "/api/reports/department-averages?month=1&year=2026"
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59);

    // Get all employees grouped by department
    const employees = await Employee.find({});
    const departments = {};

    // Initialize department data
    employees.forEach(emp => {
      if (!departments[emp.department]) {
        departments[emp.department] = {
          department: emp.department,
          employee_count: 0,
          total_attendance: 0,
          total_possible_days: 0,
          total_leaves: 0,
          average_attendance_rate: 0,
          average_leaves_per_employee: 0
        };
      }
      departments[emp.department].employee_count++;
    });

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('employee_id', 'department');

    // Get leave requests
    const leaveRequests = await LeaveRequest.find({
      status: "Approved",
      $or: [
        { start_date: { $gte: startOfMonth, $lte: endOfMonth } },
        { end_date: { $gte: startOfMonth, $lte: endOfMonth } },
        { start_date: { $lte: startOfMonth }, end_date: { $gte: endOfMonth } }
      ]
    }).populate('employee_id', 'department');

    // Calculate working days
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      if (date.getDay() !== 0) workingDays++;
    }

    // Process attendance by department
    employees.forEach(emp => {
      const dept = emp.department;
      const empAttendance = attendanceRecords.filter(
        r => r.employee_id && r.employee_id._id.toString() === emp._id.toString()
      );

      const joiningDate = new Date(emp.joining_date);
      const effectiveStart = joiningDate > startOfMonth ? joiningDate : startOfMonth;
      let empWorkingDays = 0;
      const currentDate = new Date(effectiveStart);

      while (currentDate <= endOfMonth) {
        if (currentDate.getDay() !== 0) empWorkingDays++;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      departments[dept].total_attendance += empAttendance.length;
      departments[dept].total_possible_days += empWorkingDays;
    });

    // Process leaves by department
    leaveRequests.forEach(leave => {
      if (leave.employee_id && leave.employee_id.department) {
        const dept = leave.employee_id.department;
        const daysDiff = Math.ceil(
          (new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)
        ) + 1;
        const leaveDays = leave.half_day_type ? 0.5 : daysDiff;

        if (departments[dept]) {
          departments[dept].total_leaves += leaveDays;
        }
      }
    });

    // Calculate averages
    Object.keys(departments).forEach(dept => {
      const deptData = departments[dept];
      deptData.average_attendance_rate = deptData.total_possible_days > 0
        ? Math.round((deptData.total_attendance / deptData.total_possible_days) * 100 * 100) / 100
        : 0;
      deptData.average_leaves_per_employee = deptData.employee_count > 0
        ? Math.round((deptData.total_leaves / deptData.employee_count) * 100) / 100
        : 0;
    });

    res.status(200).json({
      period: { month: monthNum, year: yearNum },
      departments: Object.values(departments)
    });

  } catch (error) {
    console.error("Error generating department averages:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Salary Report
 * Shows salary breakdown for all employees
 */
export const getSalaryReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: "Month and year are required",
        usage: "/api/reports/salary?month=1&year=2026"
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const employees = await Employee.find({});

    const salaryReports = await Promise.all(
      employees.map(async (employee) => {
        try {
          return await calculateMonthlySalary(employee._id, monthNum, yearNum);
        } catch (error) {
          return {
            employee_details: { id: employee._id, name: employee.name },
            error: error.message,
          };
        }
      })
    );

    const summary = {
      total_employees: employees.length,
      total_gross: salaryReports.reduce((sum, r) => sum + (r.gross || 0), 0),
      total_deductions: salaryReports.reduce((sum, r) => sum + (r.deductions || 0), 0),
      total_net: salaryReports.reduce((sum, r) => sum + (r.net || 0), 0),
    };

    res.status(200).json({
      period: { month: monthNum, year: yearNum },
      summary,
      employees: salaryReports,
    });
  } catch (error) {
    console.error("Error generating salary report:", error);
    res.status(500).json({ error: error.message });
  }
};
