// API Configuration
const API_BASE_URL = '/api';

// API Endpoints
const API = {
    // Auth endpoints
    login: `${API_BASE_URL}/auth/login`,
    employeeRegister: `${API_BASE_URL}/employee/register`,

    // Employee endpoints
    employees: {
        all: () => `${API_BASE_URL}/employees/allemployee`,
        search: (query) => `${API_BASE_URL}/employees/search?q=${query}`,
        me: () => `${API_BASE_URL}/employees/me`,
        profile: () => `${API_BASE_URL}/employees/me/profile`,
        updateProfile: () => `${API_BASE_URL}/employees/me/profile`,
        uploadPhoto: () => `${API_BASE_URL}/employees/me/profile/picture`,
        update: (id) => `${API_BASE_URL}/employees/${id}`,
        adminDashboard: () => `${API_BASE_URL}/employees/admin/dashboard`,
        myDashboard: () => `${API_BASE_URL}/employees/me/dashboard`
    },

    // Attendance endpoints
    attendance: {
        checkIn: () => `${API_BASE_URL}/attendance/checkin`,
        checkOut: () => `${API_BASE_URL}/attendance/checkout`,
        history: () => `${API_BASE_URL}/attendance/history`,
        daily: () => `${API_BASE_URL}/attendance/daily`,
        all: () => `${API_BASE_URL}/attendance/all`
    },

    // Leave endpoints
    leaves: {
        all: () => `${API_BASE_URL}/leaves`,
        pending: () => `${API_BASE_URL}/leaves/pending`,
        balance: () => `${API_BASE_URL}/leaves/balance`,
        my: () => `${API_BASE_URL}/leaves/my`,
        apply: () => `${API_BASE_URL}/leaves/apply`,
        approve: (id) => `${API_BASE_URL}/leaves/${id}/approve`,
        reject: (id) => `${API_BASE_URL}/leaves/${id}/reject`
    },

    // Report endpoints
    reports: {
        leaveUtilization: () => `${API_BASE_URL}/reports/leave-utilization`,
        attendanceSummary: () => `${API_BASE_URL}/reports/attendance-summary`,
        departmentAverages: () => `${API_BASE_URL}/reports/department-averages`,
        salary: () => `${API_BASE_URL}/reports/salary`
    }
};

// Helper function for API calls
async function apiCall(url, options = {}) {
    try {
        const token = localStorage.getItem('hr_token') || sessionStorage.getItem('hr_token');
        const headers = {
            ...options.headers
        };

        // Add Content-Type only if not FormData (for file uploads)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401 && data.message && data.message.includes('Token expired')) {
                localStorage.removeItem('hr_token');
                localStorage.removeItem('hr_user');
                sessionStorage.removeItem('hr_token');
                sessionStorage.removeItem('hr_user');
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Utility function for GET requests
async function apiGet(url) {
    return apiCall(url, { method: 'GET' });
}

// Utility function for POST requests
async function apiPost(url, body) {
    const options = { method: 'POST' };

    // Don't stringify FormData (for file uploads)
    if (body instanceof FormData) {
        options.body = body;
    } else {
        options.body = JSON.stringify(body);
    }

    return apiCall(url, options);
}

// Utility function for PUT requests
async function apiPut(url, body) {
    const options = { method: 'PUT' };

    // Don't stringify FormData (for file uploads)
    if (body instanceof FormData) {
        options.body = body;
    } else {
        options.body = JSON.stringify(body);
    }

    return apiCall(url, options);
}

// Utility function for DELETE requests
async function apiDelete(url) {
    return apiCall(url, { method: 'DELETE' });
}
