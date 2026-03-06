// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const content = document.getElementById('content');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logout');

// Toggle Sidebar
if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        content.classList.toggle('active');
    });
}

// Login Form Submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (username && password) {
            // In a real app, you would validate credentials with a server
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'registrar'); // Default to registrar for demo
            window.location.href = 'dashboard.html';
        } else {
            alert('Please enter both username and password');
        }
    });
}

// Logout Functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    });
}

// Check Authentication
const protectedPages = ['dashboard.html', 'centers.html', 'departments.html', 'staff.html', 'reports.html'];
const currentPage = window.location.pathname.split('/').pop();

if (protectedPages.includes(currentPage)) {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
    }
}

// Initialize tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});