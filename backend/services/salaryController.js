import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";

/**
 * Calculate number of working days in a month (excluding Sundays)
 */
const getWorkingDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0) { // Exclude Sundays
      workingDays++;
    }
  }

  return workingDays;
};

/**
 * Calculate actual working days for an employee (handles new joinee case)
 */
const getEmployeeWorkingDays = (joiningDate, year, month) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const startDate = new Date(joiningDate) > monthStart ? new Date(joiningDate) : monthStart;
  const endDate = monthEnd;

  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

/**
 * Calculate monthly salary for an employee
 */
export const calculateMonthlySalary = async (employee_id, month, year) => {
  try {
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const baseSalary = employee.base_salary;
    const joiningDate = new Date(employee.joining_date);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Check if employee hasn't joined yet
    if (joiningDate > monthEnd) {
      return {
        employee_details: {
          id: employee._id,
          name: employee.name,
          department: employee.department,
          base_salary: baseSalary,
        },
        gross: 0,
        deductions: 0,
        net: 0,
        message: "Employee not yet joined"
      };
    }

    const totalWorkingDays = getWorkingDaysInMonth(year, month);
    const employeeWorkingDays = getEmployeeWorkingDays(joiningDate, year, month);
    const perDaySalary = baseSalary / totalWorkingDays;

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      employee_id: employee_id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Get approved leaves
    const leaveRequests = await LeaveRequest.find({
      employee_id: employee_id,
      status: "Approved",
      $or: [
        { start_date: { $gte: monthStart, $lte: monthEnd } },
        { end_date: { $gte: monthStart, $lte: monthEnd } },
        { start_date: { $lte: monthStart }, end_date: { $gte: monthEnd } }
      ]
    });

    // Create date status map
    const dateStatusMap = new Map();

    attendanceRecords.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      dateStatusMap.set(dateKey, {
        type: 'attendance',
        status: record.status,
        work_hours: record.work_hours
      });
    });

    leaveRequests.forEach(leave => {
      const effectiveStart = new Date(joiningDate) > monthStart ? new Date(joiningDate) : monthStart;
      const leaveStart = new Date(Math.max(new Date(leave.start_date), effectiveStart));
      const leaveEnd = new Date(Math.min(new Date(leave.end_date), monthEnd));

      const currentLeaveDate = new Date(leaveStart);
      while (currentLeaveDate <= leaveEnd) {
        if (currentLeaveDate.getDay() !== 0) {
          const dateKey = currentLeaveDate.toISOString().split('T')[0];
          if (!dateStatusMap.has(dateKey)) {
            dateStatusMap.set(dateKey, {
              type: 'leave',
              leave_type: leave.leave_type,
              is_half_day: leave.half_day_type ? true : false,
            });
          }
        }
        currentLeaveDate.setDate(currentLeaveDate.getDate() + 1);
      }
    });

    // Calculate deductions — only count up to today for current/future months
    let absentDays = 0;
    let halfDays = 0;
    let unpaidLeaveDays = 0;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    // For current month, only count up to today. For past months, count full month.
    const countUntil = monthEnd < today ? monthEnd : today;

    // Also recalculate effective working days up to countUntil for proportional salary
    let effectiveWorkingDays = 0;

    const effectiveStartDate = joiningDate > monthStart ? joiningDate : monthStart;
    const currentDate = new Date(effectiveStartDate);

    while (currentDate <= countUntil) {
      if (currentDate.getDay() !== 0) { // Exclude Sundays
        effectiveWorkingDays++;
        const dateKey = currentDate.toISOString().split('T')[0];
        const status = dateStatusMap.get(dateKey);

        if (!status) {
          absentDays += 1;
        } else if (status.type === 'attendance' && status.work_hours < 4) {
          halfDays += 1;
        } else if (status.type === 'leave' && status.leave_type === "Unpaid") {
          if (status.is_half_day) {
            halfDays += 1;
          } else {
            unpaidLeaveDays += 1;
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalDeductionDays = absentDays + (halfDays * 0.5) + unpaidLeaveDays;
    // Gross salary is the full base salary for the month
    const grossSalary = baseSalary;
    const totalDeductions = totalDeductionDays * perDaySalary;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      employee_details: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        base_salary: baseSalary,
      },
      gross: Math.round(grossSalary * 100) / 100,
      deductions: Math.round(totalDeductions * 100) / 100,
      net: Math.round(netSalary * 100) / 100,
      breakdown: {
        total_working_days: totalWorkingDays,
        effective_working_days: effectiveWorkingDays,
        per_day_salary: Math.round(perDaySalary * 100) / 100,
        absent_days: absentDays,
        half_days: halfDays,
        unpaid_leave_days: unpaidLeaveDays,
      },
    };
  } catch (error) {
    throw error;
  }
};