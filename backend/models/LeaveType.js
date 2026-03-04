import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["Sick", "Casual", "Earned", "Unpaid"],
    required: true,
  },
  max_days_per_year: Number,
});

export default mongoose.model("LeaveType", leaveTypeSchema);