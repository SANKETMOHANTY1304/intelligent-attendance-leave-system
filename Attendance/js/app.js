// ===== Sample Data Store =====
const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Arjun Mehta", email: "arjun@company.com", department: "Engineering", designation: "Senior Developer", salary: "95,000", joiningDate: "2022-03-15" },
  { id: 2, name: "Priya Sharma", email: "priya@company.com", department: "Design", designation: "UI/UX Lead", salary: "88,000", joiningDate: "2021-07-20" },
  { id: 3, name: "Rahul Gupta", email: "rahul@company.com", department: "Marketing", designation: "Marketing Manager", salary: "82,000", joiningDate: "2023-01-10" },
  { id: 4, name: "Sneha Iyer", email: "sneha@company.com", department: "HR", designation: "HR Specialist", salary: "75,000", joiningDate: "2022-09-05" },
  { id: 5, name: "Vikram Patel", email: "vikram@company.com", department: "Engineering", designation: "Backend Developer", salary: "90,000", joiningDate: "2023-06-01" },
  { id: 6, name: "Ananya Das", email: "ananya@company.com", department: "Finance", designation: "Financial Analyst", salary: "85,000", joiningDate: "2022-11-18" },
  { id: 7, name: "Karthik Reddy", email: "karthik@company.com", department: "Engineering", designation: "DevOps Engineer", salary: "92,000", joiningDate: "2021-12-01" },
  { id: 8, name: "Meera Joshi", email: "meera@company.com", department: "Support", designation: "Support Lead", salary: "70,000", joiningDate: "2023-04-12" },
];

const DEFAULT_ATTENDANCE = [
  { id: 1, employeeName: "Arjun Mehta", date: "2026-02-25", checkIn: "09:05", checkOut: "18:10", status: "Present" },
  { id: 2, employeeName: "Priya Sharma", date: "2026-02-25", checkIn: "09:00", checkOut: "18:00", status: "Present" },
  { id: 3, employeeName: "Rahul Gupta", date: "2026-02-25", checkIn: "09:30", checkOut: "18:30", status: "Late" },
  { id: 4, employeeName: "Sneha Iyer", date: "2026-02-25", checkIn: "--", checkOut: "--", status: "Absent" },
  { id: 5, employeeName: "Vikram Patel", date: "2026-02-25", checkIn: "08:50", checkOut: "17:50", status: "Present" },
  { id: 6, employeeName: "Ananya Das", date: "2026-02-25", checkIn: "09:15", checkOut: "18:15", status: "Present" },
  { id: 7, employeeName: "Karthik Reddy", date: "2026-02-25", checkIn: "09:00", checkOut: "18:00", status: "Present" },
  { id: 8, employeeName: "Meera Joshi", date: "2026-02-25", checkIn: "--", checkOut: "--", status: "On Leave" },
];

const DEFAULT_LEAVES = [
  { id: 1, employeeName: "Arjun Mehta", type: "Sick Leave", startDate: "2026-02-20", endDate: "2026-02-21", reason: "Fever and cold", status: "Approved" },
  { id: 2, employeeName: "Priya Sharma", type: "Casual Leave", startDate: "2026-03-01", endDate: "2026-03-02", reason: "Personal work", status: "Pending" },
  { id: 3, employeeName: "Sneha Iyer", type: "Sick Leave", startDate: "2026-02-25", endDate: "2026-02-25", reason: "Doctor appointment", status: "Pending" },
  { id: 4, employeeName: "Rahul Gupta", type: "Vacation", startDate: "2026-03-10", endDate: "2026-03-15", reason: "Family vacation", status: "Pending" },
  { id: 5, employeeName: "Vikram Patel", type: "Casual Leave", startDate: "2026-02-18", endDate: "2026-02-18", reason: "Moving to a new apartment", status: "Rejected" },
];

// ===== Data Access =====
function getEmployees() {
  const stored = localStorage.getItem("hr_employees");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("hr_employees", JSON.stringify(DEFAULT_EMPLOYEES));
  return DEFAULT_EMPLOYEES;
}

function saveEmployees(employees) {
  localStorage.setItem("hr_employees", JSON.stringify(employees));
}

function getAttendance() {
  const stored = localStorage.getItem("hr_attendance");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("hr_attendance", JSON.stringify(DEFAULT_ATTENDANCE));
  return DEFAULT_ATTENDANCE;
}

function saveAttendance(records) {
  localStorage.setItem("hr_attendance", JSON.stringify(records));
}

function getLeaves() {
  const stored = localStorage.getItem("hr_leaves");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("hr_leaves", JSON.stringify(DEFAULT_LEAVES));
  return DEFAULT_LEAVES;
}

function saveLeaves(leaves) {
  localStorage.setItem("hr_leaves", JSON.stringify(leaves));
}

// ===== Auth =====
function getCurrentUser() {
  const stored = sessionStorage.getItem("hr_user");
  if (stored) return JSON.parse(stored);
  return null;
}

function logout() {
  sessionStorage.removeItem("hr_user");
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
    { name: "Employees", icon: "users", href: "employees.html" },
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
    "Late": "badge-warning",
    "Pending": "badge-warning",
    "Absent": "badge-danger",
    "Rejected": "badge-danger",
    "On Leave": "badge-primary",
  };
  return `<span class="badge ${map[status] || 'badge-primary'}">${status}</span>`;
}