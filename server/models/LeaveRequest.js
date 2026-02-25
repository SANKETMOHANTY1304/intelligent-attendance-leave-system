import mongoose from "mongoose";

// ✅ CENTRAL LEAVE RULES
export const LEAVE_RULES = {
  Casual: { max_days_per_year: 12 },
  Sick: { max_days_per_year: 10 },
  Earned: { max_days_per_year: 15 },
  Unpaid: { max_days_per_year: Infinity },
};

const leaveRequestSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leave_type: {
      type: String,
      enum: ["Sick", "Casual", "Earned", "Unpaid"],
      required: true,
    },

    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    is_half_day: { type: Boolean, default: false },

    half_day_type: {
      type: String,
      enum: ["First-Half", "Second-Half"],
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    reason: String,
    approver_note: String,
    number_of_days: Number,
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);