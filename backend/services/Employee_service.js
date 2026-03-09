import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest, { LEAVE_RULES } from "../models/LeaveRequest.js";
import { calculateTotalAllowance } from "./leaveController.js";


// Shows all employees (no filtering)
export const findallEmployee = async (req, res) => {
  try {
    const all = await Employee.find({}, 'name email department designation base_salary joining_date createdAt updatedAt');
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Shows employees by name (search/filter)
export const findEmployeeByName = async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Name query parameter is required.' });
  }
  try {
    const employees = await Employee.find({ name: { $regex: name, $options: 'i' } }, 'name email department designation base_salary joining_date createdAt updatedAt');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Dashboard summary for employee
/**
 * GET /api/employees/me/dashboard?type=monthly|yearly&year=2026
 * Returns:
 *  - stats         → Today's status, days present this month, pending/approved leaves, leave balance
 *  - recentLeaves  → last 5 leave requests
 *  - attendanceTrend → monthly or yearly attendance % (line chart)
 */
export const getEmployeeDashboard = async (req, res) => {
  try {
    const id = req.employee.id; // From authEmployee middleware (JWT token has { id, role })
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = now.getMonth() + 1;
    const type = req.query.type || "monthly";

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const dayEnd = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
    const PRESENT_STATUSES = ["Logged In", "Late", "Present"];
    const countWorkingDays = (y, m) => {
      const days = new Date(y, m, 0).getDate();
      let count = 0;
      for (let d = 1; d <= days; d++) {
        const day = new Date(y, m - 1, d).getDay();
        if (day !== 0 && day !== 6) count++;
      }
      return count;
    };

    // 1. Today's attendance record
    const todayRecord = await Attendance.findOne({
      employee_id: id,
      date: { $gte: dayStart(now), $lte: dayEnd(now) },
    });

    // 2. Days present this month
    const daysPresent = await Attendance.countDocuments({
      employee_id: id,
      date: { $gte: monthStart, $lte: monthEnd },
      status: { $in: PRESENT_STATUSES },
    });

    // 3. Pending & approved leaves this year
    const [pendingLeaves, approvedLeaves] = await Promise.all([
      LeaveRequest.countDocuments({ employee_id: id, status: "Pending", start_date: { $gte: yearStart, $lte: yearEnd } }),
      LeaveRequest.countDocuments({ employee_id: id, status: "Approved", start_date: { $gte: yearStart, $lte: yearEnd } }),
    ]);

    // 4. Leave balance
    const employee = await Employee.findById(id);
    const balance = {};
    for (const [type_, rule] of Object.entries(LEAVE_RULES)) {
      const used = (await LeaveRequest.find({
        employee_id: id,
        leave_type: type_,
        status: "Approved",
        start_date: { $gte: yearStart },
        end_date: { $lte: yearEnd },
      })).reduce((sum, leave) => sum + (leave.number_of_days || 0), 0);
      const allowance = calculateTotalAllowance(employee, type_);
      balance[type_.toLowerCase()] = {
        remaining: type_ === "Unpaid" ? "unlimited" : Math.max(0, allowance - used),
        total: type_ === "Unpaid" ? "unlimited" : allowance
      };
    }

    // 5. Recent 5 leave requests (with rejection reason)
    const recentLeaves = await LeaveRequest.find({ employee_id: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("leave_type start_date end_date status number_of_days approver_note reason");

    // 6. Attendance trend (line chart)
    const attendanceTrend = [];
    if (type === "monthly") {
      for (let m = 1; m <= 12; m++) {
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59);
        const workDays = countWorkingDays(year, m);
        const present = await Attendance.countDocuments({
          employee_id: id,
          date: { $gte: start, $lte: end },
          status: { $in: PRESENT_STATUSES },
        });
        const pct = workDays > 0 ? Math.round((present / workDays) * 100) : 0;
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
          employee_id: id,
          date: { $gte: start, $lte: end },
          status: { $in: PRESENT_STATUSES },
        });
        const pct = workDays > 0 ? Math.round((present / workDays) * 100) : 0;
        attendanceTrend.push({ label: String(y), attendancePct: pct });
      }
    }

    // Format attendance trend for frontend charts (labels + data arrays)
    const trendLabels = attendanceTrend.map(t => t.label);
    const trendData = attendanceTrend.map(t => t.attendancePct);

    res.json({
      success: true,
      dashboard: {
        stats: {
          todayStatus: todayRecord
            ? { status: todayRecord.status, checkIn: todayRecord.check_in, checkOut: todayRecord.check_out, workHours: todayRecord.work_hours }
            : null,
          daysPresent,
          workingDaysInMonth: countWorkingDays(year, month),
          pendingLeaves,
          approvedLeaves,
          leaveBalance: balance,
        },
        recentLeaves,
        trends: { type, year, labels: trendLabels, data: trendData },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== EMPLOYEE PROFILE MANAGEMENT (SELF-SERVICE) ====================

/**
 * GET /api/employees/me/profile
 * Get current logged-in employee's profile (using auth middleware)
 */
export const getCurrentEmployeeProfile = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From authEmployee middleware (JWT token has { id, role })

    const employee = await Employee.findById(employee_id).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const profileData = {
      id: employee._id,
      fullName: employee.name,
      emailAddress: employee.email,
      designation: employee.designation,
      department: employee.department,
      annualSalary: employee.base_salary,
      joiningDate: employee.joining_date,
      profilePicture: employee.profile_picture,
      status: "Active",
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error("Error fetching current employee profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message
    });
  }
};

/**
 * PUT /api/employees/me/profile
 * Update current logged-in employee's profile (name and email only)
 */
export const updateCurrentEmployeeProfile = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From authEmployee middleware (JWT token has { id, role })
    const { fullName, emailAddress } = req.body;

    // Build update object
    const updateData = {};

    if (fullName) updateData.name = fullName.trim();

    if (emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      const existingEmployee = await Employee.findOne({
        email: emailAddress.toLowerCase(),
        _id: { $ne: employee_id }
      });

      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: "Email address already exists"
        });
      }

      updateData.email = emailAddress.toLowerCase();
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee_id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const profileData = {
      id: updatedEmployee._id,
      fullName: updatedEmployee.name,
      emailAddress: updatedEmployee.email,
      designation: updatedEmployee.designation,
      department: updatedEmployee.department,
      annualSalary: updatedEmployee.base_salary,
      joiningDate: updatedEmployee.joining_date,
      profilePicture: updatedEmployee.profile_picture,
      status: "Active",
      updatedAt: updatedEmployee.updatedAt
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profileData
    });

  } catch (error) {
    console.error("Error updating current employee profile:", error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message
    });
  }
};

/**
 * PUT /api/employees/me/profile/picture
 * Update current logged-in employee's profile picture
 */
export const updateProfilePicture = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From authEmployee middleware (JWT token has { id, role })

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    // Update profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee_id,
      { profile_picture: profilePicturePath },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profilePicture: updatedEmployee.profile_picture
      }
    });

  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile picture",
      error: error.message
    });
  }
};