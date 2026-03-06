document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Check permissions with enhanced role-based access
    if (!['president', 'registrar'].includes(currentUser.role)) {
        UI.showToast('You do not have permission to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }

    // DOM Elements
    const departmentsTable = document.getElementById('departmentsTable')?.getElementsByTagName('tbody')[0];
    const departmentHeadSelect = document.getElementById('departmentHead');
    const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const addDepartmentModal = document.getElementById('addDepartmentModal');
    const searchInput = document.getElementById('searchDepartments');
    const exportBtn = document.getElementById('exportDepartments');
    const refreshBtn = document.getElementById('refreshDepartments');
    const viewToggle = document.getElementById('viewToggle');
    const reportingToFilter = document.getElementById('reportingToFilter');
    
    let currentEditingId = null;
    let currentViewMode = 'all';
    let currentReportingToFilter = 'all';
    let departments = [];
    let centers = [];

    // Only proceed if we're on the departments page
    if (!departmentsTable || !saveDepartmentBtn) return;

    // Initialize the page
    loadAllData();
    loadDepartments();
    loadDepartmentHeads();
    setupEventListeners();
    addAdvancedFeatures();

    function loadAllData() {
        departments = DataService.getDepartments();
        centers = DataService.getCenters();
    }

    function setupEventListeners() {
        // Save button
        saveDepartmentBtn.addEventListener('click', handleSaveDepartment);

        // Modal close
        if (addDepartmentModal) {
            addDepartmentModal.addEventListener('hidden.bs.modal', resetForm);
            addDepartmentModal.addEventListener('show.bs.modal', function() {
                loadDepartmentHeads();
                loadAssociatedCenters();
            });
        }

        // Search with debounce
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function(e) {
                filterDepartments(e.target.value);
            }, 300));
        }

        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', exportDepartmentsData);
        }

        // Refresh data
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                UI.showToast('Refreshing departments...', 'info');
                loadAllData();
                loadDepartments();
                loadDepartmentHeads();
            });
        }

        // View toggle
        if (viewToggle) {
            viewToggle.addEventListener('change', function(e) {
                currentViewMode = e.target.value;
                loadDepartments();
            });
        }

        // Reporting to filter
        if (reportingToFilter) {
            reportingToFilter.addEventListener('change', function(e) {
                currentReportingToFilter = e.target.value;
                loadDepartments();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Listen for storage events (updates from other tabs)
        window.addEventListener('storage', function(e) {
            if (e.key === 'departments' || e.key === 'staff' || e.key === 'centers') {
                loadAllData();
                loadDepartments();
                loadDepartmentHeads();
            }
        });
    }

    function addAdvancedFeatures() {
        // Add bulk operations
        addBulkOperations();
        
        // Add department hierarchy visualization
        addHierarchyView();
        
        // Add performance metrics
        addPerformanceMetrics();
        
        // Add quick actions menu
        addQuickActions();
    }

    function addBulkOperations() {
        const cardBody = document.querySelector('.card-body');
        if (!cardBody) return;

        const bulkDiv = document.createElement('div');
        bulkDiv.className = 'row mb-3';
        bulkDiv.id = 'bulkOperations';
        bulkDiv.innerHTML = `
            <div class="col-md-12">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="selectAllDepts">
                                    <label class="form-check-label" for="selectAllDepts">Select All Departments</label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="bulkDepartmentAction">
                                    <option value="">Bulk Actions</option>
                                    <option value="activate">Activate Selected</option>
                                    <option value="deactivate">Deactivate Selected</option>
                                    <option value="export">Export Selected</option>
                                    <option value="merge">Merge Selected</option>
                                    <option value="reassign">Reassign Staff</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-sm btn-primary" id="applyBulkDeptAction">
                                    Apply <span id="selectedCount">(0)</span>
                                </button>
                            </div>
                            <div class="col-md-4 text-end">
                                <span class="badge bg-info" id="totalDepartments"></span>
                                <span class="badge bg-success" id="activeDepartments"></span>
                                <span class="badge bg-warning" id="staffInDepts"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        cardBody.insertBefore(bulkDiv, cardBody.querySelector('.table-responsive'));

        // Add event listeners
        document.getElementById('selectAllDepts')?.addEventListener('change', toggleSelectAll);
        document.getElementById('applyBulkDeptAction')?.addEventListener('click', handleBulkAction);
    }

    function addHierarchyView() {
        const cardBody = document.querySelector('.card-body');
        if (!cardBody) return;

        const hierarchyBtn = document.createElement('button');
        hierarchyBtn.className = 'btn btn-sm btn-outline-info mb-3';
        hierarchyBtn.id = 'viewHierarchy';
        hierarchyBtn.innerHTML = '<i class="bi bi-diagram-3"></i> View Department Hierarchy';
        hierarchyBtn.onclick = showDepartmentHierarchy;
        
        cardBody.querySelector('.row.mb-3')?.appendChild(hierarchyBtn);
    }

    function addPerformanceMetrics() {
        // Add performance indicators to each row
        // This will be handled in loadDepartments()
    }

    function addQuickActions() {
        // Add floating action button for quick access
        const fab = document.createElement('div');
        fab.className = 'position-fixed bottom-0 end-0 p-3';
        fab.style.zIndex = '1000';
        fab.innerHTML = `
            <div class="btn-group-vertical">
                <button class="btn btn-primary rounded-circle mb-2" id="quickAdd" 
                        data-bs-toggle="modal" data-bs-target="#addDepartmentModal"
                        title="Quick Add Department (Ctrl+N)">
                    <i class="bi bi-plus-lg"></i>
                </button>
                <button class="btn btn-info rounded-circle mb-2" id="quickExport" 
                        onclick="exportDepartmentsData()"
                        title="Export All">
                    <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-success rounded-circle" id="quickReport" 
                        onclick="generateDepartmentReport()"
                        title="Generate Report">
                    <i class="bi bi-file-text"></i>
                </button>
            </div>
        `;
        document.body.appendChild(fab);
    }

    function handleKeyboardShortcuts(e) {
        // Ctrl+N for new department
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            resetForm();
            new bootstrap.Modal(addDepartmentModal).show();
        }
        // Ctrl+F for search focus
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput?.focus();
        }
        // Ctrl+E for export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportDepartmentsData();
        }
        // F5 for refresh
        if (e.key === 'F5') {
            e.preventDefault();
            loadAllData();
            loadDepartments();
            loadDepartmentHeads();
            UI.showToast('Data refreshed', 'success');
        }
        // Ctrl+H for hierarchy view
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            showDepartmentHierarchy();
        }
    }

    function filterDepartments(searchTerm) {
        const filter = searchTerm.toLowerCase();
        const rows = departmentsTable.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;
            
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });

        // Update visible count
        const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none').length;
        UI.showToast(`${visibleRows} departments visible`, 'info', 1000);
    }

    function toggleSelectAll(e) {
        const isChecked = e.target.checked;
        document.querySelectorAll('.dept-select').forEach(cb => {
            cb.checked = isChecked;
        });
        updateSelectedCount();
    }

    function updateSelectedCount() {
        const count = document.querySelectorAll('.dept-select:checked').length;
        document.getElementById('selectedCount').textContent = `(${count})`;
    }

    async function handleBulkAction() {
        const action = document.getElementById('bulkDepartmentAction').value;
        const selectedIds = Array.from(document.querySelectorAll('.dept-select:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) {
            UI.showToast('No departments selected', 'warning');
            return;
        }

        switch (action) {
            case 'activate':
                await bulkUpdateStatus(selectedIds, 'Active');
                break;
            case 'deactivate':
                await bulkUpdateStatus(selectedIds, 'Inactive');
                break;
            case 'export':
                exportSelectedDepartments(selectedIds);
                break;
            case 'merge':
                await mergeDepartments(selectedIds);
                break;
            case 'reassign':
                await reassignStaff(selectedIds);
                break;
            default:
                UI.showToast('Please select an action', 'warning');
        }
    }

    async function bulkUpdateStatus(ids, status) {
        const confirmed = await UI.confirm(
            `Are you sure you want to ${status === 'Active' ? 'activate' : 'deactivate'} ${ids.length} department(s)?`,
            'Bulk Status Update'
        );

        if (confirmed) {
            let successCount = 0;
            ids.forEach(id => {
                const result = DataService.updateDepartmentStatus(id, status);
                if (result.success) successCount++;
            });

            UI.showToast(`${successCount} department(s) updated successfully`, 'success');
            loadDepartments();
            updateStatistics();
        }
    }

    function exportSelectedDepartments(ids) {
        const selectedDepts = departments.filter(d => ids.includes(d.id));
        const csv = convertToCSV(selectedDepts);
        downloadCSV(csv, `departments_export_${new Date().toISOString().slice(0,10)}.csv`);
        UI.showToast(`Exported ${selectedDepts.length} departments`, 'success');
    }

    async function mergeDepartments(ids) {
        if (ids.length < 2) {
            UI.showToast('Please select at least 2 departments to merge', 'warning');
            return;
        }

        const deptsToMerge = departments.filter(d => ids.includes(d.id));
        const deptNames = deptsToMerge.map(d => d.name).join(', ');

        // Show merge dialog
        const mergeDialog = `
            <div class="text-start">
                <p>Merge the following departments:</p>
                <ul>
                    ${deptsToMerge.map(d => `<li>${d.name} (Head: ${getHeadName(d.headId)})</li>`).join('')}
                </ul>
                <div class="mb-3">
                    <label class="form-label">New Department Name:</label>
                    <input type="text" class="form-control" id="mergedDeptName" 
                           value="${deptsToMerge[0].name} (Merged)">
                </div>
                <div class="mb-3">
                    <label class="form-label">Select New Head:</label>
                    <select class="form-select" id="mergedDeptHead">
                        ${generateHeadOptions(deptsToMerge)}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Reporting To:</label>
                    <select class="form-select" id="mergedDeptReporting">
                        <option value="registrar">Registrar</option>
                        <option value="president">President</option>
                    </select>
                </div>
            </div>
        `;

        const confirmed = await UI.customConfirm(mergeDialog, 'Merge Departments');
        
        if (confirmed) {
            const newName = document.getElementById('mergedDeptName').value;
            const newHeadId = parseInt(document.getElementById('mergedDeptHead').value);
            const newReporting = document.getElementById('mergedDeptReporting').value;

            // Create merged department
            const mergedDept = {
                name: newName,
                headId: newHeadId,
                reportingTo: newReporting,
                status: 'Active',
                mergedFrom: ids,
                mergedAt: new Date().toISOString()
            };

            const result = DataService.mergeDepartments(ids, mergedDept);
            
            if (result.success) {
                UI.showToast('Departments merged successfully', 'success');
                loadAllData();
                loadDepartments();
                loadDepartmentHeads();
            } else {
                UI.showToast(result.error || 'Error merging departments', 'error');
            }
        }
    }

    async function reassignStaff(ids) {
        const staff = DataService.getStaff();
        const deptsToReassign = departments.filter(d => ids.includes(d.id));
        
        // Get all staff in these departments
        const staffInDepts = staff.filter(s => 
            s.departments && s.departments.some(dId => ids.includes(dId))
        );

        if (staffInDepts.length === 0) {
            UI.showToast('No staff to reassign in selected departments', 'info');
            return;
        }

        const targetDepts = departments.filter(d => !ids.includes(d.id));

        const reassignDialog = `
            <div class="text-start">
                <p>Reassign ${staffInDepts.length} staff member(s) from:</p>
                <ul>
                    ${deptsToReassign.map(d => `<li>${d.name}</li>`).join('')}
                </ul>
                <div class="mb-3">
                    <label class="form-label">Target Department:</label>
                    <select class="form-select" id="targetDepartment">
                        <option value="">Select department...</option>
                        ${targetDepts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" class="form-check-input" id="keepRoles">
                    <label class="form-check-label">Keep existing roles</label>
                </div>
            </div>
        `;

        const confirmed = await UI.customConfirm(reassignDialog, 'Reassign Staff');
        
        if (confirmed) {
            const targetDeptId = parseInt(document.getElementById('targetDepartment').value);
            const keepRoles = document.getElementById('keepRoles').checked;

            if (!targetDeptId) {
                UI.showToast('Please select a target department', 'warning');
                return;
            }

            const result = DataService.reassignStaffToDepartment(staffInDepts, targetDeptId, keepRoles);
            
            if (result.success) {
                UI.showToast(`Reassigned ${staffInDepts.length} staff members`, 'success');
                loadDepartments();
            }
        }
    }

    function loadDepartments() {
        if (!departmentsTable) return;
        
        UI.showLoading(departmentsTable.parentElement, 'Loading departments...');
        
        setTimeout(() => {
            loadAllData(); // Refresh data
            const staff = DataService.getStaff();
            
            // Apply filters
            let filteredDepartments = filterDepartmentsData(departments);

            if (filteredDepartments.length === 0) {
                showEmptyState(filteredDepartments);
                UI.hideLoading(departmentsTable.parentElement);
                return;
            }

            departmentsTable.innerHTML = filteredDepartments.map(dept => {
                const head = staff.find(s => s.id === dept.headId);
                const headName = head ? head.name : 'Unassigned';
                
                // Get department metrics
                const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));
                const metrics = calculateDepartmentMetrics(dept, deptStaff);

                return `
                    <tr class="department-row" data-id="${dept.id}">
                        <td>
                            <input type="checkbox" class="form-check-input dept-select" value="${dept.id}">
                        </td>
                        <td>
                            <strong>#${dept.id}</strong>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-diagram-3 text-primary me-2"></i>
                                <div>
                                    <strong>${dept.name}</strong>
                                    <small class="d-block text-muted">
                                        <i class="bi bi-people"></i> ${deptStaff.length} Staff
                                        ${metrics.centersCount > 0 ? ` | <i class="bi bi-building"></i> ${metrics.centersCount} Centers` : ''}
                                    </small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-person-badge text-info me-2"></i>
                                <div>
                                    ${headName}
                                    <small class="d-block text-muted">
                                        <i class="bi bi-mortarboard"></i> ${metrics.lecturerCount} Lecturers
                                        ${metrics.headCount > 1 ? ` | <i class="bi bi-star"></i> ${metrics.headCount} Heads` : ''}
                                    </small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge ${dept.reportingTo === 'registrar' ? 'bg-primary' : 'bg-warning'}">
                                <i class="bi bi-arrow-up"></i> ${dept.reportingTo === 'registrar' ? 'Registrar' : 'President'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${dept.status === 'Active' ? 'bg-success' : 'bg-danger'}">
                                <i class="bi bi-${dept.status === 'Active' ? 'check-circle' : 'x-circle'} me-1"></i>
                                ${dept.status}
                            </span>
                            ${metrics.performance > 0 ? `
                                <small class="d-block text-${getPerformanceColor(metrics.performance)}">
                                    <i class="bi bi-graph-up"></i> ${metrics.performance}% performance
                                </small>
                            ` : ''}
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-outline-primary view-btn" data-id="${dept.id}" title="View Details">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-warning edit-btn" data-id="${dept.id}" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger delete-btn" data-id="${dept.id}" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                                <button class="btn btn-outline-info staff-btn" data-id="${dept.id}" title="View Staff">
                                    <i class="bi bi-people"></i>
                                </button>
                                <button class="btn btn-outline-secondary analytics-btn" data-id="${dept.id}" title="Analytics">
                                    <i class="bi bi-graph-up"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add event listeners
            addTableEventListeners();

            UI.hideLoading(departmentsTable.parentElement);
            UI.initTooltips();

            // Update statistics
            updateStatistics();
            updateSelectedCount();
        }, 300);
    }

    function filterDepartmentsData(depts) {
        let filtered = [...depts];

        // Status filter
        if (currentViewMode === 'active') {
            filtered = filtered.filter(d => d.status === 'Active');
        } else if (currentViewMode === 'inactive') {
            filtered = filtered.filter(d => d.status === 'Inactive');
        }

        // Reporting to filter
        if (currentReportingToFilter !== 'all') {
            filtered = filtered.filter(d => d.reportingTo === currentReportingToFilter);
        }

        return filtered;
    }

    function showEmptyState(filteredDepartments) {
        departmentsTable.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-diagram-3 fs-1 text-muted"></i>
                    <p class="mt-3 mb-2">No departments found</p>
                    <p class="text-muted small">
                        ${departments.length === 0 ? 
                            'Click "Add New Department" to create your first department.' : 
                            'Try changing your filters or <a href="#" onclick="resetFilters()">reset all filters</a>.'}
                    </p>
                    ${departments.length === 0 ? `
                        <button class="btn btn-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addDepartmentModal">
                            <i class="bi bi-plus"></i> Add First Department
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }

    function calculateDepartmentMetrics(dept, deptStaff) {
        return {
            lecturerCount: deptStaff.filter(s => s.roles.includes('lecturer')).length,
            headCount: deptStaff.filter(s => s.roles.includes('department_head')).length,
            centersCount: dept.associatedCenters?.length || 0,
            performance: calculatePerformance(dept, deptStaff)
        };
    }

    function calculatePerformance(dept, deptStaff) {
        // Simple performance metric based on staff ratio and activity
        const activeStaff = deptStaff.filter(s => s.status === 'Active').length;
        const totalStaff = deptStaff.length;
        
        if (totalStaff === 0) return 0;
        
        const staffRatio = (activeStaff / totalStaff) * 100;
        const ageInDays = (new Date() - new Date(dept.createdAt)) / (1000 * 60 * 60 * 24);
        const stabilityFactor = Math.min(100, ageInDays / 30 * 10); // 10% per month, max 100%
        
        return Math.round((staffRatio * 0.6) + (stabilityFactor * 0.4));
    }

    function getPerformanceColor(performance) {
        if (performance >= 80) return 'success';
        if (performance >= 60) return 'info';
        if (performance >= 40) return 'warning';
        return 'danger';
    }

    function addTableEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => handleViewDepartment(btn.dataset.id));
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => handleEditDepartment(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteDepartment(btn.dataset.id));
        });

        document.querySelectorAll('.staff-btn').forEach(btn => {
            btn.addEventListener('click', () => handleViewDepartmentStaff(btn.dataset.id));
        });

        document.querySelectorAll('.analytics-btn').forEach(btn => {
            btn.addEventListener('click', () => showDepartmentAnalytics(btn.dataset.id));
        });

        document.querySelectorAll('.dept-select').forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });

        // Double-click to edit
        document.querySelectorAll('.department-row').forEach(row => {
            row.addEventListener('dblclick', function() {
                const id = this.dataset.id;
                handleEditDepartment(id);
            });
        });
    }

    function showDepartmentAnalytics(deptId) {
        const dept = DataService.getDepartmentById(parseInt(deptId));
        if (!dept) return;

        const staff = DataService.getStaff();
        const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));
        
        // Calculate analytics
        const now = new Date();
        const createdDate = new Date(dept.createdAt);
        const ageInDays = Math.round((now - createdDate) / (1000 * 60 * 60 * 24));
        
        const staffGrowth = calculateStaffGrowth(deptId);
        const activityRate = (deptStaff.filter(s => s.status === 'Active').length / deptStaff.length * 100) || 0;

        const analyticsHtml = `
            <div class="container">
                <h5 class="mb-3">${dept.name} - Analytics</h5>
                
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h3>${ageInDays}</h3>
                                <small>Days Active</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h3>${activityRate.toFixed(1)}%</h3>
                                <small>Activity Rate</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h3>${staffGrowth}</h3>
                                <small>Staff Growth</small>
                            </div>
                        </div>
                    </div>
                </div>

                <h6>Staff Distribution by Role</h6>
                <div class="progress mb-3" style="height: 30px;">
                    <div class="progress-bar bg-info" style="width: ${(deptStaff.filter(s => s.roles.includes('lecturer')).length / deptStaff.length * 100) || 0}%">
                        Lecturers
                    </div>
                    <div class="progress-bar bg-warning" style="width: ${(deptStaff.filter(s => s.roles.includes('department_head')).length / deptStaff.length * 100) || 0}%">
                        Heads
                    </div>
                </div>

                <h6>Monthly Activity</h6>
                <div class="list-group">
                    ${generateMonthlyActivity(deptId)}
                </div>
            </div>
        `;

        UI.alert(analyticsHtml, 'Department Analytics', 'lg');
    }

    function calculateStaffGrowth(deptId) {
        const staff = DataService.getStaff();
        const deptStaff = staff.filter(s => s.departments && s.departments.includes(deptId));
        
        // Simple growth metric based on recent additions
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const recentStaff = deptStaff.filter(s => new Date(s.createdAt) > oneMonthAgo).length;
        return recentStaff;
    }

    function generateMonthlyActivity(deptId) {
        // Sample monthly activity - in real app, would come from actual logs
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map(month => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                ${month} 2024
                <span class="badge bg-primary rounded-pill">${Math.floor(Math.random() * 20)} activities</span>
            </div>
        `).join('');
    }

    function loadDepartmentHeads() {
        if (!departmentHeadSelect) return;
        
        const staff = DataService.getStaff();
        const departmentHeads = staff.filter(s => s.roles.includes('department_head') && s.status === 'Active');
        
        departmentHeadSelect.innerHTML = '<option value="">Select Department Head...</option>';
        
        if (departmentHeads.length === 0) {
            showNoHeadsAvailable();
            return;
        }

        // Group and display heads
        displayHeadsByStatus(departmentHeads);
    }

    function showNoHeadsAvailable() {
        departmentHeadSelect.innerHTML += `
            <option value="" disabled class="text-warning">
                ⚠️ No department heads available. Add staff with Department Head role first.
            </option>
        `;
    }

    function displayHeadsByStatus(heads) {
        const assignedHeads = heads.filter(h => h.departments && h.departments.length > 0);
        const unassignedHeads = heads.filter(h => !h.departments || h.departments.length === 0);

        // Add unassigned heads
        if (unassignedHeads.length > 0) {
            addHeadOptGroup('Available Department Heads', unassignedHeads, false);
        }

        // Add assigned heads
        if (assignedHeads.length > 0) {
            addHeadOptGroup('Currently Assigned', assignedHeads, true);
        }
    }

    function addHeadOptGroup(label, heads, showAssignments) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = label;
        
        heads.forEach(head => {
            const option = document.createElement('option');
            option.value = head.id;
            
            if (showAssignments) {
                const deptNames = head.departments.map(dId => {
                    const dept = DataService.getDepartmentById(dId);
                    return dept ? dept.name : 'Unknown';
                }).join(', ');
                option.textContent = `${head.name} (${deptNames})`;
            } else {
                option.textContent = `${head.name} (Available)`;
            }
            
            optgroup.appendChild(option);
        });
        
        departmentHeadSelect.appendChild(optgroup);
    }

    function loadAssociatedCenters() {
        // Pre-load centers for department-center associations
        centers = DataService.getCenters();
    }

    function generateHeadOptions(depts) {
        const allHeads = depts.flatMap(d => {
            const head = DataService.getStaffById(d.headId);
            return head ? [head] : [];
        });
        
        const uniqueHeads = [...new Map(allHeads.map(h => [h.id, h])).values()];
        
        return uniqueHeads.map(h => 
            `<option value="${h.id}">${h.name}</option>`
        ).join('');
    }

    function getHeadName(headId) {
        const head = DataService.getStaffById(headId);
        return head ? head.name : 'Unknown';
    }

    function convertToCSV(departments) {
        const headers = ['ID', 'Name', 'Head', 'Reporting To', 'Staff Count', 'Status', 'Created'];
        const rows = departments.map(d => {
            const head = DataService.getStaffById(d.headId);
            const staff = DataService.getStaff();
            const staffCount = staff.filter(s => s.departments && s.departments.includes(d.id)).length;
            
            return [
                d.id,
                d.name,
                head ? head.name : 'Unassigned',
                d.reportingTo === 'registrar' ? 'Registrar' : 'President',
                staffCount,
                d.status,
                UI.formatDate(d.createdAt)
            ];
        });

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function handleViewDepartment(deptId) {
        const dept = DataService.getDepartmentById(parseInt(deptId));
        if (!dept) return;

        const staff = DataService.getStaff();
        const head = staff.find(s => s.id === dept.headId);
        const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));
        
        const lecturerCount = deptStaff.filter(s => s.roles.includes('lecturer')).length;
        const headCount = deptStaff.filter(s => s.roles.includes('department_head')).length;
        const staffList = deptStaff.map(s => `• ${s.name} (${s.roles.join(', ')})`).join('\n');

        UI.alert(`
            <div class="text-start">
                <h5 class="mb-3">${dept.name}</h5>
                
                <div class="row mb-3">
                    <div class="col-4">
                        <div class="p-2 bg-light rounded text-center">
                            <h4 class="mb-0">${deptStaff.length}</h4>
                            <small class="text-muted">Total</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 bg-light rounded text-center">
                            <h4 class="mb-0">${lecturerCount}</h4>
                            <small class="text-muted">Lecturers</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 bg-light rounded text-center">
                            <h4 class="mb-0">${headCount}</h4>
                            <small class="text-muted">Heads</small>
                        </div>
                    </div>
                </div>
                
                <table class="table table-sm">
                    <tr>
                        <th>ID:</th>
                        <td>${dept.id}</td>
                    </tr>
                    <tr>
                        <th>Department Head:</th>
                        <td>${head ? head.name : 'Unassigned'}</td>
                    </tr>
                    <tr>
                        <th>Reporting To:</th>
                        <td><span class="badge ${dept.reportingTo === 'registrar' ? 'bg-primary' : 'bg-warning'}">${dept.reportingTo === 'registrar' ? 'Registrar' : 'President'}</span></td>
                    </tr>
                    <tr>
                        <th>Status:</th>
                        <td><span class="badge ${dept.status === 'Active' ? 'bg-success' : 'bg-danger'}">${dept.status}</span></td>
                    </tr>
                    <tr>
                        <th>Created:</th>
                        <td>${UI.formatDate(dept.createdAt)}</td>
                    </tr>
                    <tr>
                        <th>Last Updated:</th>
                        <td>${UI.formatDate(dept.updatedAt)}</td>
                    </tr>
                </table>
                
                ${deptStaff.length > 0 ? `
                    <div class="mt-3">
                        <strong>Staff Members:</strong>
                        <div class="bg-light p-2 rounded mt-1" style="max-height: 150px; overflow-y: auto;">
                            ${staffList.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `, 'Department Details');
    }

    function handleViewDepartmentStaff(deptId) {
        const dept = DataService.getDepartmentById(parseInt(deptId));
        if (!dept) return;

        const staff = DataService.getStaff();
        const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));

        if (deptStaff.length === 0) {
            UI.alert(`No staff members assigned to ${dept.name}`, 'Department Staff');
            return;
        }

        const staffList = deptStaff.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.roles.join(', ')}</td>
                <td>
                    <span class="badge ${s.status === 'Active' ? 'bg-success' : 'bg-danger'}">${s.status}</span>
                </td>
                <td>
                    ${s.centers && s.centers.length > 0 ? 
                        `<span class="badge bg-info">${s.centers.length} Center(s)</span>` : 
                        '<span class="text-muted">None</span>'}
                </td>
            </tr>
        `).join('');

        UI.alert(`
            <h5 class="mb-3">Staff in ${dept.name}</h5>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Centers</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staffList}
                    </tbody>
                </table>
            </div>
        `, 'Department Staff', 'lg');
    }

    function handleEditDepartment(deptId) {
        const dept = DataService.getDepartmentById(parseInt(deptId));
        if (!dept) return;
        
        currentEditingId = dept.id;

        // Fill form
        document.getElementById('departmentName').value = dept.name;
        document.getElementById('reportingTo').value = dept.reportingTo;
        
        // Set department head
        if (dept.headId) {
            document.getElementById('departmentHead').value = dept.headId;
        }

        // Update modal title
        document.getElementById('addDepartmentModalLabel').textContent = 'Edit Department';
        
        // Show modal
        new bootstrap.Modal(addDepartmentModal).show();
    }

    async function handleDeleteDepartment(deptId) {
        const dept = DataService.getDepartmentById(parseInt(deptId));
        if (!dept) return;
        
        // Check if department has staff
        const staff = DataService.getStaff();
        const assignedStaff = staff.some(s => s.departments && s.departments.includes(dept.id));
        
        let warningMessage = `Are you sure you want to delete <strong>${dept.name}</strong>?`;
        if (assignedStaff) {
            warningMessage = `<span class="text-danger">⚠️ This department has staff assigned!</span><br><br>
                ${warningMessage}<br>
                <small class="text-danger">Deleting this department will remove assignments from all staff members.</small>`;
        }
        
        const confirmed = await UI.confirm(warningMessage, 'Delete Department');
        
        if (confirmed) {
            const result = DataService.deleteDepartment(dept.id);
            
            if (result.success) {
                UI.showToast(`Department "${dept.name}" deleted successfully`, 'success');
                loadDepartments();
                loadDepartmentHeads();
            } else {
                UI.showToast(result.error || 'Error deleting department', 'error');
            }
        }
    }

    function handleSaveDepartment() {
        const departmentName = document.getElementById('departmentName').value.trim();
        const departmentHeadId = document.getElementById('departmentHead').value;
        const reportingTo = document.getElementById('reportingTo').value;
        
        // Validation
        if (!DataService.validateRequired(departmentName)) {
            UI.showToast('Please enter department name', 'warning');
            return;
        }
        
        if (!departmentHeadId) {
            UI.showToast('Please select a department head', 'warning');
            return;
        }
        
        if (!reportingTo) {
            UI.showToast('Please select reporting authority', 'warning');
            return;
        }

        // Get department head
        const staff = DataService.getStaff();
        const head = staff.find(s => s.id == departmentHeadId);
        
        if (!head) {
            UI.showToast('Selected department head not found', 'error');
            return;
        }

        // Check if head is already assigned to another department
        if (!currentEditingId || (currentEditingId && head.departments && head.departments.length > 0)) {
            const otherDepts = head.departments?.filter(dId => dId != currentEditingId) || [];
            if (otherDepts.length > 0) {
                const deptNames = otherDepts.map(dId => {
                    const dept = DataService.getDepartmentById(dId);
                    return dept ? dept.name : 'Unknown';
                }).join(', ');
                
                UI.showToast(`Warning: This head is already assigned to: ${deptNames}`, 'warning');
                // Continue anyway
            }
        }

        // Prepare data
        const deptData = {
            name: departmentName,
            headId: parseInt(departmentHeadId),
            reportingTo: reportingTo,
            status: 'Active'
        };

        if (currentEditingId) {
            deptData.id = currentEditingId;
            const existing = DataService.getDepartmentById(currentEditingId);
            if (existing) {
                deptData.status = existing.status;
            }
        }

        // Save
        const result = DataService.saveDepartment(deptData);
        
        if (result.success) {
            UI.showToast(`Department ${currentEditingId ? 'updated' : 'added'} successfully`, 'success');
            
            // Reset and close
            resetForm();
            bootstrap.Modal.getInstance(addDepartmentModal).hide();
            loadAllData();
            loadDepartments();
            loadDepartmentHeads();
        } else {
            UI.showToast(result.error || 'Error saving department', 'error');
        }
    }

    function resetForm() {
        if (addDepartmentForm) addDepartmentForm.reset();
        currentEditingId = null;
        document.getElementById('addDepartmentModalLabel').textContent = 'Add New Department';
    }

    function updateStatistics() {
        const statsContainer = document.getElementById('deptStats');
        if (!statsContainer) return;

        const staff = DataService.getStaff();
        const activeCount = departments.filter(d => d.status === 'Active').length;
        const inactiveCount = departments.filter(d => d.status === 'Inactive').length;
        
        const toRegistrar = departments.filter(d => d.reportingTo === 'registrar').length;
        const toPresident = departments.filter(d => d.reportingTo === 'president').length;
        
        const staffInDepts = staff.filter(s => s.departments && s.departments.length > 0).length;

        // Update badges
        document.getElementById('totalDepartments').textContent = `Total: ${departments.length}`;
        document.getElementById('activeDepartments').textContent = `Active: ${activeCount}`;
        document.getElementById('staffInDepts').textContent = `Staff: ${staffInDepts}`;

        statsContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${departments.length}</h5>
                            <small>Total Depts</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${activeCount}</h5>
                            <small>Active</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${toRegistrar}</h5>
                            <small>To Registrar</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${staffInDepts}</h5>
                            <small>Staff Assigned</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function showDepartmentHierarchy() {
        const staff = DataService.getStaff();
        
        // Build hierarchy tree
        const registrarDepts = departments.filter(d => d.reportingTo === 'registrar');
        const presidentDepts = departments.filter(d => d.reportingTo === 'president');

        const hierarchyHtml = `
            <div class="container">
                <h5 class="mb-3">Department Hierarchy</h5>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                                <i class="bi bi-person"></i> Registrar's Departments
                            </div>
                            <div class="card-body">
                                ${buildHierarchyList(registrarDepts, 'registrar')}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-white">
                                <i class="bi bi-person"></i> President's Departments
                            </div>
                            <div class="card-body">
                                ${buildHierarchyList(presidentDepts, 'president')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        UI.alert(hierarchyHtml, 'Department Hierarchy', 'lg');
    }

    function buildHierarchyList(depts, reportingTo) {
        if (depts.length === 0) {
            return '<p class="text-muted">No departments assigned</p>';
        }

        return depts.map(dept => {
            const head = DataService.getStaffById(dept.headId);
            const staff = DataService.getStaff();
            const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));
            
            return `
                <div class="mb-3 p-2 border rounded">
                    <strong>${dept.name}</strong>
                    <small class="d-block text-muted">
                        Head: ${head ? head.name : 'Unassigned'}
                    </small>
                    <small class="d-block">
                        <i class="bi bi-people"></i> ${deptStaff.length} Staff
                    </small>
                    ${deptStaff.length > 0 ? `
                        <div class="mt-2 ps-3">
                            <small class="text-primary">Staff List:</small>
                            ${deptStaff.slice(0, 3).map(s => `
                                <div class="small">
                                    <i class="bi bi-person"></i> ${s.name}
                                </div>
                            `).join('')}
                            ${deptStaff.length > 3 ? 
                                `<div class="small text-muted">...and ${deptStaff.length - 3} more</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function generateDepartmentReport() {
        const staff = DataService.getStaff();
        
        const reportData = {
            generated: new Date().toISOString(),
            generatedBy: currentUser.name,
            totalDepartments: departments.length,
            activeDepartments: departments.filter(d => d.status === 'Active').length,
            totalStaff: staff.length,
            staffInDepartments: staff.filter(s => s.departments && s.departments.length > 0).length,
            departments: departments.map(d => ({
                name: d.name,
                head: getHeadName(d.headId),
                reportingTo: d.reportingTo,
                staffCount: staff.filter(s => s.departments && s.departments.includes(d.id)).length,
                status: d.status
            }))
        };

        // Create and download report
        const reportStr = JSON.stringify(reportData, null, 2);
        downloadCSV(reportStr, `department_report_${new Date().toISOString().slice(0,10)}.json`);
        
        UI.showToast('Report generated successfully', 'success');
    }

    function exportDepartmentsData() {
        const csv = convertToCSV(departments);
        downloadCSV(csv, `all_departments_${new Date().toISOString().slice(0,10)}.csv`);
        UI.showToast('Departments exported successfully', 'success');
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

    // Make functions globally available for onclick handlers
    window.resetFilters = function() {
        currentViewMode = 'all';
        currentReportingToFilter = 'all';
        if (viewToggle) viewToggle.value = 'all';
        if (reportingToFilter) reportingToFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        loadDepartments();
    };

    window.exportDepartmentsData = exportDepartmentsData;
    window.generateDepartmentReport = generateDepartmentReport;
});

// Add to DataService if not exists
if (typeof DataService !== 'undefined') {
    DataService.updateDepartmentStatus = function(id, status) {
        try {
            const departments = this.getDepartments();
            const index = departments.findIndex(d => d.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Department not found' };
            }
            
            departments[index].status = status;
            departments[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('departments', JSON.stringify(departments));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    DataService.mergeDepartments = function(ids, newDeptData) {
        try {
            const departments = this.getDepartments();
            const staff = this.getStaff();
            
            // Create new department
            const newId = Math.max(...departments.map(d => d.id)) + 1;
            const newDepartment = {
                id: newId,
                ...newDeptData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                mergedFrom: ids
            };
            
            // Update staff assignments
            const updatedStaff = staff.map(s => {
                if (s.departments && s.departments.some(dId => ids.includes(dId))) {
                    return {
                        ...s,
                        departments: [...(s.departments || []), newId]
                    };
                }
                return s;
            });
            
            // Remove old departments
            const remainingDepartments = departments.filter(d => !ids.includes(d.id));
            remainingDepartments.push(newDepartment);
            
            localStorage.setItem('departments', JSON.stringify(remainingDepartments));
            localStorage.setItem('staff', JSON.stringify(updatedStaff));
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    DataService.reassignStaffToDepartment = function(staffList, targetDeptId, keepRoles) {
        try {
            const staff = this.getStaff();
            
            const updatedStaff = staff.map(s => {
                if (staffList.some(selected => selected.id === s.id)) {
                    return {
                        ...s,
                        departments: [targetDeptId]
                    };
                }
                return s;
            });
            
            localStorage.setItem('staff', JSON.stringify(updatedStaff));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
}