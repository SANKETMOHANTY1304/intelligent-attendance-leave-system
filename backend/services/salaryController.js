import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";

/* ---------------- CALCULATE MONTHLY SALARY ---------------- */

export const calculateMonthlySalary = async (employeeId, month, year) => {

  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const baseSalary = employee.salary || employee.base_salary || 0;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  /* -------- WORKING DAYS -------- */

  const daysInMonth = new Date(year, month, 0).getDate();

  let workingDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {

    const date = new Date(year, month - 1, d);
    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      workingDays++;
    }

  }

  /* -------- GET ATTENDANCE -------- */

  const attendanceRecords = await Attendance.find({
    employee_id: employeeId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  /* -------- GET APPROVED LEAVES -------- */

  const approvedLeaves = await LeaveRequest.find({
    employee_id: employeeId,
    status: "Approved",
    start_date: { $lte: endOfMonth },
    end_date: { $gte: startOfMonth }
  });

  /* -------- COUNT LEAVE DAYS -------- */

  let approvedLeaveDays = 0;
  let unpaidLeaveDays = 0;

  approvedLeaves.forEach(leave => {

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);

    const diff =
      (end - start) / (1000 * 60 * 60 * 24) + 1;

    if (leave.leave_type === "Unpaid") {
      unpaidLeaveDays += diff;
    } else {
      approvedLeaveDays += diff;
    }

  });

  /* -------- DEDUCTION CALCULATION -------- */

  let deductionDays = 0;

  attendanceRecords.forEach(record => {

    if (record.status === "Half-day") {
      deductionDays += 0.5;
    }

    else if (record.status === "Late") {
      deductionDays += 0.5;
    }

  });

  /* -------- ABSENT DAYS -------- */

  const attendedDays = attendanceRecords.length;

  const absentDays =
    workingDays - attendedDays - approvedLeaveDays;

  if (absentDays > 0) {
    deductionDays += absentDays;
  }

  /* -------- UNPAID LEAVE -------- */

  deductionDays += unpaidLeaveDays;

  /* -------- SALARY CALCULATION -------- */

  const dailySalary = baseSalary / workingDays;

  const deductions = dailySalary * deductionDays;

  const netSalary = baseSalary - deductions;

  return {

    employee_details: {
      id: employee._id,
      name: employee.name,
      department: employee.department,
      base_salary: baseSalary
    },

    working_days: workingDays,

    attendance_records: attendanceRecords.length,

    approved_leave_days: approvedLeaveDays,

    unpaid_leave_days: unpaidLeaveDays,

    deduction_days: deductionDays,

    gross: baseSalary,

    deductions: Math.round(deductions),

    net: Math.round(netSalary)

  };

};