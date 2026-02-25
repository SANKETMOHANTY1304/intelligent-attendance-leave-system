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
      enum: ["Present", "Absent", "Half-day"],
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ prevent duplicate attendance per day
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);


