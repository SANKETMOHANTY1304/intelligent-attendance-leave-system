import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    check_in: Date,
    check_out: Date,
    status: {
      type: String,
      enum: ["Logged In", "Late", "Present", "Half-day", "Absent"],
      required: true,
    },
    work_hours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance per employee per day
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);


