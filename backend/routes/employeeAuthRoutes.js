import express from "express";
import { employeeRegister } from "../services/employeeAuthController.js";

const employeeAuthRouter = express.Router();

// POST /api/employee/register → Employee registration
employeeAuthRouter.post("/register", employeeRegister);

export default employeeAuthRouter;
