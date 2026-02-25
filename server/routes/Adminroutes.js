import express from "express";
import { adminLogin } from "../services/adminController.js";

const adminRouter = express.Router();

// POST /api/admin/login → Admin login with token generation
adminRouter.post("/login", adminLogin);

export default adminRouter;
