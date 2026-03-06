document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Check permissions (only president and registrar can manage departments)
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
    let currentViewMode = 'all'; // 'all', 'active', 'inactive'
    let currentReportingToFilter = 'all';

    // Only proceed if we're on the departments page
    if (!departmentsTable || !saveDepartmentBtn) return;

    // Initialize the page
    loadDepartments();
    loadDepartmentHeads();
    setupEventListeners();

    function setupEventListeners() {
        // Save button
        saveDepartmentBtn.addEventListener('click', handleSaveDepartment);

        // Modal close
        if (addDepartmentModal) {
            addDepartmentModal.addEventListener('hidden.bs.modal', resetForm);
            addDepartmentModal.addEventListener('show.bs.modal', function() {
                loadDepartmentHeads(); // Refresh department heads when modal opens
            });
        }

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                UI.filterTable('departmentsTable', e.target.value, [1, 2]); // Search in name and head
            });
        }

        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                UI.exportTableToCSV('departmentsTable', 'departments_list.csv');
            });
        }

        // Refresh data
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                UI.showToast('Refreshing departments...', 'info');
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
        document.addEventListener('keydown', function(e) {
            // Ctrl+N for new department
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (!currentEditingId) {
                    resetForm();
                    new bootstrap.Modal(addDepartmentModal).show();
                }
            }
            // Ctrl+F for search focus
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInput?.focus();
            }
            // F5 for refresh
            if (e.key === 'F5') {
                e.preventDefault();
                loadDepartments();
            }
        });
    }

    function loadDepartments() {
        if (!departmentsTable) return;
        
        UI.showLoading(departmentsTable.parentElement, 'Loading departments...');
        
        setTimeout(() => {
            const allDepartments = DataService.getDepartments();
            const staff = DataService.getStaff();
            
            // Apply filters
            let departments = allDepartments;
            
            // Status filter
            if (currentViewMode === 'active') {
                departments = departments.filter(d => d.status === 'Active');
            } else if (currentViewMode === 'inactive') {
                departments = departments.filter(d => d.status === 'Inactive');
            }
            
            // Reporting to filter
            if (currentReportingToFilter !== 'all') {
                departments = departments.filter(d => d.reportingTo === currentReportingToFilter);
            }

            if (departments.length === 0) {
                departmentsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-5">
                            <i class="bi bi-diagram-3 fs-1 text-muted"></i>
                            <p class="mt-3 mb-2">No departments found</p>
                            <p class="text-muted small">${allDepartments.length === 0 ? 'Click "Add New Department" to create your first department.' : 'Try changing your filters.'}</p>
                            ${allDepartments.length === 0 ? `
                                <button class="btn btn-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addDepartmentModal">
                                    <i class="bi bi-plus"></i> Add First Department
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
                UI.hideLoading(departmentsTable.parentElement);
                return;
            }

            departmentsTable.innerHTML = departments.map(dept => {
                const head = staff.find(s => s.id === dept.headId);
                const headName = head ? head.name : 'Unassigned';
                
                // Get department stats
                const deptStaff = staff.filter(s => s.departments && s.departments.includes(dept.id));
                const headCount = deptStaff.filter(s => s.roles.includes('department_head')).length;
                const lecturerCount = deptStaff.filter(s => s.roles.includes('lecturer')).length;

                return `
                    <tr class="department-row" data-id="${dept.id}">
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
                                        <i class="bi bi-mortarboard"></i> ${lecturerCount} Lecturers
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
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add event listeners
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => handleViewDepartment(btn.dataset.id));
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => handleEditDepartment(btn.dataset.id));
            });

            // FIXED: Added missing opening parenthesis and correct arrow function syntax
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => handleDeleteDepartment(btn.dataset.id));
            });

            document.querySelectorAll('.staff-btn').forEach(btn => {
                btn.addEventListener('click', () => handleViewDepartmentStaff(btn.dataset.id));
            });

            // Add double-click to edit on rows
            document.querySelectorAll('.department-row').forEach(row => {
                row.addEventListener('dblclick', function() {
                    const id = this.dataset.id;
                    handleEditDepartment(id);
                });
            });

            UI.hideLoading(departmentsTable.parentElement);
            UI.initTooltips();

            // Update statistics
            updateStatistics(departments, allDepartments.length, staff);
        }, 300);
    }

    function loadDepartmentHeads() {
        if (!departmentHeadSelect) return;
        
        const staff = DataService.getStaff();
        const departmentHeads = staff.filter(s => s.roles.includes('department_head') && s.status === 'Active');
        
        departmentHeadSelect.innerHTML = '<option value="">Select Department Head...</option>';
        
        if (departmentHeads.length === 0) {
            departmentHeadSelect.innerHTML += `
                <option value="" disabled class="text-warning">
                    ⚠️ No department heads available. Add staff with Department Head role first.
                </option>
            `;
            return;
        }

        // Group heads by assignment status
        const assignedHeads = departmentHeads.filter(h => h.departments && h.departments.length > 0);
        const unassignedHeads = departmentHeads.filter(h => !h.departments || h.departments.length === 0);

        // Add unassigned heads first
        if (unassignedHeads.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Available Department Heads';
            unassignedHeads.forEach(head => {
                const option = document.createElement('option');
                option.value = head.id;
                option.textContent = `${head.name} (Available)`;
                optgroup.appendChild(option);
            });
            departmentHeadSelect.appendChild(optgroup);
        }

        // Add assigned heads
        if (assignedHeads.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Currently Assigned';
            assignedHeads.forEach(head => {
                const deptNames = head.departments.map(dId => {
                    const dept = DataService.getDepartmentById(dId);
                    return dept ? dept.name : 'Unknown';
                }).join(', ');
                
                const option = document.createElement('option');
                option.value = head.id;
                option.textContent = `${head.name} (${deptNames})`;
                optgroup.appendChild(option);
            });
            departmentHeadSelect.appendChild(optgroup);
        }
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
                loadDepartmentHeads(); // Refresh department heads list
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

        // Get department head name for validation
        const staff = DataService.getStaff();
        const head = staff.find(s => s.id == departmentHeadId);
        
        if (!head) {
            UI.showToast('Selected department head not found', 'error');
            return;
        }

        // Check if head is already assigned to another department (if creating new or changing head)
        if (!currentEditingId || (currentEditingId && head.departments && head.departments.length > 0)) {
            const otherDepts = head.departments?.filter(dId => dId != currentEditingId) || [];
            if (otherDepts.length > 0) {
                const deptNames = otherDepts.map(dId => {
                    const dept = DataService.getDepartmentById(dId);
                    return dept ? dept.name : 'Unknown';
                }).join(', ');
                
                UI.showToast(`Warning: This head is already assigned to: ${deptNames}`, 'warning');
                // Continue anyway - allow multiple department heads per person
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
            // Preserve existing status if not changing
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
            loadDepartments();
            loadDepartmentHeads(); // Refresh department heads list
        } else {
            UI.showToast(result.error || 'Error saving department', 'error');
        }
    }

    function resetForm() {
        if (addDepartmentForm) addDepartmentForm.reset();
        currentEditingId = null;
        document.getElementById('addDepartmentModalLabel').textContent = 'Add New Department';
    }

    function updateStatistics(departments, totalCount, staff) {
        const statsContainer = document.getElementById('deptStats');
        if (!statsContainer) return;

        const activeCount = departments.filter(d => d.status === 'Active').length;
        const inactiveCount = departments.filter(d => d.status === 'Inactive').length;
        
        // Count departments by reporting structure
        const toRegistrar = departments.filter(d => d.reportingTo === 'registrar').length;
        const toPresident = departments.filter(d => d.reportingTo === 'president').length;
        
        // Staff in departments
        const staffInDepts = staff.filter(s => s.departments && s.departments.length > 0).length;

        statsContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${totalCount}</h5>
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

    // Add search and controls to the page
    const cardBody = document.querySelector('.card-body');
    if (cardBody && !document.getElementById('searchDepartments')) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'row mb-3 align-items-center';
        controlsDiv.innerHTML = `
            <div class="col-md-3">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="searchDepartments" placeholder="Search departments...">
                    <button class="btn btn-outline-secondary" type="button" id="clearSearch" title="Clear search">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="viewToggle">
                    <option value="all">All Departments</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="reportingToFilter">
                    <option value="all">All Reports To</option>
                    <option value="registrar">Registrar</option>
                    <option value="president">President</option>
                </select>
            </div>
            <div class="col-md-5 text-end">
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary" id="refreshDepartments" title="Refresh (F5)">
                        <i class="bi bi-arrow-repeat"></i> Refresh
                    </button>
                    <button class="btn btn-success" id="exportDepartments" title="Export to CSV">
                        <i class="bi bi-download"></i> Export
                    </button>
                    <button class="btn btn-info" id="printDepartments" title="Print">
                        <i class="bi bi-printer"></i> Print
                    </button>
                </div>
            </div>
        `;
        cardBody.insertBefore(controlsDiv, cardBody.querySelector('.table-responsive'));

        // Add stats container
        const statsDiv = document.createElement('div');
        statsDiv.id = 'deptStats';
        statsDiv.className = 'mb-3';
        cardBody.insertBefore(statsDiv, cardBody.querySelector('.table-responsive'));

        // Add clear search functionality
        document.getElementById('clearSearch')?.addEventListener('click', function() {
            document.getElementById('searchDepartments').value = '';
            UI.filterTable('departmentsTable', '');
        });

        // Add print functionality
        document.getElementById('printDepartments')?.addEventListener('click', function() {
            UI.printTable('departmentsTable', 'Departments Report');
        });

        // Add keyboard shortcut hint
        const hintDiv = document.createElement('div');
        hintDiv.className = 'text-end small text-muted mt-2';
        hintDiv.innerHTML = `
            <i class="bi bi-keyboard"></i> 
            <kbd>Ctrl+N</kbd> New • 
            <kbd>Ctrl+F</kbd> Search • 
            <kbd>F5</kbd> Refresh • 
            <kbd>Double-click</kbd> row to edit
        `;
        cardBody.appendChild(hintDiv);
    }
});