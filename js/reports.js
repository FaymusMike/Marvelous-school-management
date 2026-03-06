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
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    const applyFilters = document.getElementById('applyFilters');

    // Initialize
    loadReports();
    setupEventListeners();

    function setupEventListeners() {
        // Apply filters
        applyFilters?.addEventListener('click', loadReports);

        // Generate report
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('generateModal')).show();
        });

        // Submit new report
        document.getElementById('submitNewReport')?.addEventListener('click', handleGenerateReport);

        // Export
        document.getElementById('exportReports')?.addEventListener('click', () => {
            UI.exportTableToCSV('reportsTable', 'reports.csv');
        });

        // Print
        document.getElementById('printReports')?.addEventListener('click', () => {
            UI.printTable('reportsTable', 'Reports Report');
        });

        // Update status
        document.getElementById('updateStatusBtn')?.addEventListener('click', handleUpdateStatus);
    }

    function loadReports() {
        // Show loading states
        [lecturerReportsDiv, coordinatorReportsDiv, presidentReportsDiv, reportsTable?.parentElement].forEach(el => {
            if (el) UI.showLoading(el);
        });

        setTimeout(() => {
            // Get filters
            const filters = {
                type: filterType?.value || '',
                status: filterStatus?.value || ''
            };

            if (filterStartDate?.value && filterEndDate?.value) {
                filters.startDate = filterStartDate.value;
                filters.endDate = filterEndDate.value;
            }

            const reports = DataService.getReports(filters);

            // Populate chain of command sections
            populateSection('lecturer_to_coordinator', reports, lecturerReportsDiv);
            populateSection('coordinator_to_registrar', reports, coordinatorReportsDiv);
            populateSection('registrar_to_president', reports, presidentReportsDiv);

            // Populate table
            populateReportsTable(reports);

            // Hide loading
            [lecturerReportsDiv, coordinatorReportsDiv, presidentReportsDiv, reportsTable?.parentElement].forEach(el => {
                if (el) UI.hideLoading(el);
            });
        }, 300);
    }

    function populateSection(type, reports, container) {
        if (!container) return;

        const filteredReports = reports.filter(r => r.type === type).slice(0, 5);

        if (filteredReports.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p class="mt-2">No reports found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredReports.map(report => `
            <div class="report-item mb-3 p-3 border rounded ${getStatusClass(report.status)}">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${report.fromName}</h6>
                    <small class="text-muted">${UI.formatDate(report.date)}</small>
                </div>
                <p class="small text-muted mb-2">${report.content.substring(0, 100)}${report.content.length > 100 ? '...' : ''}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${getStatusBadgeClass(report.status)}">${report.status}</span>
                    <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');

        // Add view buttons
        container.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', () => viewReportDetails(btn.dataset.id));
        });
    }

    function populateReportsTable(reports) {
        if (!reportsTable) return;

        if (reports.length === 0) {
            reportsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="bi bi-file-earmark-text fs-1 text-muted"></i>
                        <p class="mt-2">No reports found</p>
                    </td>
                </tr>
            `;
            return;
        }

        reportsTable.innerHTML = reports.map(report => `
            <tr class="${getStatusClass(report.status)}">
                <td>${UI.formatDate(report.date)}</td>
                <td>${formatReportType(report.type)}</td>
                <td>${report.fromName}</td>
                <td>${report.toId || 'N/A'}</td>
                <td>
                    <span title="${report.content}">
                        ${report.content.substring(0, 50)}${report.content.length > 50 ? '...' : ''}
                    </span>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(report.status)}">${report.status}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${currentUser.role === 'president' || currentUser.role === 'registrar' ? `
                        <button class="btn btn-sm btn-outline-success update-status-btn" data-id="${report.id}">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    ` : ''}
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
    }

    function viewReportDetails(reportId) {
        const reports = DataService.getReports();
        const report = reports.find(r => r.id == reportId);

        if (!report) return;

        const modalBody = document.getElementById('reportDetails');
        modalBody.innerHTML = `
            <div class="mb-3">
                <strong>Type:</strong> ${formatReportType(report.type)}
            </div>
            <div class="mb-3">
                <strong>From:</strong> ${report.fromName}
            </div>
            <div class="mb-3">
                <strong>To:</strong> ${report.toId || 'N/A'}
            </div>
            <div class="mb-3">
                <strong>Date:</strong> ${UI.formatDate(report.date)}
            </div>
            <div class="mb-3">
                <strong>Status:</strong> 
                <span class="badge ${getStatusBadgeClass(report.status)}">${report.status}</span>
            </div>
            <div class="mb-3">
                <strong>Content:</strong>
                <div class="p-3 bg-light rounded mt-2">
                    ${report.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        // Store current report ID for status update
        document.getElementById('updateStatusBtn').dataset.reportId = reportId;
        
        // Show/hide status update button based on permissions
        const updateBtn = document.getElementById('updateStatusBtn');
        if (currentUser.role === 'president' || currentUser.role === 'registrar') {
            updateBtn.style.display = 'block';
        } else {
            updateBtn.style.display = 'none';
        }

        new bootstrap.Modal(document.getElementById('reportModal')).show();
    }

    function showStatusUpdateModal(reportId) {
        const statuses = ['submitted', 'pending', 'reviewed', 'approved'];
        const currentStatus = DataService.getReports().find(r => r.id == reportId)?.status;

        const modalBody = document.getElementById('reportDetails');
        modalBody.innerHTML += `
            <div class="mt-3">
                <label class="form-label">Update Status</label>
                <select class="form-select" id="newStatus">
                    ${statuses.map(s => `
                        <option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>
                    `).join('')}
                </select>
            </div>
        `;

        document.getElementById('updateStatusBtn').dataset.reportId = reportId;
    }

    async function handleUpdateStatus(e) {
        const reportId = e.target.dataset.reportId;
        const newStatus = document.getElementById('newStatus')?.value;

        if (!reportId) return;

        if (newStatus) {
            const result = DataService.updateReportStatus(parseInt(reportId), newStatus);
            if (result.success) {
                UI.showToast('Report status updated', 'success');
                bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
                loadReports();
            }
        } else {
            // Direct update from table button
            const statuses = ['submitted', 'pending', 'reviewed', 'approved'];
            const currentStatus = DataService.getReports().find(r => r.id == reportId)?.status;
            const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
            
            const result = DataService.updateReportStatus(parseInt(reportId), nextStatus);
            if (result.success) {
                UI.showToast(`Status updated to ${nextStatus}`, 'success');
                loadReports();
            }
        }
    }

    async function handleGenerateReport() {
        const type = document.getElementById('newReportType').value;
        const title = document.getElementById('newReportTitle').value;
        const content = document.getElementById('newReportContent').value;

        if (!type || !title || !content) {
            UI.showToast('Please fill in all fields', 'warning');
            return;
        }

        const reportData = {
            type: type,
            fromId: currentUser.id,
            fromName: currentUser.name,
            toId: getRecipientForType(type),
            content: `${title}\n\n${content}`,
            status: 'submitted'
        };

        const result = DataService.addReport(reportData);

        if (result.success) {
            UI.showToast('Report generated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('generateModal')).hide();
            document.getElementById('generateReportForm').reset();
            loadReports();
        } else {
            UI.showToast('Error generating report', 'error');
        }
    }

    // Helper functions
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

    function getRecipientForType(type) {
        const recipients = {
            'lecturer_to_coordinator': 'Coordinator',
            'coordinator_to_registrar': 'Registrar',
            'registrar_to_president': 'President',
            'department_report': 'Registrar'
        };
        return recipients[type] || 'Unknown';
    }

    // Initialize tooltips
    UI.initTooltips();
});