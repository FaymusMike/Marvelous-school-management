document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        // Generate sidebar based on user role
        sidebar.innerHTML = generateSidebar(currentUser);
    }

    // Update user menu
    updateUserMenu();

    function generateSidebar(user) {
        const isActive = (page) => {
            const currentPage = window.location.pathname.split('/').pop();
            return currentPage === page ? 'active' : '';
        };

        let menuItems = [];

        // Base menu items (visible to all)
        menuItems.push(`
            <li class="${isActive('dashboard.html')}">
                <a href="dashboard.html">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
        `);

        // Role-based menu items
        if (user.role === 'president' || user.role === 'registrar') {
            menuItems.push(`
                <li>
                    <a href="#centersSubmenu" data-bs-toggle="collapse" aria-expanded="false" class="dropdown-toggle">
                        <i class="bi bi-building"></i>
                        <span>Centers</span>
                    </a>
                    <ul class="collapse list-unstyled" id="centersSubmenu">
                        <li>
                            <a href="centers.html">Manage Centers</a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="#departmentsSubmenu" data-bs-toggle="collapse" aria-expanded="false" class="dropdown-toggle">
                        <i class="bi bi-diagram-3"></i>
                        <span>Departments</span>
                    </a>
                    <ul class="collapse list-unstyled" id="departmentsSubmenu">
                        <li>
                            <a href="departments.html">Manage Departments</a>
                        </li>
                    </ul>
                </li>
                <li class="${isActive('staff.html')}">
                    <a href="staff.html">
                        <i class="bi bi-people"></i>
                        <span>Staff Management</span>
                    </a>
                </li>
            `);
        } else if (user.role === 'coordinator') {
            menuItems.push(`
                <li>
                    <a href="center-details.html">
                        <i class="bi bi-building"></i>
                        <span>My Center</span>
                    </a>
                </li>
            `);
        } else if (user.role === 'department_head') {
            menuItems.push(`
                <li>
                    <a href="department-details.html">
                        <i class="bi bi-diagram-3"></i>
                        <span>My Department</span>
                    </a>
                </li>
            `);
        }

        // Reports - visible to all but with different permissions
        menuItems.push(`
            <li class="${isActive('reports.html')}">
                <a href="reports.html">
                    <i class="bi bi-file-earmark-text"></i>
                    <span>Reports</span>
                </a>
            </li>
        `);

        return `
            <div class="sidebar-header">
                <h3>Marvelous School</h3>
                <strong>MS</strong>
            </div>
            <div class="user-info p-3 border-bottom border-secondary">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-circle fs-3 me-2"></i>
                    <div>
                        <div class="fw-bold">${user.name}</div>
                        <small class="text-muted">${user.role.replace('_', ' ')}</small>
                    </div>
                </div>
            </div>
            <ul class="list-unstyled components">
                ${menuItems.join('')}
            </ul>
        `;
    }

    function updateUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (userMenu && currentUser) {
            userMenu.innerHTML = `
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i>
                            <span class="d-none d-lg-inline ms-1">${currentUser.name}</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="#" id="viewProfile">
                                    <i class="bi bi-person"></i> Profile
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" id="settings">
                                    <i class="bi bi-gear"></i> Settings
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" id="logout">
                                    <i class="bi bi-box-arrow-right"></i> Logout
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            `;

            // Add event listeners
            document.getElementById('viewProfile')?.addEventListener('click', showProfile);
            document.getElementById('settings')?.addEventListener('click', showSettings);
            document.getElementById('logout')?.addEventListener('click', logout);
        }
    }

    function showProfile(e) {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        UI.alert(`
            <div class="text-start">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Role:</strong> ${currentUser.role.replace('_', ' ')}</p>
                <p><strong>Login Time:</strong> ${new Date(currentUser.loginTime).toLocaleString()}</p>
                <p><strong>Demo Mode:</strong> ${currentUser.isDemo ? 'Yes' : 'No'}</p>
            </div>
        `, 'User Profile');
    }

    function showSettings(e) {
        e.preventDefault();
        UI.alert('Settings feature coming soon!', 'Settings');
    }

    function logout(e) {
        e.preventDefault();
        UI.confirm('Are you sure you want to logout?').then(confirmed => {
            if (confirmed) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                UI.showToast('Logged out successfully', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
});