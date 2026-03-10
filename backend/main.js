import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import connectDB from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.DOTENV_QUIET = "true";
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const PORT = process.env.PORT || 8080;
import employeeRouter from "./routes/Employees.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import reportsRouter from "./routes/reportRoutes.js";
import leavesRoutes from "./routes/leaveRoutes.js";
import employeeAuthRouter from "./routes/employeeAuthRoutes.js";
import authRouter from "./routes/authRoutes.js";


const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import mongoose from "mongoose";

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Attendance')));

// Connect database but don't await blocking the server start
connectDB();

// Add mongoose event listeners (removed to hide logs)

// Start server
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}/login.html`);
    })
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

// Start the server in all environments for Digital Ocean
startServer();

// test route
app.get("/", (req, res) => {
  res.send("Server running");
});


app.use('/api/employees', employeeRouter)
app.use('/api/attendance', attendanceRouter)
app.use("/api/leaves", leavesRoutes);
app.use('/api/reports', reportsRouter)


app.use('/api/employee', employeeAuthRouter)
app.use('/api/auth', authRouter)

export default app;

