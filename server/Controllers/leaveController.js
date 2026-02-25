import LeaveRequest, { LEAVE_RULES } from "../models/LeaveRequest.js";
import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";

// helper
const calculateDays = (start, end, isHalfDay) => {
  if (isHalfDay) return 0.5;
  const diff =
    (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
  return diff;
};

export const applyLeave = async (req, res) => {
  try {
    const {
      employee_id,
      leave_type,
      start_date,
      end_date,
      is_half_day,
      half_day_type,
      reason,
    } = req.body;

    // ✅ overlap check
    const overlap = await LeaveRequest.findOne({
      employee_id,
      status: { $in: ["Pending", "Approved"] },
      start_date: { $lte: end_date },
      end_date: { $gte: start_date },
    });

    if (overlap) {
      return res
        .status(400)
        .json({ message: "Leave dates overlap" });
    }

    // ✅ get rule
    const rule = LEAVE_RULES[leave_type];
    if (!rule) {
      return res.status(400).json({ message: "Invalid leave type" });
    }

    const requestedDays = calculateDays(
      start_date,
      end_date,
      is_half_day
    );

    // ✅ yearly usage check (except unpaid)
    if (leave_type !== "Unpaid") {
      const yearStart = new Date(
        new Date(start_date).getFullYear(),
        0,
        1
      );
      const yearEnd = new Date(
        new Date(start_date).getFullYear(),
        11,
        31
      );

      const used = await LeaveRequest.aggregate([
        {
          $match: {
            employee_id: new mongoose.Types.ObjectId(employee_id),
            leave_type,
            status: "Approved",
            start_date: { $gte: yearStart, $lte: yearEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$number_of_days" },
          },
        },
      ]);

      const usedDays = used[0]?.total || 0;

      if (usedDays + requestedDays > rule.max_days_per_year) {
        return res.status(400).json({
          message: `Exceeds yearly limit for ${leave_type}`,
        });
      }
    }

    const leave = await LeaveRequest.create({
      employee_id,
      leave_type,
      start_date,
      end_date,
      is_half_day,
      half_day_type,
      reason,
      number_of_days: requestedDays,
    });

    res.json({ id: leave._id, status: "Pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ APPROVE LEAVE (AUTO ATTENDANCE)
export const approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // ✅ Check leave balance before approving
    const rule = LEAVE_RULES[leave.leave_type];
    if (leave.leave_type !== "Unpaid" && rule) {
      const year = new Date(leave.start_date).getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      const used = await LeaveRequest.aggregate([
        {
          $match: {
            employee_id: leave.employee_id,
            leave_type: leave.leave_type,
            status: "Approved",
            start_date: { $gte: yearStart, $lte: yearEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$number_of_days" },
          },
        },
      ]);

      const usedDays = used[0]?.total || 0;
      if (usedDays + leave.number_of_days > rule.max_days_per_year) {
        return res.status(400).json({
          message: `Cannot approve: exceeds yearly limit for ${leave.leave_type}. Used: ${usedDays}, Limit: ${rule.max_days_per_year}`
        });
      }
    }

    leave.status = "Approved";
    leave.approver_note = req.body?.approver_note || "Approved";
    await leave.save();

    // 🔥 auto attendance update
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    let attendanceUpdatedCount = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      await Attendance.findOneAndUpdate(
        {
          employee_id: leave.employee_id,
          date: new Date(d),
        },
        {
          employee_id: leave.employee_id,
          date: new Date(d),
          status: leave.is_half_day ? "Half-day" : "On Leave",
        },
        { upsert: true, returnDocument: 'after' }
      );
      attendanceUpdatedCount++;
    }

    res.json({
      id: leave._id,
      status: "Approved",
      message: `Leave approved & attendance marked as 'On Leave' for ${attendanceUpdatedCount} days`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ REJECT LEAVE
export const rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        rejection_reason: req.body?.rejection_reason,
      },
      { returnDocument: 'after' }
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json({ id: leave._id, status: "Rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET ALL LEAVES (WITH FILTERS)
export const getAllLeaves = async (req, res) => {
  try {
    const { employee_id, year } = req.query;
    const filter = {};
    const appliedFilters = {};

    // Filter by employee_id if provided
    if (employee_id) {
      filter.employee_id = employee_id;
      appliedFilters.employee_id = employee_id;
    }

    // Filter by year if provided
    if (year) {
      const yearNum = parseInt(year);
      const yearStart = new Date(yearNum, 0, 1);
      const yearEnd = new Date(yearNum, 11, 31);
      filter.start_date = { $gte: yearStart, $lte: yearEnd };
      appliedFilters.year = yearNum;
    }

    const leaves = await LeaveRequest.find(filter)
      .populate("employee_id", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      filters: appliedFilters,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET PENDING LEAVES ONLY
export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ status: "Pending" })
      .populate("employee_id", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET LEAVE BALANCE FOR EMPLOYEE
export const getLeaveBalance = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const year = new Date().getFullYear();
    const balance = {};

    for (const [type, rule] of Object.entries(LEAVE_RULES)) {
      const used = (await LeaveRequest.find({
        employee_id: emp_id,
        leave_type: type,
        status: "Approved",
        start_date: { $gte: new Date(year, 0, 1) },
        end_date: { $lte: new Date(year, 11, 31) },
      })).reduce((sum, leave) => sum + (leave.number_of_days || 0), 0);

      balance[type.toLowerCase()] = type === "Unpaid" ? "unlimited" : Math.max(0, rule.max_days_per_year - used);
    }

    res.json({ success: true, employee_id: emp_id, year, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};