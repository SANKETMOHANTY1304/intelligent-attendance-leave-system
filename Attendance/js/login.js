// LOGIN
async function login() {
    const role = document.getElementById("loginRole").value;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    console.log('Attempting login:', { email, role });
    const loginBtn = event?.target;
    if (loginBtn) loginBtn.disabled = true;

    try {
        const response = await fetch(API.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok || !data.success) {
            alert(data.message || 'Login failed');
            if (loginBtn) loginBtn.disabled = false;
            return;
        }

        // Store user data and token
        if (data.token) {
            localStorage.setItem('hr_token', data.token);
            sessionStorage.setItem('hr_token', data.token);
        }
        
        const user = {
            name: data.employee?.name || data.admin?.name || "User",
            email: email,
            role: role,
            employeeData: data.employee || data.admin
        };
        
        localStorage.setItem("hr_user", JSON.stringify(user));
        sessionStorage.setItem("hr_user", JSON.stringify(user));
        alert(`Login successful! Welcome ${user.name}`);
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error('Login error:', error);
        alert("Login failed. Please check your network connection and try again.\nError: " + error.message);
        if (loginBtn) loginBtn.disabled = false;
    }
}

async function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const department = document.getElementById("department").value.trim();

    if (!name || !email || !password || !department) {
        alert("Please fill in all required fields (Name, Email, Password, Department)");
        return;
    }

    console.log('Attempting registration:', { name, email, department });
    const registerBtn = event?.target;
    if (registerBtn) registerBtn.disabled = true;

    try {
        const response = await fetch(API.employeeRegister, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                email, 
                password, 
                department 
            })
        });

        const data = await response.json();
        console.log('Registration response:', data);

        if (!response.ok || !data.success) {
            alert(data.message || 'Registration failed');
            if (registerBtn) registerBtn.disabled = false;
            return;
        }

        // Store token and user data
        if (data.token) {
            localStorage.setItem('hr_token', data.token);
            sessionStorage.setItem('hr_token', data.token);
        }
        
        const user = {
            name: data.employee?.name || name,
            email: email,
            role: "employee",
            employeeData: data.employee
        };
        
        localStorage.setItem("hr_user", JSON.stringify(user));
        sessionStorage.setItem("hr_user", JSON.stringify(user));
        alert(`Registration successful! Welcome ${user.name}`);
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error('Registration error:', error);
        alert("Registration failed. Please check your network connection and try again.\nError: " + error.message);
        if (registerBtn) registerBtn.disabled = false;
    }
}

function onRoleChange() {
    const role = document.getElementById("loginRole").value;
    const registerLink = document.getElementById("registerLink");

    if (role === "admin") {
        registerLink.classList.add("hidden");
    } else {
        registerLink.classList.remove("hidden");
    }
}

function showRegister() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    onRoleChange();
}