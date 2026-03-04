// ===== BACKEND API INTEGRATION =====
// All data now comes from the backend API

// ===== Data Access Functions (Using Backend APIs) =====
async function getEmployees() {
  try {
    const response = await apiGet(API.employees.all());
    // Backend findallEmployee returns a raw array directly
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    showToast('Failed to load employees', 'error');
    return [];
  }
}

async function getMyProfile() {
  try {
    const response = await apiGet(API.employees.profile());
    // Backend getCurrentEmployeeProfile returns { success, data: {...} }
    return response.data || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

async function getDashboardData(type = 'monthly', year = null, month = null) {
  const user = getCurrentUser();
  const currentDate = new Date();
  const currentYear = year || currentDate.getFullYear();
  const currentMonth = month || (currentDate.getMonth() + 1);

  let url;
  if (user.role === 'admin') {
    url = `${API.employees.adminDashboard()}?type=${type}&year=${currentYear}`;
    if (type === 'monthly') url += `&month=${currentMonth}`;
  } else {
    url = `${API.employees.myDashboard()}?type=${type}&year=${currentYear}`;
  }

  try {
    const response = await apiGet(url);
    return response.dashboard;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
    return null;
  }
}

async function getAttendanceHistory(month = null, year = null) {
  try {
    let url = API.attendance.history();
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    const response = await apiGet(url);
    return response.attendance || [];
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return [];
  }
}

async function getMyLeaves() {
  try {
    const response = await apiGet(API.leaves.my());
    return response.data || [];
  } catch (error) {
    console.error('Error fetching my leaves:', error);
    return [];
  }
}

// Admin: get all leave requests (uses admin auth)
async function getAllLeaves() {
  try {
    const response = await apiGet(API.leaves.all());
    return response.data || [];
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    return [];
  }
}

async function getLeaveBalance() {
  try {
    const response = await apiGet(API.leaves.balance());
    return response;
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return { remaining: 0, used: 0, total: 0 };
  }
}

// Deprecated localStorage functions (kept for backward compatibility)
function getAttendance() {
  console.warn('getAttendance() is deprecated. Use getAttendanceHistory() instead.');
  return [];
}

function getLeaves() {
  console.warn('getLeaves() is deprecated. Use getMyLeaves() instead.');
  return [];
}

function saveEmployees(employees) {
  console.warn('saveEmployees() is deprecated. Data is now saved on the backend.');
}

function saveAttendance(records) {
  console.warn('saveAttendance() is deprecated. Data is now saved on the backend.');
}

function saveLeaves(leaves) {
  console.warn('saveLeaves() is deprecated. Data is now saved on the backend.');
}

// ===== Auth =====
function getCurrentUser() {
  const stored = localStorage.getItem("hr_user") || sessionStorage.getItem("hr_user");
  if (stored) return JSON.parse(stored);
  return null;
}

function logout() {
  localStorage.removeItem("hr_user");
  localStorage.removeItem("hr_token");
  sessionStorage.removeItem("hr_user");
  sessionStorage.removeItem("hr_token");
  window.location.href = "login.html";
}

function requireAuth(requiredRole) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = "dashboard.html";
    return null;
  }
  return user;
}

// ===== Toast Notifications =====
function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:#059669"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:#DC2626"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    info: '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:#2563EB"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Mobile Sidebar Toggle =====
function initSidebar() {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
}

// ===== Modal =====
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// ===== Sidebar Renderer =====
function renderSidebar(role, activePage) {
  const user = getCurrentUser();
  const userName = user ? user.name : (role === "admin" ? "Admin User" : "Employee");
  const userRole = role === "admin" ? "HR Administrator" : "Employee";
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const adminNav = [
    { name: "Dashboard", icon: "grid", href: "dashboard.html" },
    { name: "Employees", icon: "users", href: "Employees.html" },
    { name: "Attendance", icon: "clock", href: "attendance.html" },
    { name: "Leave Management", icon: "calendar", href: "leave.html" },
    { name: "Reports", icon: "chart", href: "reports.html" },
  ];

  const employeeNav = [
    { name: "Dashboard", icon: "grid", href: "dashboard.html" },
    { name: "My Attendance", icon: "clock", href: "attendance.html" },
    { name: "Apply Leave", icon: "calendar", href: "leave.html" },
    { name: "My Profile", icon: "user", href: "profile.html" },
  ];

  const navItems = role === "admin" ? adminNav : employeeNav;

  const iconMap = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  };

  const navHTML = navItems.map(item => {
    const isActive = activePage === item.name.toLowerCase().replace(/\s+/g, '-');
    return `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">${iconMap[item.icon] || ''}<span>${item.name}</span></a>`;
  }).join("");

  return `
    <div class="sidebar-overlay"></div>
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span class="sidebar-brand-text">HR Suite</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">${role === 'admin' ? 'Administration' : 'Navigation'}</div>
        ${navHTML}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" onclick="logout()">
          <div class="sidebar-avatar">${initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${userName}</div>
            <div class="sidebar-user-role">${userRole}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#94A3B8;flex-shrink:0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
      </div>
    </aside>
  `;
}

// ===== Topbar Renderer =====
function renderTopbar(title, breadcrumb) {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="mobile-menu-btn" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div>
          <div class="topbar-title">${title}</div>
          ${breadcrumb ? `<div class="topbar-breadcrumb">${breadcrumb}</div>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <button class="btn btn-outline btn-sm" onclick="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </header>
  `;
}

// ===== Utility =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getStatusBadge(status) {
  const map = {
    "Present": "badge-success",
    "Approved": "badge-success",
    "Logged In": "badge-success",
    "Late": "badge-warning",
    "Pending": "badge-warning",
    "Half-day": "badge-warning",
    "Absent": "badge-danger",
    "Rejected": "badge-danger",
    "On Leave": "badge-primary",
  };
  return `<span class="badge ${map[status] || 'badge-primary'}">${status}</span>`;
}

function showSpinner(el) {
  el.innerHTML = `
    <div style="padding:40px;text-align:center">
      <div class="spinner"></div>
      <p>Loading reports...</p>
    </div>`;
}
