import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Helper: Check if date is weekend (in IST)
const isWeekend = (date) => {
  const dayStr = new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" });
  return dayStr === "Sat" || dayStr === "Sun";
};

// Helper: Calculate work hours
const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return ((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60));
};

// Helper: Get start and end of day (Normalized to UTC for queries)
const getDateRange = (date) => {
  // Always use the IST date string to define the 'day'
  const dateStr = typeof date === 'string' ? date : getISTDateString(date);
  const start = new Date(dateStr + "T00:00:00Z");
  const end = new Date(dateStr + "T23:59:59.999Z");
  return { start, end };
};

// Helper: Calculate status
function calculateStatus(checkIn, checkOut) {
  const hours = calculateWorkHours(checkIn, checkOut);
  if (hours < 4) return "Half-day";
  return "Present";
}

// Helper to format time for display (Forcing IST)
export const formatTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

// Helper: Get date string in IST (YYYY-MM-DD)
const getISTDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

const OFFICE_START_TIME = 10; // 10 AM

// POST /api/attendance/checkin → Employee checks in
export const checkIn = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From JWT token via authEmployee middleware
    const { location } = req.body;
    const now = new Date();

    // Check if today is a weekend
    if (isWeekend(now)) {
      return res.status(400).json({
        success: false,
        message: "Check-in is not allowed on weekends"
      });
    }

    // Check if already checked in today
    const { start, end } = getDateRange(now);
    const existingAttendance = await Attendance.findOne({
      employee_id,
      date: { $gte: start, $lte: end }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today"
      });
    }

    // Get today's IST hour and minute for late check
    const istTimeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
    const [istHour, istMinute] = istTimeStr.split(':').map(Number);

    let status = "Logged In";
    if (istHour > OFFICE_START_TIME || (istHour === OFFICE_START_TIME && istMinute > 30)) {
      status = "Late";
    }

    const attendance = new Attendance({
      employee_id,
      check_in: now,
      check_out: null,
      status,
      date: new Date(getISTDateString(now) + "T00:00:00Z"), // Store normalized date
      location: location || {}
    });

    await attendance.save();
    res.json({
      success: true,
      message: "Checked in successfully",
      attendance: {
        date: attendance.date,
        checkIn: formatTime(attendance.check_in),
        checkOut: null,
        status: attendance.status,
        workHours: 0
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check in"
    });
  }
};

// PUT /api/attendance/checkout → Employee checks out
export const checkOut = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From JWT token
    const today = new Date();

    // Check if today is a weekend
    if (isWeekend(today)) {
      return res.status(400).json({
        success: false,
        message: "Check-out is not allowed on weekends"
      });
    }

    const { start, end } = getDateRange(today);
    const attendance = await Attendance.findOne({
      employee_id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "You haven't checked in today"
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        success: false,
        message: "Already checked out for today"
      });
    }

    attendance.check_out = new Date();
    attendance.work_hours = calculateWorkHours(attendance.check_in, attendance.check_out);
    attendance.status = calculateStatus(attendance.check_in, attendance.check_out);
    await attendance.save();

    // Populate employee details in response
    await attendance.populate("employee_id", "name email department");

    res.json({
      success: true,
      message: "Checked out successfully",
      attendance: {
        date: attendance.date,
        checkIn: formatTime(attendance.check_in),
        checkOut: formatTime(attendance.check_out),
        status: attendance.status,
        workHours: attendance.work_hours
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/daily?date=... → All employees' status for a given day
export const getDailyAttendance = async (req, res) => {
  try {
    let { date } = req.query;
    if (!date) {
      date = getISTDateString();
    }
    const { start, end } = getDateRange(date);
    const records = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate("employee_id", "name email department");

    // Summary counts
    const lateCount = records.filter(r => r.status === "Late").length;
    const absentCount = records.filter(r => r.status === "Absent").length;
    const onLeaveCount = records.filter(r => r.status === "On Leave").length;

    // Format records with camelCase for frontend
    const attendanceRecords = records.map(record => ({
      date: getISTDateString(record.date),
      checkIn: record.check_in ? formatTime(record.check_in) : '--',
      checkOut: record.check_out ? formatTime(record.check_out) : '--',
      status: record.status,
      workHours: record.work_hours || 0,
      employeeName: record.employee_id?.name || 'Unknown',
      employeeEmail: record.employee_id?.email || '',
      department: record.employee_id?.department || '',
      location: record.location || {}
    }));

    res.json({
      date,
      lateCount,
      absentCount,
      onLeaveCount,
      attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/history → Get attendance history for logged-in employee
export const getAttendanceHistory = async (req, res) => {
  try {
    const employee_id = req.employee.id; // From authEmployee middleware (JWT token)
    const { limit = 30 } = req.query; // Default to last 30 records

    // Fetch attendance records for this employee, sorted by most recent first
    const attendanceRecords = await Attendance.find({ employee_id })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('employee_id', 'name email');

    // Format the response with camelCase properties for frontend
    const attendance = attendanceRecords.map(record => ({
      date: getISTDateString(record.date),
      checkIn: record.check_in ? formatTime(record.check_in) : '--',
      checkOut: record.check_out ? formatTime(record.check_out) : '--',
      status: record.status,
      workHours: record.work_hours || 0,
      notes: record.notes || '',
      employeeName: record.employee_id?.name || 'Unknown'
    }));

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/all → Get all attendance records for admin
export const getAllAttendance = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const records = await Attendance.find()
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('employee_id', 'name email department');

    const attendance = records.map(record => ({
      date: getISTDateString(record.date),
      checkIn: record.check_in ? formatTime(record.check_in) : '--',
      checkOut: record.check_out ? formatTime(record.check_out) : '--',
      status: record.status,
      workHours: record.work_hours || 0,
      employeeName: record.employee_id?.name || 'Unknown',
      department: record.employee_id?.department || '',
      location: record.location || {}
    }));

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

