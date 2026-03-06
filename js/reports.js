document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const lecturerReportsDiv = document.getElementById('lecturerCoordinatorReports');
    const coordinatorReportsDiv = document.getElementById('coordinatorRegistrarReports');
    const presidentReportsDiv = document.getElementById('registrarPresidentReports');
    const reportsTable = document.getElementById('reportsTable')?.getElementsByTagName('tbody')[0];

    // Filters
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    const filterFrom = document.getElementById('filterFrom');
    const filterTo = document.getElementById('filterTo');
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    const applyFilters = document.getElementById('applyFilters');
    const resetFilters = document.getElementById('resetFilters');

    // Chart instances
    let reportsChart = null;
    let timelineChart = null;

    // Initialize
    loadFilters();
    loadReports();
    setupEventListeners();
    createDashboard();

    function setupEventListeners() {
        // Apply filters
        applyFilters?.addEventListener('click', loadReports);

        // Reset filters
        resetFilters?.addEventListener('click', resetAllFilters);

        // Generate report
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            loadReportTemplates();
            new bootstrap.Modal(document.getElementById('generateModal')).show();
        });

        // Submit new report
        document.getElementById('submitNewReport')?.addEventListener('click', handleGenerateReport);

        // Export options
        document.getElementById('exportReports')?.addEventListener('click', showExportOptions);
        
        // Print
        document.getElementById('printReports')?.addEventListener('click', () => {
            UI.printTable('reportsTable', 'Reports Report');
        });

        // Update status
        document.getElementById('updateStatusBtn')?.addEventListener('click', handleUpdateStatus);

        // Report type change
        document.getElementById('newReportType')?.addEventListener('change', loadReportTemplates);

        // Date range shortcuts
        document.querySelectorAll('.date-shortcut').forEach(btn => {
            btn.addEventListener('click', applyDateShortcut);
        });

        // Search
        document.getElementById('searchReports')?.addEventListener('input', debounce(function(e) {
            filterReports(e.target.value);
        }, 300));

        // Refresh data
        document.getElementById('refreshReports')?.addEventListener('click', function() {
            UI.showToast('Refreshing reports...', 'info');
            loadReports();
        });

        // Chart type toggle
        document.getElementById('chartType')?.addEventListener('change', updateCharts);

        // Auto-refresh toggle
        document.getElementById('autoRefresh')?.addEventListener('change', toggleAutoRefresh);
    }

    function loadFilters() {
        const staff = DataService.getStaff();
        
        // Populate from filter
        if (filterFrom) {
            filterFrom.innerHTML = '<option value="">All Reporters</option>';
            staff.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                filterFrom.appendChild(option);
            });
        }

        // Populate to filter
        if (filterTo) {
            filterTo.innerHTML = '<option value="">All Recipients</option>';
            ['Coordinator', 'Registrar', 'President'].forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role;
                filterTo.appendChild(option);
            });
        }
    }

    function loadReports() {
        // Show loading states
        showLoadingStates();

        setTimeout(() => {
            // Get filters
            const filters = getFilters();

            // Get reports
            const reports = DataService.getReports(filters);
            
            // Calculate statistics
            const stats = calculateReportStats(reports);

            // Update statistics cards
            updateStatistics(stats);

            // Populate chain of command sections
            populateLecturerReports(reports);
            populateCoordinatorReports(reports);
            populatePresidentReports(reports);

            // Populate table
            populateReportsTable(reports);

            // Update charts
            updateChartsWithData(reports);

            // Hide loading
            hideLoadingStates();

            // Show summary
            UI.showToast(`Loaded ${reports.length} reports`, 'info', 2000);
        }, 300);
    }

    function getFilters() {
        const filters = {};

        if (filterType?.value) filters.type = filterType.value;
        if (filterStatus?.value) filters.status = filterStatus.value;
        if (filterFrom?.value) filters.fromId = parseInt(filterFrom.value);
        if (filterTo?.value) filters.to = filterTo.value;
        
        if (filterStartDate?.value) filters.startDate = filterStartDate.value;
        if (filterEndDate?.value) filters.endDate = filterEndDate.value;

        return filters;
    }

    function resetAllFilters() {
        if (filterType) filterType.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterFrom) filterFrom.value = '';
        if (filterTo) filterTo.value = '';
        if (filterStartDate) filterStartDate.value = '';
        if (filterEndDate) filterEndDate.value = '';
        
        loadReports();
    }

    function calculateReportStats(reports) {
        return {
            total: reports.length,
            submitted: reports.filter(r => r.status === 'submitted').length,
            pending: reports.filter(r => r.status === 'pending').length,
            reviewed: reports.filter(r => r.status === 'reviewed').length,
            approved: reports.filter(r => r.status === 'approved').length,
            
            byType: {
                lecturer_to_coordinator: reports.filter(r => r.type === 'lecturer_to_coordinator').length,
                coordinator_to_registrar: reports.filter(r => r.type === 'coordinator_to_registrar').length,
                registrar_to_president: reports.filter(r => r.type === 'registrar_to_president').length,
                department_report: reports.filter(r => r.type === 'department_report').length
            },
            
            responseTime: calculateAverageResponseTime(reports),
            completionRate: reports.length > 0 ? 
                (reports.filter(r => r.status === 'approved').length / reports.length * 100).toFixed(1) : 0
        };
    }

    function calculateAverageResponseTime(reports) {
        const completed = reports.filter(r => r.completedAt && r.createdAt);
        if (completed.length === 0) return 0;
        
        const totalTime = completed.reduce((sum, r) => {
            const created = new Date(r.createdAt);
            const completed = new Date(r.completedAt);
            return sum + (completed - created);
        }, 0);
        
        return Math.round(totalTime / (completed.length * 3600000)); // Hours
    }

    function updateStatistics(stats) {
        const statsContainer = document.getElementById('reportStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body p-3 text-center">
                            <h4 class="mb-0">${stats.total}</h4>
                            <small>Total Reports</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body p-3 text-center">
                            <h4 class="mb-0">${stats.pending}</h4>
                            <small>Pending</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body p-3 text-center">
                            <h4 class="mb-0">${stats.approved}</h4>
                            <small>Approved</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body p-3 text-center">
                            <h4 class="mb-0">${stats.completionRate}%</h4>
                            <small>Completion Rate</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function populateLecturerReports(reports) {
        if (!lecturerReportsDiv) return;

        const lecturerReports = reports
            .filter(r => r.type === 'lecturer_to_coordinator')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (lecturerReports.length === 0) {
            lecturerReportsDiv.innerHTML = getEmptyStateHTML('No lecturer reports');
            return;
        }

        lecturerReportsDiv.innerHTML = lecturerReports.map(report => `
            <div class="report-item mb-3 p-3 border rounded ${getStatusClass(report.status)}" data-id="${report.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <i class="bi bi-person-badge me-2"></i>${report.fromName}
                        </h6>
                        <small class="text-muted">
                            <i class="bi bi-building me-1"></i>${report.centerName || 'N/A'}
                        </small>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>${UI.formatDate(report.date)}
                    </small>
                </div>
                
                <p class="small mt-2 mb-2">${truncateContent(report.content, 80)}</p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${getStatusBadgeClass(report.status)}">
                        <i class="bi ${getStatusIcon(report.status)} me-1"></i>
                        ${report.status}
                    </span>
                    
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-report-btn" data-id="${report.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${report.status === 'submitted' && currentUser.role === 'coordinator' ? `
                            <button class="btn btn-outline-success review-btn" data-id="${report.id}">
                                <i class="bi bi-check2-circle"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${report.priority === 'high' ? `
                    <span class="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger">
                        High Priority
                    </span>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners
        addReportItemListeners(lecturerReportsDiv);
    }

    function populateCoordinatorReports(reports) {
        if (!coordinatorReportsDiv) return;

        const coordinatorReports = reports
            .filter(r => r.type === 'coordinator_to_registrar')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (coordinatorReports.length === 0) {
            coordinatorReportsDiv.innerHTML = getEmptyStateHTML('No coordinator reports');
            return;
        }

        coordinatorReportsDiv.innerHTML = coordinatorReports.map(report => `
            <div class="report-item mb-3 p-3 border rounded ${getStatusClass(report.status)}" data-id="${report.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <i class="bi bi-person-workspace me-2"></i>${report.fromName}
                        </h6>
                        <small class="text-muted">
                            <i class="bi bi-diagram-3 me-1"></i>${report.centerName || 'All Centers'}
                        </small>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>${UI.formatDate(report.date)}
                    </small>
                </div>
                
                <div class="mt-2 mb-2">
                    <span class="badge bg-light text-dark me-2">
                        <i class="bi bi-file-text me-1"></i>${report.documentCount || 0} docs
                    </span>
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-people me-1"></i>${report.staffMentioned || 0} staff
                    </span>
                </div>
                
                <p class="small mb-2">${truncateContent(report.content, 80)}</p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${getStatusBadgeClass(report.status)}">
                        <i class="bi ${getStatusIcon(report.status)} me-1"></i>
                        ${report.status}
                    </span>
                    
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-report-btn" data-id="${report.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${report.status === 'pending' && currentUser.role === 'registrar' ? `
                            <button class="btn btn-outline-success review-btn" data-id="${report.id}">
                                <i class="bi bi-check2-all"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        addReportItemListeners(coordinatorReportsDiv);
    }

    function populatePresidentReports(reports) {
        if (!presidentReportsDiv) return;

        const presidentReports = reports
            .filter(r => r.type === 'registrar_to_president')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (presidentReports.length === 0) {
            presidentReportsDiv.innerHTML = getEmptyStateHTML('No president reports');
            return;
        }

        presidentReportsDiv.innerHTML = presidentReports.map(report => `
            <div class="report-item mb-3 p-3 border rounded ${getStatusClass(report.status)}" data-id="${report.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <i class="bi bi-person-up me-2"></i>${report.fromName}
                        </h6>
                        <small class="text-muted">Registrar's Office</small>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>${UI.formatDate(report.date)}
                    </small>
                </div>
                
                <p class="small mt-2 mb-2">${truncateContent(report.content, 80)}</p>
                
                ${report.summary ? `
                    <div class="small bg-light p-2 rounded mb-2">
                        <i class="bi bi-quote me-1"></i>${report.summary}
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${getStatusBadgeClass(report.status)}">
                        <i class="bi ${getStatusIcon(report.status)} me-1"></i>
                        ${report.status}
                    </span>
                    
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-report-btn" data-id="${report.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${report.status === 'reviewed' && currentUser.role === 'president' ? `
                            <button class="btn btn-outline-success approve-btn" data-id="${report.id}">
                                <i class="bi bi-check2-circle"></i>
                            </button>
                        ` : ''}
                        ${report.status === 'approved' ? `
                            <button class="btn btn-outline-info archive-btn" data-id="${report.id}">
                                <i class="bi bi-archive"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        addReportItemListeners(presidentReportsDiv);
    }

    function addReportItemListeners(container) {
        container.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewReportDetails(btn.dataset.id);
            });
        });

        container.querySelectorAll('.review-btn, .approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                quickUpdateStatus(btn.dataset.id, btn.classList.contains('approve-btn') ? 'approved' : 'reviewed');
            });
        });

        container.querySelectorAll('.archive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                archiveReport(btn.dataset.id);
            });
        });

        // Make entire item clickable
        container.querySelectorAll('.report-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                if (id) viewReportDetails(id);
            });
            item.style.cursor = 'pointer';
        });
    }

    function populateReportsTable(reports) {
        if (!reportsTable) return;

        if (reports.length === 0) {
            reportsTable.innerHTML = getEmptyTableHTML();
            return;
        }

        reportsTable.innerHTML = reports.map(report => `
            <tr class="${getStatusClass(report.status)}" data-id="${report.id}">
                <td>
                    <input type="checkbox" class="form-check-input report-select" value="${report.id}">
                </td>
                <td>${UI.formatDate(report.date)}</td>
                <td>${formatReportType(report.type)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle me-2"></i>
                        ${report.fromName}
                    </div>
                </td>
                <td>${report.toId || 'N/A'}</td>
                <td>
                    <div class="report-content-preview" title="${escapeHtml(report.content)}">
                        ${truncateContent(report.content, 50)}
                    </div>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(report.status)}">
                        <i class="bi ${getStatusIcon(report.status)} me-1"></i>
                        ${report.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-report-btn" data-id="${report.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${canUpdateStatus(report) ? `
                            <button class="btn btn-outline-success update-status-btn" data-id="${report.id}">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                        ` : ''}
                        ${canDelete(report) ? `
                            <button class="btn btn-outline-danger delete-report-btn" data-id="${report.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', () => viewReportDetails(btn.dataset.id));
        });

        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', () => showStatusUpdateModal(btn.dataset.id));
        });

        document.querySelectorAll('.delete-report-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteReport(btn.dataset.id));
        });

        // Select all functionality
        const selectAll = document.getElementById('selectAllReports');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                document.querySelectorAll('.report-select').forEach(cb => {
                    cb.checked = this.checked;
                });
            });
        }
    }

    function createDashboard() {
        const dashboardDiv = document.createElement('div');
        dashboardDiv.className = 'row mb-4';
        dashboardDiv.id = 'reportDashboard';
        
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            cardBody.insertBefore(dashboardDiv, cardBody.firstChild);
            createCharts();
        }
    }

    function createCharts() {
        const dashboardDiv = document.getElementById('reportDashboard');
        if (!dashboardDiv) return;

        dashboardDiv.innerHTML = `
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Report Timeline</h6>
                        <div>
                            <select class="form-select form-select-sm" id="chartType" style="width: auto;">
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="timelineChart" style="height: 200px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-white">
                        <h6 class="mb-0">Reports by Type</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="reportsChart" style="height: 200px;"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts
        setTimeout(() => {
            initCharts();
        }, 500);
    }

    function initCharts() {
        const reports = DataService.getReports();
        updateChartsWithData(reports);
    }

    function updateChartsWithData(reports) {
        if (!reports || reports.length === 0) return;

        // Timeline data (last 7 days)
        const timelineData = getTimelineData(reports);
        
        // Reports by type
        const typeData = {
            'Lecturer → Coordinator': reports.filter(r => r.type === 'lecturer_to_coordinator').length,
            'Coordinator → Registrar': reports.filter(r => r.type === 'coordinator_to_registrar').length,
            'Registrar → President': reports.filter(r => r.type === 'registrar_to_president').length,
            'Department': reports.filter(r => r.type === 'department_report').length
        };

        // Update timeline chart
        const timelineCtx = document.getElementById('timelineChart')?.getContext('2d');
        if (timelineCtx) {
            if (timelineChart) timelineChart.destroy();
            
            const chartType = document.getElementById('chartType')?.value || 'line';
            
            timelineChart = new Chart(timelineCtx, {
                type: chartType,
                data: {
                    labels: timelineData.labels,
                    datasets: [{
                        label: 'Reports Submitted',
                        data: timelineData.values,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Update pie chart
        const reportsCtx = document.getElementById('reportsChart')?.getContext('2d');
        if (reportsCtx) {
            if (reportsChart) reportsChart.destroy();
            
            reportsChart = new Chart(reportsCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(typeData),
                    datasets: [{
                        data: Object.values(typeData),
                        backgroundColor: [
                            '#3498db',
                            '#f39c12',
                            '#2ecc71',
                            '#9b59b6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function getTimelineData(reports) {
        const labels = [];
        const values = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const count = reports.filter(r => {
                const reportDate = new Date(r.date).toISOString().split('T')[0];
                return reportDate === dateStr;
            }).length;
            
            values.push(count);
        }
        
        return { labels, values };
    }

    function updateCharts() {
        const reports = DataService.getReports();
        updateChartsWithData(reports);
    }

    function viewReportDetails(reportId) {
        const reports = DataService.getReports();
        const report = reports.find(r => r.id == reportId);

        if (!report) return;

        // Get related data
        const staff = DataService.getStaff();
        const centers = DataService.getCenters();
        const departments = DataService.getDepartments();

        const modalBody = document.getElementById('reportDetails');
        modalBody.innerHTML = `
            <div class="container-fluid">
                <div class="row mb-3">
                    <div class="col-12">
                        <h5>${report.title || 'Report Details'}</h5>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="bg-light p-2 rounded">
                            <small class="text-muted d-block">Type</small>
                            <strong>${formatReportType(report.type)}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="bg-light p-2 rounded">
                            <small class="text-muted d-block">Status</small>
                            <span class="badge ${getStatusBadgeClass(report.status)}">
                                <i class="bi ${getStatusIcon(report.status)} me-1"></i>
                                ${report.status}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="bg-light p-2 rounded">
                            <small class="text-muted d-block">From</small>
                            <i class="bi bi-person"></i> ${report.fromName}<br>
                            <small class="text-muted">ID: ${report.fromId}</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="bg-light p-2 rounded">
                            <small class="text-muted d-block">To</small>
                            <i class="bi bi-person-up"></i> ${report.toId || 'N/A'}<br>
                            <small class="text-muted">${report.toRole || ''}</small>
                        </div>
                    </div>
                </div>
                
                ${report.centerId ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted d-block">Center</small>
                                <i class="bi bi-building"></i> ${getCenterName(report.centerId, centers)}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${report.departmentId ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted d-block">Department</small>
                                <i class="bi bi-diagram-3"></i> ${getDepartmentName(report.departmentId, departments)}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="row mb-3">
                    <div class="col-12">
                        <div class="bg-light p-2 rounded">
                            <small class="text-muted d-block">Timeline</small>
                            <div class="row">
                                <div class="col-6">
                                    <small>Created:</small>
                                    <div>${UI.formatDate(report.createdAt)}</div>
                                </div>
                                <div class="col-6">
                                    <small>Last Updated:</small>
                                    <div>${UI.formatDate(report.updatedAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-12">
                        <div class="bg-light p-3 rounded">
                            <small class="text-muted d-block mb-2">Content</small>
                            <div class="report-content" style="white-space: pre-wrap;">${escapeHtml(report.content)}</div>
                        </div>
                    </div>
                </div>
                
                ${report.attachments && report.attachments.length > 0 ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted d-block mb-2">Attachments</small>
                                ${report.attachments.map(att => `
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="bi bi-paperclip me-2"></i>
                                        <a href="#" onclick="downloadAttachment('${att}')">${att}</a>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${report.comments && report.comments.length > 0 ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted d-block mb-2">Comments</small>
                                ${report.comments.map(comment => `
                                    <div class="border-bottom pb-2 mb-2">
                                        <div class="d-flex justify-content-between">
                                            <strong>${comment.user}</strong>
                                            <small class="text-muted">${UI.formatDate(comment.date)}</small>
                                        </div>
                                        <p class="mb-0 small">${comment.text}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Store current report ID for status update
        const updateBtn = document.getElementById('updateStatusBtn');
        updateBtn.dataset.reportId = reportId;
        
        // Show/hide status update button based on permissions
        if (canUpdateStatus(report)) {
            updateBtn.style.display = 'block';
            
            // Add comment section
            const commentDiv = document.createElement('div');
            commentDiv.className = 'mt-3';
            commentDiv.innerHTML = `
                <label class="form-label">Add Comment</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="newComment" placeholder="Enter comment...">
                    <button class="btn btn-outline-primary" type="button" id="addComment">Add</button>
                </div>
            `;
            modalBody.appendChild(commentDiv);
            
            document.getElementById('addComment')?.addEventListener('click', () => {
                const comment = document.getElementById('newComment').value;
                if (comment) {
                    addCommentToReport(reportId, comment);
                }
            });
        } else {
            updateBtn.style.display = 'none';
        }

        new bootstrap.Modal(document.getElementById('reportModal')).show();
    }

    function addCommentToReport(reportId, comment) {
        const reports = DataService.getReports();
        const reportIndex = reports.findIndex(r => r.id == reportId);
        
        if (reportIndex !== -1) {
            if (!reports[reportIndex].comments) {
                reports[reportIndex].comments = [];
            }
            
            reports[reportIndex].comments.push({
                user: currentUser.name,
                date: new Date().toISOString(),
                text: comment
            });
            
            reports[reportIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('reports', JSON.stringify(reports));
            UI.showToast('Comment added', 'success');
            
            // Refresh view
            viewReportDetails(reportId);
        }
    }

    function quickUpdateStatus(reportId, newStatus) {
        const result = DataService.updateReportStatus(parseInt(reportId), newStatus);
        if (result.success) {
            UI.showToast(`Status updated to ${newStatus}`, 'success');
            loadReports();
        }
    }

    function archiveReport(reportId) {
        UI.confirm('Are you sure you want to archive this report?', 'Archive Report')
            .then(confirmed => {
                if (confirmed) {
                    const result = DataService.archiveReport(parseInt(reportId));
                    if (result.success) {
                        UI.showToast('Report archived', 'success');
                        loadReports();
                    }
                }
            });
    }

    function deleteReport(reportId) {
        UI.confirm('Are you sure you want to delete this report? This action cannot be undone.', 'Delete Report')
            .then(confirmed => {
                if (confirmed) {
                    const result = DataService.deleteReport(parseInt(reportId));
                    if (result.success) {
                        UI.showToast('Report deleted', 'success');
                        loadReports();
                    }
                }
            });
    }

    function showStatusUpdateModal(reportId) {
        const report = DataService.getReports().find(r => r.id == reportId);
        if (!report) return;

        const statuses = ['submitted', 'pending', 'reviewed', 'approved'];
        const currentIndex = statuses.indexOf(report.status);

        const modalBody = document.getElementById('reportDetails');
        modalBody.innerHTML = `
            <div class="container-fluid">
                <h6 class="mb-3">Update Report Status</h6>
                
                <div class="mb-3">
                    <label class="form-label">Current Status</label>
                    <div><span class="badge ${getStatusBadgeClass(report.status)}">${report.status}</span></div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Select New Status</label>
                    <select class="form-select" id="newStatus">
                        ${statuses.map((s, index) => `
                            <option value="${s}" ${index === currentIndex ? 'selected' : ''}>${s}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Add Comment (Optional)</label>
                    <textarea class="form-control" id="statusComment" rows="2" placeholder="Enter comment..."></textarea>
                </div>
            </div>
        `;

        document.getElementById('updateStatusBtn').dataset.reportId = reportId;
        document.getElementById('updateStatusBtn').onclick = () => {
            const newStatus = document.getElementById('newStatus').value;
            const comment = document.getElementById('statusComment').value;
            
            if (comment) {
                addCommentToReport(reportId, comment);
            }
            
            handleUpdateStatus({ target: { dataset: { reportId } } }, newStatus);
        };
    }

    async function handleUpdateStatus(e, customStatus) {
        const reportId = e.target.dataset.reportId;
        const newStatus = customStatus || document.getElementById('newStatus')?.value;

        if (!reportId) return;

        if (newStatus) {
            const result = DataService.updateReportStatus(parseInt(reportId), newStatus);
            if (result.success) {
                UI.showToast(`Report status updated to ${newStatus}`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
                loadReports();
            }
        } else {
            // Cycle through statuses
            const statuses = ['submitted', 'pending', 'reviewed', 'approved'];
            const report = DataService.getReports().find(r => r.id == reportId);
            const currentIndex = statuses.indexOf(report.status);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            
            const result = DataService.updateReportStatus(parseInt(reportId), nextStatus);
            if (result.success) {
                UI.showToast(`Status updated to ${nextStatus}`, 'success');
                loadReports();
            }
        }
    }

    function loadReportTemplates() {
        const type = document.getElementById('newReportType').value;
        const templateSelect = document.getElementById('reportTemplate');
        
        if (!templateSelect) return;

        const templates = {
            'lecturer_to_coordinator': [
                'Weekly Lecture Report',
                'Student Performance Report',
                'Resource Request',
                'Classroom Issue Report'
            ],
            'coordinator_to_registrar': [
                'Monthly Center Report',
                'Staff Attendance Summary',
                'Budget Request',
                'Curriculum Progress Report'
            ],
            'registrar_to_president': [
                'Quarterly Academic Report',
                'Annual Performance Review',
                'Strategic Plan Update',
                'Budget Proposal'
            ],
            'department_report': [
                'Department Performance Review',
                'Staff Evaluation Report',
                'Course Assessment Summary',
                'Resource Allocation Report'
            ]
        };

        templateSelect.innerHTML = '<option value="">Select a template...</option>';
        (templates[type] || []).forEach(template => {
            templateSelect.innerHTML += `<option value="${template}">${template}</option>`;
        });
    }

    async function handleGenerateReport() {
        const type = document.getElementById('newReportType').value;
        const title = document.getElementById('newReportTitle').value;
        const template = document.getElementById('reportTemplate')?.value;
        const content = document.getElementById('newReportContent').value;
        const priority = document.getElementById('reportPriority')?.value || 'normal';
        const centerId = document.getElementById('reportCenter')?.value;
        const departmentId = document.getElementById('reportDepartment')?.value;

        if (!type || !title || !content) {
            UI.showToast('Please fill in all required fields', 'warning');
            return;
        }

        // Get recipient based on type
        const recipient = getRecipientForType(type);
        
        // Get center/department info if applicable
        let centerName = null;
        let departmentName = null;
        
        if (centerId) {
            const center = DataService.getCenterById(parseInt(centerId));
            centerName = center ? center.name : null;
        }
        
        if (departmentId) {
            const dept = DataService.getDepartmentById(parseInt(departmentId));
            departmentName = dept ? dept.name : null;
        }

        const reportData = {
            type: type,
            title: title,
            fromId: currentUser.id,
            fromName: currentUser.name,
            fromRole: currentUser.role,
            toId: recipient,
            toRole: recipient,
            content: content,
            template: template,
            priority: priority,
            centerId: centerId ? parseInt(centerId) : null,
            centerName: centerName,
            departmentId: departmentId ? parseInt(departmentId) : null,
            departmentName: departmentName,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };

        const result = DataService.addReport(reportData);

        if (result.success) {
            UI.showToast('Report generated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('generateModal')).hide();
            document.getElementById('generateReportForm').reset();
            loadReports();
            
            // Send notification to recipient
            notifyRecipient(reportData);
        } else {
            UI.showToast('Error generating report', 'error');
        }
    }

    function notifyRecipient(report) {
        // In a real app, this would send an email or notification
        console.log(`Notification sent to ${report.toId}: New report from ${report.fromName}`);
    }

    function showExportOptions() {
        const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
        document.getElementById('exportModalBody').innerHTML = `
            <div class="list-group">
                <button class="list-group-item list-group-item-action" onclick="exportReports('csv')">
                    <i class="bi bi-file-earmark-spreadsheet me-2"></i>
                    Export as CSV
                </button>
                <button class="list-group-item list-group-item-action" onclick="exportReports('json')">
                    <i class="bi bi-file-earmark-code me-2"></i>
                    Export as JSON
                </button>
                <button class="list-group-item list-group-item-action" onclick="exportReports('pdf')">
                    <i class="bi bi-file-earmark-pdf me-2"></i>
                    Export as PDF
                </button>
                <button class="list-group-item list-group-item-action" onclick="exportReports('excel')">
                    <i class="bi bi-file-earmark-excel me-2"></i>
                    Export as Excel
                </button>
            </div>
        `;
        exportModal.show();
    }

    window.exportReports = function(format) {
        const reports = DataService.getReports(getFilters());
        
        switch(format) {
            case 'csv':
                exportToCSV(reports);
                break;
            case 'json':
                exportToJSON(reports);
                break;
            case 'pdf':
                exportToPDF(reports);
                break;
            case 'excel':
                exportToExcel(reports);
                break;
        }
        
        bootstrap.Modal.getInstance(document.getElementById('exportModal')).hide();
        UI.showToast(`Exported as ${format.toUpperCase()}`, 'success');
    };

    function exportToCSV(reports) {
        const headers = ['ID', 'Date', 'Type', 'From', 'To', 'Status', 'Priority'];
        const rows = reports.map(r => [
            r.id,
            r.date,
            formatReportType(r.type),
            r.fromName,
            r.toId,
            r.status,
            r.priority || 'normal'
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        downloadFile(csv, `reports_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    }

    function exportToJSON(reports) {
        const json = JSON.stringify(reports, null, 2);
        downloadFile(json, `reports_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
    }

    function exportToPDF(reports) {
        // In a real app, use a library like jsPDF
        UI.showToast('PDF export requires jsPDF library', 'info');
    }

    function exportToExcel(reports) {
        // In a real app, use a library like SheetJS
        UI.showToast('Excel export requires additional library', 'info');
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function applyDateShortcut(e) {
        const days = parseInt(e.target.dataset.days);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        if (filterStartDate) filterStartDate.value = startDate.toISOString().split('T')[0];
        if (filterEndDate) filterEndDate.value = endDate.toISOString().split('T')[0];
        
        loadReports();
    }

    function filterReports(searchTerm) {
        const filter = searchTerm.toLowerCase();
        const rows = reportsTable?.getElementsByTagName('tr') || [];
        
        Array.from(rows).forEach(row => {
            if (row.cells.length > 1) {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            }
        });
    }

    function toggleAutoRefresh(e) {
        if (e.target.checked) {
            window.autoRefreshInterval = setInterval(loadReports, 30000);
            UI.showToast('Auto-refresh enabled (30s)', 'success');
        } else {
            clearInterval(window.autoRefreshInterval);
            UI.showToast('Auto-refresh disabled', 'info');
        }
    }

    function showLoadingStates() {
        [lecturerReportsDiv, coordinatorReportsDiv, presidentReportsDiv].forEach(el => {
            if (el) UI.showLoading(el);
        });
    }

    function hideLoadingStates() {
        [lecturerReportsDiv, coordinatorReportsDiv, presidentReportsDiv].forEach(el => {
            if (el) UI.hideLoading(el);
        });
    }

    function getEmptyStateHTML(message) {
        return `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox fs-1"></i>
                <p class="mt-2">${message}</p>
            </div>
        `;
    }

    function getEmptyTableHTML() {
        return `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-file-earmark-text fs-1 text-muted"></i>
                    <p class="mt-2">No reports found</p>
                    <p class="text-muted small">Try adjusting your filters or generate a new report</p>
                </td>
            </tr>
        `;
    }

    function truncateContent(content, maxLength) {
        if (!content) return '';
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatReportType(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function getStatusClass(status) {
        const classes = {
            'submitted': 'border-info',
            'pending': 'border-warning',
            'reviewed': 'border-primary',
            'approved': 'border-success'
        };
        return classes[status] || 'border-secondary';
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'submitted': 'bg-info',
            'pending': 'bg-warning',
            'reviewed': 'bg-primary',
            'approved': 'bg-success'
        };
        return classes[status] || 'bg-secondary';
    }

    function getStatusIcon(status) {
        const icons = {
            'submitted': 'bi-send',
            'pending': 'bi-hourglass-split',
            'reviewed': 'bi-eye',
            'approved': 'bi-check-circle'
        };
        return icons[status] || 'bi-file-text';
    }

    function getRecipientForType(type) {
        const recipients = {
            'lecturer_to_coordinator': 'Coordinator',
            'coordinator_to_registrar': 'Registrar',
            'registrar_to_president': 'President',
            'department_report': 'Registrar'
        };
        return recipients[type] || 'Unknown';
    }

    function getCenterName(centerId, centers) {
        const center = centers.find(c => c.id === centerId);
        return center ? center.name : 'Unknown';
    }

    function getDepartmentName(deptId, departments) {
        const dept = departments.find(d => d.id === deptId);
        return dept ? dept.name : 'Unknown';
    }

    function canUpdateStatus(report) {
        const roleHierarchy = {
            'lecturer_to_coordinator': 'coordinator',
            'coordinator_to_registrar': 'registrar',
            'registrar_to_president': 'president',
            'department_report': 'registrar'
        };
        
        const requiredRole = roleHierarchy[report.type];
        return currentUser.role === requiredRole || currentUser.role === 'president';
    }

    function canDelete(report) {
        return currentUser.role === 'president' || 
               (currentUser.role === 'registrar' && report.type !== 'registrar_to_president') ||
               report.fromId === currentUser.id;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});

// Add to DataService
if (typeof DataService !== 'undefined') {
    DataService.getReports = function(filters = {}) {
        let reports = JSON.parse(localStorage.getItem('reports')) || generateSampleReports();
        
        // Apply filters
        if (filters.type) {
            reports = reports.filter(r => r.type === filters.type);
        }
        
        if (filters.status) {
            reports = reports.filter(r => r.status === filters.status);
        }
        
        if (filters.fromId) {
            reports = reports.filter(r => r.fromId === filters.fromId);
        }
        
        if (filters.to) {
            reports = reports.filter(r => r.toId === filters.to);
        }
        
        if (filters.startDate) {
            reports = reports.filter(r => r.date >= filters.startDate);
        }
        
        if (filters.endDate) {
            reports = reports.filter(r => r.date <= filters.endDate);
        }
        
        return reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    DataService.addReport = function(reportData) {
        try {
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const newId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
            
            reportData.id = newId;
            reports.push(reportData);
            
            localStorage.setItem('reports', JSON.stringify(reports));
            return { success: true, id: newId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    DataService.updateReportStatus = function(id, status) {
        try {
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const index = reports.findIndex(r => r.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Report not found' };
            }
            
            reports[index].status = status;
            reports[index].updatedAt = new Date().toISOString();
            
            if (status === 'approved') {
                reports[index].completedAt = new Date().toISOString();
            }
            
            localStorage.setItem('reports', JSON.stringify(reports));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    DataService.archiveReport = function(id) {
        try {
            const reports = JSON.parse(localStorage.getItem('reports')) || [];
            const index = reports.findIndex(r => r.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Report not found' };
            }
            
            reports[index].status = 'archived';
            reports[index].archivedAt = new Date().toISOString();
            
            localStorage.setItem('reports', JSON.stringify(reports));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    DataService.deleteReport = function(id) {
        try {
            let reports = JSON.parse(localStorage.getItem('reports')) || [];
            reports = reports.filter(r => r.id !== id);
            
            localStorage.setItem('reports', JSON.stringify(reports));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    function generateSampleReports() {
        const staff = JSON.parse(localStorage.getItem('staff')) || [];
        const centers = JSON.parse(localStorage.getItem('centers')) || [];
        
        const sampleReports = [
            {
                id: 1,
                type: 'lecturer_to_coordinator',
                title: 'Weekly Lecture Report',
                fromId: staff[0]?.id || 1,
                fromName: staff[0]?.name || 'Dr. Adams',
                toId: 'Coordinator',
                content: 'Completed all scheduled lectures for the week. Student attendance at 85%. Need additional whiteboard markers for Room 101.',
                status: 'approved',
                priority: 'normal',
                centerId: centers[0]?.id || 1,
                centerName: centers[0]?.name || 'Main Campus',
                date: '2024-01-15',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-16T14:30:00Z'
            },
            {
                id: 2,
                type: 'lecturer_to_coordinator',
                title: 'Classroom Equipment Issue',
                fromId: staff[1]?.id || 2,
                fromName: staff[1]?.name || 'Prof. Baker',
                toId: 'Coordinator',
                content: 'Projector in Room 203 is malfunctioning. Request immediate repair before next week\'s presentations.',
                status: 'pending',
                priority: 'high',
                centerId: centers[1]?.id || 2,
                centerName: centers[1]?.name || 'Downtown',
                date: '2024-01-16',
                createdAt: '2024-01-16T09:15:00Z',
                updatedAt: '2024-01-16T09:15:00Z'
            },
            {
                id: 3,
                type: 'coordinator_to_registrar',
                title: 'Monthly Center Performance',
                fromId: staff[2]?.id || 3,
                fromName: staff[2]?.name || 'John Doe',
                toId: 'Registrar',
                content: 'All departments performing well. Student satisfaction score: 4.2/5. Budget utilization at 65%.',
                status: 'reviewed',
                priority: 'normal',
                centerId: centers[0]?.id || 1,
                centerName: centers[0]?.name || 'Main Campus',
                documentCount: 3,
                staffMentioned: 12,
                date: '2024-01-14',
                createdAt: '2024-01-14T11:30:00Z',
                updatedAt: '2024-01-15T16:20:00Z'
            },
            {
                id: 4,
                type: 'coordinator_to_registrar',
                title: 'Resource Request',
                fromId: staff[3]?.id || 4,
                fromName: staff[3]?.name || 'Jane Smith',
                toId: 'Registrar',
                content: 'Requesting additional computers for the lab. Current ratio is 1:5, need to improve to 1:3.',
                status: 'submitted',
                priority: 'high',
                centerId: centers[1]?.id || 2,
                centerName: centers[1]?.name || 'Downtown',
                documentCount: 2,
                date: '2024-01-17',
                createdAt: '2024-01-17T08:45:00Z',
                updatedAt: '2024-01-17T08:45:00Z'
            },
            {
                id: 5,
                type: 'registrar_to_president',
                title: 'Quarterly Academic Report',
                fromId: staff[4]?.id || 5,
                fromName: staff[4]?.name || 'Sarah Williams',
                toId: 'President',
                content: 'Q1 2024 Summary:\n- Total Students: 1250\n- Pass Rate: 92%\n- New Programs: 2\n- Budget Status: On track',
                status: 'approved',
                priority: 'high',
                summary: 'Strong performance across all metrics',
                date: '2024-01-10',
                createdAt: '2024-01-10T14:00:00Z',
                updatedAt: '2024-01-12T09:30:00Z',
                completedAt: '2024-01-12T09:30:00Z'
            },
            {
                id: 6,
                type: 'department_report',
                title: 'Exams Department Review',
                fromId: staff[5]?.id || 6,
                fromName: staff[5]?.name || 'David Brown',
                toId: 'Registrar',
                content: 'End of semester exam process completed successfully. Issues encountered: 2 cases of late submissions.',
                status: 'reviewed',
                priority: 'normal',
                departmentId: 1,
                departmentName: 'Exams and Records',
                date: '2024-01-13',
                createdAt: '2024-01-13T13:20:00Z',
                updatedAt: '2024-01-14T10:15:00Z'
            }
        ];
        
        localStorage.setItem('reports', JSON.stringify(sampleReports));
        return sampleReports;
    }
}