document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize
    updateWelcomeMessage();
    loadStatistics();
    loadActivityLog();
    loadQuickActions();
    loadPendingReports();
    initializeCharts();

    // Event listeners
    document.getElementById('refreshActivity')?.addEventListener('click', loadActivityLog);
    document.getElementById('sidebarCollapse')?.addEventListener('click', toggleSidebar);

    // Update welcome message based on user role
    function updateWelcomeMessage() {
        const welcomeEl = document.getElementById('welcomeMessage');
        const roleEl = document.getElementById('roleMessage');
        
        if (welcomeEl && roleEl) {
            const hour = new Date().getHours();
            let greeting = 'Good ';
            if (hour < 12) greeting += 'Morning';
            else if (hour < 17) greeting += 'Afternoon';
            else greeting += 'Evening';
            
            welcomeEl.textContent = `${greeting}, ${currentUser.name}!`;
            
            let roleMessage = '';
            switch(currentUser.role) {
                case 'president':
                    roleMessage = 'You have full access to all system features.';
                    break;
                case 'registrar':
                    roleMessage = 'You can manage centers, departments, and staff.';
                    break;
                case 'coordinator':
                    roleMessage = 'You can view your center and submit reports.';
                    break;
                case 'department_head':
                    roleMessage = 'You can manage your department and submit reports.';
                    break;
                case 'lecturer':
                    roleMessage = 'You can view your assignments and submit reports.';
                    break;
                default:
                    roleMessage = 'Welcome to the dashboard.';
            }
            roleEl.textContent = roleMessage;
        }
    }

    // Load statistics
    function loadStatistics() {
        const stats = DataService.getStatistics();
        const statsContainer = document.getElementById('statsCards');
        
        if (!statsContainer) return;
        
        // Filter stats based on user role
        let visibleStats = [];
        
        switch(currentUser.role) {
            case 'president':
                visibleStats = [
                    { icon: 'people', label: 'Total Staff', value: stats.totalStaff, color: 'primary' },
                    { icon: 'building', label: 'Centers', value: stats.totalCenters, color: 'success' },
                    { icon: 'diagram-3', label: 'Departments', value: stats.totalDepartments, color: 'info' },
                    { icon: 'file-text', label: 'Reports', value: stats.totalReports, color: 'warning' }
                ];
                break;
                
            case 'registrar':
                visibleStats = [
                    { icon: 'people', label: 'Staff', value: stats.totalStaff, color: 'primary' },
                    { icon: 'building', label: 'Centers', value: stats.totalCenters, color: 'success' },
                    { icon: 'diagram-3', label: 'Depts', value: stats.totalDepartments, color: 'info' },
                    { icon: 'clock', label: 'Pending', value: stats.pendingReports, color: 'warning' }
                ];
                break;
                
            case 'coordinator':
                if (currentUser.staffData) {
                    const centerId = currentUser.staffData.centers[0];
                    const center = DataService.getCenterById(centerId);
                    visibleStats = [
                        { icon: 'building', label: 'My Center', value: center?.name || 'N/A', color: 'primary' },
                        { icon: 'people', label: 'Staff', value: '5', color: 'success' },
                        { icon: 'file-text', label: 'Reports', value: '3', color: 'info' },
                        { icon: 'clock', label: 'Pending', value: '1', color: 'warning' }
                    ];
                }
                break;
                
            case 'department_head':
                if (currentUser.staffData) {
                    const deptId = currentUser.staffData.departments[0];
                    const dept = DataService.getDepartmentById(deptId);
                    visibleStats = [
                        { icon: 'diagram-3', label: 'My Dept', value: dept?.name || 'N/A', color: 'primary' },
                        { icon: 'people', label: 'Members', value: '8', color: 'success' },
                        { icon: 'file-text', label: 'Reports', value: '2', color: 'info' },
                        { icon: 'check-circle', label: 'Completed', value: '5', color: 'success' }
                    ];
                }
                break;
                
            case 'lecturer':
                visibleStats = [
                    { icon: 'book', label: 'Courses', value: '3', color: 'primary' },
                    { icon: 'people', label: 'Students', value: '45', color: 'success' },
                    { icon: 'file-text', label: 'Reports', value: '2', color: 'info' },
                    { icon: 'clock', label: 'Due', value: '1', color: 'warning' }
                ];
                break;
                
            default:
                visibleStats = [
                    { icon: 'people', label: 'Staff', value: stats.totalStaff, color: 'primary' },
                    { icon: 'building', label: 'Centers', value: stats.totalCenters, color: 'success' },
                    { icon: 'diagram-3', label: 'Depts', value: stats.totalDepartments, color: 'info' },
                    { icon: 'file-text', label: 'Reports', value: stats.totalReports, color: 'warning' }
                ];
        }
        
        // Generate cards
        statsContainer.innerHTML = visibleStats.map(stat => `
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-${stat.color} h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title">${stat.label}</h6>
                                <h3 class="mb-0">${stat.value}</h3>
                            </div>
                            <i class="bi bi-${stat.icon} fs-1 opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Load activity log
    function loadActivityLog() {
        const logContainer = document.getElementById('activityLog');
        if (!logContainer) return;
        
        UI.showLoading(logContainer);
        
        setTimeout(() => {
            const logs = DataService.getActivityLogs(10);
            
            if (logs.length === 0) {
                logContainer.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-clock-history fs-1"></i>
                        <p class="mt-2">No recent activity</p>
                    </div>
                `;
                return;
            }
            
            logContainer.innerHTML = logs.map(log => `
                <div class="activity-item d-flex align-items-start mb-3 pb-2 border-bottom">
                    <div class="activity-icon me-3">
                        <i class="bi bi-${getActivityIcon(log.action)} fs-4 text-${getActivityColor(log.action)}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <strong>${log.description}</strong>
                            <small class="text-muted">${UI.formatTime(log.timestamp)}</small>
                        </div>
                        <small class="text-muted">
                            <i class="bi bi-person"></i> ${log.user} • 
                            <i class="bi bi-calendar"></i> ${UI.formatDate(log.timestamp)}
                        </small>
                    </div>
                </div>
            `).join('');
            
            UI.hideLoading(logContainer);
        }, 500);
    }

    // Load quick actions based on role
    function loadQuickActions() {
        const actionsContainer = document.getElementById('quickActions');
        if (!actionsContainer) return;
        
        let actions = [];
        
        switch(currentUser.role) {
            case 'president':
            case 'registrar':
                actions = [
                    { icon: 'plus-circle', label: 'Add Staff', action: 'addStaff', url: 'staff.html' },
                    { icon: 'building-add', label: 'Add Center', action: 'addCenter', url: 'centers.html' },
                    { icon: 'diagram-3', label: 'Add Department', action: 'addDept', url: 'departments.html' },
                    { icon: 'file-text', label: 'View Reports', action: 'reports', url: 'reports.html' }
                ];
                break;
                
            case 'coordinator':
            case 'department_head':
            case 'lecturer':
                actions = [
                    { icon: 'file-text', label: 'Submit Report', action: 'submitReport', modal: true },
                    { icon: 'eye', label: 'View Reports', action: 'viewReports', url: 'reports.html' },
                    { icon: 'person', label: 'My Profile', action: 'profile', modal: true }
                ];
                break;
                
            default:
                actions = [
                    { icon: 'person', label: 'My Profile', action: 'profile', modal: true },
                    { icon: 'gear', label: 'Settings', action: 'settings', modal: true }
                ];
        }
        
        actionsContainer.innerHTML = actions.map(action => {
            if (action.modal) {
                return `
                    <button class="btn btn-outline-primary text-start quick-action" data-action="${action.action}">
                        <i class="bi bi-${action.icon} me-2"></i> ${action.label}
                    </button>
                `;
            } else {
                return `
                    <a href="${action.url}" class="btn btn-outline-primary text-start">
                        <i class="bi bi-${action.icon} me-2"></i> ${action.label}
                    </a>
                `;
            }
        }).join('');
        
        // Add event listeners for modal actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                if (action === 'submitReport') {
                    new bootstrap.Modal(document.getElementById('reportModal')).show();
                } else if (action === 'profile') {
                    showProfileModal();
                }
            });
        });
    }

    // Load pending reports
    function loadPendingReports() {
        const reportsContainer = document.getElementById('pendingReportsList');
        if (!reportsContainer) return;
        
        const reports = DataService.getReports({ status: 'pending' }).slice(0, 5);
        
        if (reports.length === 0) {
            reportsContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-check-circle fs-1"></i>
                    <p>No pending reports</p>
                </div>
            `;
            return;
        }
        
        reportsContainer.innerHTML = reports.map(report => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>${report.fromName}</strong>
                    <small class="d-block text-muted">${report.type.replace(/_/g, ' ')}</small>
                </div>
                <small class="text-muted">${UI.formatDate(report.date)}</small>
            </div>
        `).join('');
    }

    // Initialize charts
    function initializeCharts() {
        // Activity Chart
        const activityCtx = document.getElementById('activityChart')?.getContext('2d');
        if (activityCtx) {
            new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Activities',
                        data: [12, 19, 15, 17, 24, 10, 8],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Staff Distribution Chart
        const stats = DataService.getStatistics();
        const staffCtx = document.getElementById('staffChart')?.getContext('2d');
        if (staffCtx) {
            new Chart(staffCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Coordinators', 'Dept Heads', 'Lecturers'],
                    datasets: [{
                        data: [
                            stats.staffByRole.coordinators,
                            stats.staffByRole.departmentHeads,
                            stats.staffByRole.lecturers
                        ],
                        backgroundColor: ['#3498db', '#2ecc71', '#f39c12'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // Helper functions
    function getActivityIcon(action) {
        const icons = {
            'create': 'plus-circle',
            'update': 'pencil',
            'delete': 'trash',
            'view': 'eye'
        };
        return icons[action] || 'info-circle';
    }

    function getActivityColor(action) {
        const colors = {
            'create': 'success',
            'update': 'primary',
            'delete': 'danger',
            'view': 'info'
        };
        return colors[action] || 'secondary';
    }

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
    }

    // Submit report
    document.getElementById('submitReportBtn')?.addEventListener('click', function() {
        const type = document.getElementById('reportType').value;
        const title = document.getElementById('reportTitle').value;
        const content = document.getElementById('reportContent').value;
        
        if (!type || !title || !content) {
            UI.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        const reportData = {
            type: type,
            fromId: currentUser.id,
            fromName: currentUser.name,
            content: `${title}\n\n${content}`,
            status: 'submitted'
        };
        
        const result = DataService.addReport(reportData);
        
        if (result.success) {
            UI.showToast('Report submitted successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
            document.getElementById('reportForm').reset();
            loadPendingReports();
        } else {
            UI.showToast('Error submitting report', 'error');
        }
    });

    // Profile modal (simplified)
    function showProfileModal() {
        UI.alert(`
            <strong>Name:</strong> ${currentUser.name}<br>
            <strong>Role:</strong> ${currentUser.role}<br>
            <strong>Login Time:</strong> ${new Date(currentUser.loginTime).toLocaleString()}<br>
            <strong>Demo Mode:</strong> ${currentUser.isDemo ? 'Yes' : 'No'}
        `, 'User Profile');
    }
});