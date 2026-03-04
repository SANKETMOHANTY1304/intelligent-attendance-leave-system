import mongoose from "mongoose";

export const DEPARTMENT_SALARIES = {
  IT: 80000,
  HR: 60000,
  Finance: 75000,
  Marketing: 65000,
  Operations: 55000,
};

export const DEPARTMENTS = Object.keys(DEPARTMENT_SALARIES);

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },


    designation: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Auto-managed — user cannot control
    base_salary: {
      type: Number,
    },

    joining_date: {
      type: Date,
      required: true,
    },

    profile_picture: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


// 🔥 BULLETPROOF SALARY ASSIGNMENT
employeeSchema.pre("save", function () {
  if (this.isModified("department") || this.isNew) {
    this.base_salary = DEPARTMENT_SALARIES[this.department];
  }
});

export default mongoose.model("Employee", employeeSchema);