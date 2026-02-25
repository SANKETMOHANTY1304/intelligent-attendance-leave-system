import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: String,
    designation: String,
    base_salary: Number,
    joining_date: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);