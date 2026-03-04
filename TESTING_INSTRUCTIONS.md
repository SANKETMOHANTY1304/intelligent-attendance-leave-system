# Testing Instructions - Login & Registration

## ✅ Backend Server Status
- **Server URL:** http://localhost:8080
- **Status:** Running and connected to MongoDB ✓

## 🎯 How to Test

### 1. Access the Application
Open your browser and navigate to:
```
http://localhost:8080/login.html
```

### 2. Test Employee Registration

**Steps:**
1. Click on "Register" link (visible when "Employee" is selected)
2. Fill in the registration form:
   - **Full Name:** Enter any name (e.g., "John Doe")
   - **Email:** Enter a valid email (e.g., "john@example.com")
   - **Password:** Enter password (min 6 characters)
   - **Department:** Select from dropdown (IT, HR, Finance, Marketing, Operations)
3. Click "Register" button
4. You should see success message: "Employee Registered Successfully! You can now login."

### 3. Test Employee Login

**Steps:**
1. Make sure "Employee" is selected in role dropdown
2. Enter the registered email and password
3. Click "Login" button
4. You should be redirected to dashboard on success

**Test Credentials (if you registered):**
- Email: your_registered_email@example.com
- Password: your_password

### 4. Test Admin Login

**Default Admin Credentials:**
- **Email:** admin@gmail.com
- **Password:** query123

**Steps:**
1. Select "Admin" from role dropdown
2. Enter admin credentials above
3. Click "Login" button
4. You should be redirected to dashboard on success

## 🐛 Troubleshooting

### If registration fails:
- Check browser console (F12) for error messages
- Verify all fields are filled
- Department must be one of: IT, HR, Finance, Marketing, Operations
- Password must be at least 6 characters

### If login fails:
- Check browser console (F12) for detailed errors
- Verify credentials are correct
- Make sure server is running (check terminal)
- For employee login, make sure you registered first

### If server is not responding:
1. Check if server is running in terminal
2. Look for message: "✅ MongoDB Atlas Connected Successfully!"
3. Server should be on port 8080
4. Try: http://localhost:8080/ (should show "Server running and DB connected")

## 📝 API Endpoints Being Used

- **Register:** POST http://localhost:8080/api/employee/register
- **Login:** POST http://localhost:8080/api/auth/login

## ✨ What's Working Now

✅ Frontend and backend are connected
✅ CORS is enabled for cross-origin requests
✅ Department validation is fixed
✅ Login returns user data for both admin and employee
✅ Registration auto-assigns salary based on department
✅ JWT token authentication is working
✅ Session storage for user data
✅ Better error messages with console logging

## 🔍 Console Logging

Open browser console (F12) to see:
- Login/Registration attempts
- Server responses
- Any error messages

This will help debug if something doesn't work!
