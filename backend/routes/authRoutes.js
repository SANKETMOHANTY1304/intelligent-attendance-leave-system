import express from "express";
import { unifiedLogin } from "../user/authController.js";

const authRouter = express.Router();

// POST /api/auth/login → Unified login with role parameter
// Body: { email, password, role: "admin" | "employee" }
authRouter.post("/login", unifiedLogin);

export default authRouter;
