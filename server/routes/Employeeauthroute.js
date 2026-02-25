
import express from "express";
import { employeeRegister, employeeLogin } from "../services/employeeAuthController.js";

const employeeAuthRouter = express.Router();

// POST /api/employee/register → Employee registration with token generation
employeeAuthRouter.post("/register", employeeRegister);

// POST /api/employee/login → Employee login with token generation
employeeAuthRouter.post("/login", employeeLogin);

export default employeeAuthRouter;
