
import jwt from "jsonwebtoken";

// Admin Login - credentials from .env
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get admin credentials from .env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check email and password (direct comparison for plain text credentials)
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: adminEmail, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Admin login failed", error: error.message });
  }
};
