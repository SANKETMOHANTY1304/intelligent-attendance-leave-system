import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
const PORT=8080;
dotenv.config();
import employeeRouter from "./routes/Employees.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import reportsRouter from "./routes/reportRoutes.js";
import leavesRoutes from "./routes/leaveRoutes.js";


const app = express();

// middleware
app.use(express.json());

// Start server
const startServer = async () => {
  try {
    // connect database
    await connectDB();
    
    app.listen(PORT,()=>{
        console.log("server working")
    })
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

// test route
app.get("/", (req, res) => {
  res.send("Server running and DB connected ");
});



app.use('/api/employees',employeeRouter)
app.use('/api/attendance',attendanceRouter)
app.use("/api/leaves", leavesRoutes);
app.use('/api/reports',reportsRouter)

  