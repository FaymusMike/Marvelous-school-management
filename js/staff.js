document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Check permissions with more detailed role-based access
    if (!['president', 'registrar'].includes(currentUser.role)) {
        UI.showToast('You do not have permission to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }

    // DOM Elements
    const staffTable = document.getElementById('staffTable')?.getElementsByTagName('tbody')[0];
    const saveStaffBtn = document.getElementById('saveStaffBtn');
    const addStaffForm = document.getElementById('addStaffForm');
    const addStaffModal = document.getElementById('addStaffModal');
    const searchInput = document.getElementById('searchStaff');
    const exportBtn = document.getElementById('exportStaff');
    
    let currentEditingId = null;
    let currentFilter = {
        role: 'all',
        status: 'all',
        center: 'all',
        department: 'all'
    };

    // Only proceed if we're on the staff page
    if (!staffTable || !saveStaffBtn) return;

    // Load initial data
    let centers = DataService.getCenters();
    let departments = DataService.getDepartments();

    // Initialize the page
    populateStaffTable();
    setupEventListeners();
    populateAssignmentDropdowns();
    addEnhancedFeatures();
    setupRoleBasedUI();

    function setupEventListeners() {
        // Role checkboxes
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateAssignmentVisibility();
                validateRoleCombinations();
            });
        });

        // Save button
        saveStaffBtn.addEventListener('click', handleSaveStaff);

        // Modal close
        if (addStaffModal) {
            addStaffModal.addEventListener('hidden.bs.modal', resetForm);
        }

        // Search functionality with debounce
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function(e) {
                filterStaffTable(e.target.value);
            }, 300));
        }

        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', exportStaffData);
        }

        // Filter dropdowns
        const filterRole = document.getElementById('filterRole');
        const filterStatus = document.getElementById('filterStatus');
        const filterCenter = document.getElementById('filterCenter');
        const filterDept = document.getElementById('filterDepartment');

        if (filterRole) filterRole.addEventListener('change', applyFilters);
        if (filterStatus) filterStatus.addEventListener('change', applyFilters);
        if (filterCenter) filterCenter.addEventListener('change', applyFilters);
        if (filterDept) filterDept.addEventListener('change', applyFilters);

        // Bulk actions
        const bulkActionSelect = document.getElementById('bulkAction');
        const applyBulkBtn = document.getElementById('applyBulkAction');
        
        if (applyBulkBtn && bulkActionSelect) {
            applyBulkBtn.addEventListener('click', () => handleBulkAction(bulkActionSelect.value));
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                document.querySelectorAll('.staff-select').forEach(cb => {
                    cb.checked = this.checked;
                });
                updateBulkActionButton();
            });
        }

        // Listen for storage events (updates from other tabs)
        window.addEventListener('storage', function(e) {
            if (e.key === 'staff' || e.key === 'centers' || e.key === 'departments') {
                centers = DataService.getCenters();
                departments = DataService.getDepartments();
                populateStaffTable();
                populateFilterDropdowns();
            }
        });
    }

    function addEnhancedFeatures() {
        const cardBody = document.querySelector('.card-body');
        if (!cardBody) return;

        // Add filter bar
        const filterBar = document.createElement('div');
        filterBar.className = 'row mb-3';
        filterBar.innerHTML = `
            <div class="col-md-12">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <small class="text-muted">Filter by:</small>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select form-select-sm" id="filterRole">
                                    <option value="all">All Roles</option>
                                    <option value="lecturer">Lecturer</option>
                                    <option value="coordinator">Coordinator</option>
                                    <option value="department_head">Department Head</option>
                                    <option value="registrar">Registrar</option>
                                    <option value="president">President</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select form-select-sm" id="filterStatus">
                                    <option value="all">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="filterCenter">
                                    <option value="all">All Centers</option>
                                    ${centers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="filterDepartment">
                                    <option value="all">All Departments</option>
                                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add bulk actions
        const bulkActions = document.createElement('div');
        bulkActions.className = 'row mb-3';
        bulkActions.innerHTML = `
            <div class="col-md-12">
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <input type="checkbox" id="selectAll" class="form-check-input">
                        <label for="selectAll" class="form-check-label small">Select All</label>
                    </div>
                    <div class="me-2">
                        <select class="form-select form-select-sm" id="bulkAction" style="width: auto;">
                            <option value="">Bulk Actions</option>
                            <option value="activate">Activate Selected</option>
                            <option value="deactivate">Deactivate Selected</option>
                            <option value="export">Export Selected</option>
                            <option value="delete">Delete Selected</option>
                        </select>
                    </div>
                    <button class="btn btn-sm btn-primary" id="applyBulkAction">Apply</button>
                </div>
            </div>
        `;

        // Insert after search bar
        const searchBar = cardBody.querySelector('.row.mb-3');
        if (searchBar) {
            searchBar.insertAdjacentElement('afterend', filterBar);
            filterBar.insertAdjacentElement('afterend', bulkActions);
        }

        // Add summary stats
        addSummaryStats();
    }

    function addSummaryStats() {
        const cardBody = document.querySelector('.card-body');
        if (!cardBody) return;

        const statsDiv = document.createElement('div');
        statsDiv.className = 'row mb-3';
        statsDiv.id = 'staffStats';
        
        cardBody.insertBefore(statsDiv, cardBody.querySelector('.table-responsive'));
        updateSummaryStats();
    }

    function updateSummaryStats() {
        const staff = DataService.getStaff();
        const statsDiv = document.getElementById('staffStats');
        if (!statsDiv) return;

        const totalStaff = staff.length;
        const activeStaff = staff.filter(s => s.status === 'Active').length;
        const byRole = {
            lecturer: staff.filter(s => s.roles.includes('lecturer')).length,
            coordinator: staff.filter(s => s.roles.includes('coordinator')).length,
            department_head: staff.filter(s => s.roles.includes('department_head')).length,
            registrar: staff.filter(s => s.roles.includes('registrar')).length,
            president: staff.filter(s => s.roles.includes('president')).length
        };

        statsDiv.innerHTML = `
            <div class="col-md-2">
                <div class="card bg-primary text-white">
                    <div class="card-body py-2">
                        <small>Total Staff</small>
                        <h5 class="mb-0">${totalStaff}</h5>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-success text-white">
                    <div class="card-body py-2">
                        <small>Active</small>
                        <h5 class="mb-0">${activeStaff}</h5>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-info text-white">
                    <div class="card-body py-2">
                        <small>Lecturers</small>
                        <h5 class="mb-0">${byRole.lecturer}</h5>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-warning text-white">
                    <div class="card-body py-2">
                        <small>Coordinators</small>
                        <h5 class="mb-0">${byRole.coordinator}</h5>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-secondary text-white">
                    <div class="card-body py-2">
                        <small>Dept Heads</small>
                        <h5 class="mb-0">${byRole.department_head}</h5>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-danger text-white">
                    <div class="card-body py-2">
                        <small>Admin</small>
                        <h5 class="mb-0">${byRole.registrar + byRole.president}</h5>
                    </div>
                </div>
            </div>
        `;
    }

    function setupRoleBasedUI() {
        // Hide certain UI elements based on user role
        if (currentUser.role === 'registrar') {
            // Registrars cannot manage presidents
            const presidentCheckbox = document.getElementById('rolePresident');
            if (presidentCheckbox) {
                presidentCheckbox.disabled = true;
                presidentCheckbox.title = 'Only President can assign this role';
            }
        }
    }

    function validateRoleCombinations() {
        const selectedRoles = Array.from(document.querySelectorAll('#addStaffModal .form-check-input:checked'))
            .map(cb => cb.value);

        // Check for incompatible role combinations
        if (selectedRoles.includes('president') && selectedRoles.includes('registrar')) {
            UI.showToast('President cannot also be Registrar', 'warning');
            document.getElementById('roleRegistrar').checked = false;
        }

        if (selectedRoles.includes('president') && selectedRoles.includes('coordinator')) {
            UI.showToast('President cannot also be Coordinator', 'warning');
            document.getElementById('roleCoordinator').checked = false;
        }
    }

    function populateStaffTable() {
        if (!staffTable) return;
        
        UI.showLoading(staffTable.parentElement);
        
        setTimeout(() => {
            const staff = DataService.getStaff();
            
            if (staff.length === 0) {
                staffTable.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <i class="bi bi-people fs-1 text-muted"></i>
                            <p class="mt-2">No staff members found</p>
                            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addStaffModal">
                                <i class="bi bi-plus"></i> Add First Staff
                            </button>
                        </td>
                    </tr>
                `;
                UI.hideLoading(staffTable.parentElement);
                return;
            }

            // Apply filters
            const filteredStaff = applyFilterToData(staff);

            staffTable.innerHTML = filteredStaff.map(member => {
                const assignedCenters = getAssignedNames(member.centers, centers);
                const assignedDepartments = getAssignedNames(member.departments, departments);

                return `
                    <tr>
                        <td>
                            <input type="checkbox" class="form-check-input staff-select" value="${member.id}">
                        </td>
                        <td>${member.id}</td>
                        <td>
                            <strong>${member.name}</strong>
                            <small class="d-block text-muted">${member.email}</small>
                        </td>
                        <td>${formatRoles(member.roles)}</td>
                        <td>${member.phone}</td>
                        <td>
                            ${assignedCenters ? `<span class="badge bg-info me-1" title="Centers">${truncateText(assignedCenters, 20)}</span>` : ''}
                            ${assignedDepartments ? `<span class="badge bg-secondary" title="Departments">${truncateText(assignedDepartments, 20)}</span>` : ''}
                        </td>
                        <td>
                            <span class="badge ${member.status === 'Active' ? 'bg-success' : 'bg-danger'}">
                                ${member.status}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary edit-btn" data-id="${member.id}" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-info view-btn" data-id="${member.id}" title="View">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-warning toggle-status-btn" data-id="${member.id}" title="Toggle Status">
                                    <i class="bi bi-arrow-repeat"></i>
                                </button>
                                <button class="btn btn-outline-danger delete-btn" data-id="${member.id}" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add event listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', handleEditStaff);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', handleDeleteStaff);
            });

            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', handleViewStaff);
            });

            document.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', handleToggleStatus);
            });

            document.querySelectorAll('.staff-select').forEach(cb => {
                cb.addEventListener('change', updateBulkActionButton);
            });

            UI.hideLoading(staffTable.parentElement);
            UI.initTooltips();
            updateSummaryStats();
        }, 300);
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substr(0, maxLength) + '...' : text;
    }

    function applyFilterToData(staff) {
        return staff.filter(member => {
            // Role filter
            if (currentFilter.role !== 'all' && !member.roles.includes(currentFilter.role)) {
                return false;
            }

            // Status filter
            if (currentFilter.status !== 'all' && member.status !== currentFilter.status) {
                return false;
            }

            // Center filter
            if (currentFilter.center !== 'all' && (!member.centers || !member.centers.includes(parseInt(currentFilter.center)))) {
                return false;
            }

            // Department filter
            if (currentFilter.department !== 'all' && (!member.departments || !member.departments.includes(parseInt(currentFilter.department)))) {
                return false;
            }

            return true;
        });
    }

    function applyFilters() {
        const filterRole = document.getElementById('filterRole');
        const filterStatus = document.getElementById('filterStatus');
        const filterCenter = document.getElementById('filterCenter');
        const filterDept = document.getElementById('filterDepartment');

        currentFilter = {
            role: filterRole?.value || 'all',
            status: filterStatus?.value || 'all',
            center: filterCenter?.value || 'all',
            department: filterDept?.value || 'all'
        };

        populateStaffTable();
    }

    function populateFilterDropdowns() {
        const filterCenter = document.getElementById('filterCenter');
        const filterDept = document.getElementById('filterDepartment');

        if (filterCenter) {
            filterCenter.innerHTML = `
                <option value="all">All Centers</option>
                ${centers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            `;
        }

        if (filterDept) {
            filterDept.innerHTML = `
                <option value="all">All Departments</option>
                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            `;
        }
    }

    function filterStaffTable(searchTerm) {
        const filter = searchTerm.toLowerCase();
        const rows = staffTable.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            if (row.cells.length === 1 && row.cells[0].colSpan > 1) return; // Skip empty state row
            
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    }

    function updateBulkActionButton() {
        const selectedCount = document.querySelectorAll('.staff-select:checked').length;
        const applyBtn = document.getElementById('applyBulkAction');
        if (applyBtn) {
            applyBtn.textContent = `Apply (${selectedCount} selected)`;
            applyBtn.disabled = selectedCount === 0;
        }
    }

    async function handleBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('.staff-select:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) {
            UI.showToast('No staff members selected', 'warning');
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
                exportSelectedStaff(selectedIds);
                break;
            case 'delete':
                await bulkDeleteStaff(selectedIds);
                break;
            default:
                UI.showToast('Please select an action', 'warning');
        }
    }

    async function bulkUpdateStatus(ids, status) {
        const confirmed = await UI.confirm(
            `Are you sure you want to ${status === 'Active' ? 'activate' : 'deactivate'} ${ids.length} staff member(s)?`,
            'Bulk Status Update'
        );

        if (confirmed) {
            let successCount = 0;
            ids.forEach(id => {
                const result = DataService.updateStaffStatus(id, status);
                if (result.success) successCount++;
            });

            UI.showToast(`${successCount} staff members updated successfully`, 'success');
            populateStaffTable();
        }
    }

    async function bulkDeleteStaff(ids) {
        const confirmed = await UI.confirm(
            `Are you sure you want to delete ${ids.length} staff member(s)? This action cannot be undone.`,
            'Bulk Delete Confirmation'
        );

        if (confirmed) {
            let successCount = 0;
            ids.forEach(id => {
                const result = DataService.deleteStaff(id);
                if (result.success) successCount++;
            });

            UI.showToast(`${successCount} staff members deleted successfully`, 'success');
            populateStaffTable();
        }
    }

    function exportSelectedStaff(ids) {
        const staff = DataService.getStaff();
        const selectedStaff = staff.filter(s => ids.includes(s.id));
        
        const csv = convertToCSV(selectedStaff);
        downloadCSV(csv, 'selected_staff.csv');
        
        UI.showToast(`Exported ${selectedStaff.length} staff members`, 'success');
    }

    function exportStaffData() {
        const staff = DataService.getStaff();
        const csv = convertToCSV(staff);
        downloadCSV(csv, 'all_staff.csv');
        
        UI.showToast('Staff data exported successfully', 'success');
    }

    function convertToCSV(staff) {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Roles', 'Centers', 'Departments', 'Status', 'Created'];
        const rows = staff.map(s => [
            s.id,
            s.name,
            s.email,
            s.phone,
            s.roles.join('; '),
            getAssignedNames(s.centers, centers),
            getAssignedNames(s.departments, departments),
            s.status,
            UI.formatDate(s.createdAt)
        ]);

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

    async function handleToggleStatus(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = DataService.getStaffById(id);
        
        if (!member) return;
        
        const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
        const confirmed = await UI.confirm(
            `Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} ${member.name}?`,
            'Toggle Status'
        );

        if (confirmed) {
            const result = DataService.updateStaffStatus(id, newStatus);
            if (result.success) {
                UI.showToast(`Staff member ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`, 'success');
                populateStaffTable();
            }
        }
    }

    function handleViewStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = DataService.getStaffById(id);
        
        if (!member) return;
        
        const assignedCenters = getAssignedNames(member.centers, centers);
        const assignedDepartments = getAssignedNames(member.departments, departments);

        // Get additional metrics
        const centersManaged = member.centers?.length || 0;
        const departmentsManaged = member.departments?.length || 0;
        
        UI.alert(`
            <div class="text-start">
                <div class="text-center mb-3">
                    <i class="bi bi-person-circle fs-1"></i>
                    <h5 class="mt-2">${member.name}</h5>
                </div>
                
                <table class="table table-sm">
                    <tr>
                        <th>ID:</th>
                        <td>${member.id}</td>
                    </tr>
                    <tr>
                        <th>Email:</th>
                        <td>${member.email}</td>
                    </tr>
                    <tr>
                        <th>Phone:</th>
                        <td>${member.phone}</td>
                    </tr>
                    <tr>
                        <th>Roles:</th>
                        <td>${formatRoles(member.roles)}</td>
                    </tr>
                    <tr>
                        <th>Centers:</th>
                        <td>${assignedCenters || 'None'} (${centersManaged} total)</td>
                    </tr>
                    <tr>
                        <th>Departments:</th>
                        <td>${assignedDepartments || 'None'} (${departmentsManaged} total)</td>
                    </tr>
                    <tr>
                        <th>Status:</th>
                        <td><span class="badge ${member.status === 'Active' ? 'bg-success' : 'bg-danger'}">${member.status}</span></td>
                    </tr>
                    <tr>
                        <th>Created:</th>
                        <td>${UI.formatDate(member.createdAt)}</td>
                    </tr>
                    <tr>
                        <th>Last Updated:</th>
                        <td>${UI.formatDate(member.updatedAt)}</td>
                    </tr>
                </table>
            </div>
        `, 'Staff Details', 'lg');
    }

    function handleEditStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = DataService.getStaffById(id);
        if (!member) return;
        
        currentEditingId = id;

        // Fill form
        document.getElementById('staffName').value = member.name;
        document.getElementById('staffEmail').value = member.email;
        document.getElementById('staffPhone').value = member.phone;
        
        // Set roles
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(cb => {
            cb.checked = member.roles.includes(cb.value);
        });

        // Update visibility and set selections
        updateAssignmentVisibility();
        
        if (member.centers && member.centers.length > 0) {
            const centersSelect = document.getElementById('assignedCenters');
            Array.from(centersSelect.options).forEach(opt => {
                opt.selected = member.centers.includes(parseInt(opt.value));
            });
        }
        
        if (member.departments && member.departments.length > 0) {
            const deptsSelect = document.getElementById('assignedDepartments');
            Array.from(deptsSelect.options).forEach(opt => {
                opt.selected = member.departments.includes(parseInt(opt.value));
            });
        }

        // Update modal title
        document.getElementById('addStaffModalLabel').textContent = 'Edit Staff Member';
        
        // Show modal
        new bootstrap.Modal(addStaffModal).show();
    }

    async function handleDeleteStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = DataService.getStaffById(id);
        
        if (!member) return;
        
        // Check if staff has dependencies
        const hasDependencies = (member.centers && member.centers.length > 0) || 
                               (member.departments && member.departments.length > 0);
        
        let message = `Are you sure you want to delete <strong>${member.name}</strong>?`;
        if (hasDependencies) {
            message = `<strong>Warning:</strong> This staff member is assigned to centers/departments. Deleting them will remove these assignments. Continue?`;
        }
        
        const confirmed = await UI.confirm(message, 'Delete Staff Member');
        
        if (confirmed) {
            const result = DataService.deleteStaff(id);
            
            if (result.success) {
                UI.showToast('Staff member deleted successfully', 'success');
                populateStaffTable();
                UI.showToast('Staff list updated', 'success');
            } else {
                UI.showToast(result.error || 'Error deleting staff member', 'error');
            }
        }
    }

    function handleSaveStaff() {
        const staffName = document.getElementById('staffName').value.trim();
        const staffEmail = document.getElementById('staffEmail').value.trim();
        const staffPhone = document.getElementById('staffPhone').value.trim();
        
        // Validation
        if (!DataService.validateRequired(staffName)) {
            UI.showToast('Please enter staff name', 'warning');
            return;
        }
        
        if (!DataService.validateEmail(staffEmail)) {
            UI.showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        if (!DataService.validatePhone(staffPhone)) {
            UI.showToast('Please enter a valid phone number', 'warning');
            return;
        }
        
        // Get selected roles
        const roles = Array.from(document.querySelectorAll('#addStaffModal .form-check-input:checked'))
            .map(cb => cb.value);
        
        if (roles.length === 0) {
            UI.showToast('Please select at least one role', 'warning');
            return;
        }

        // Get assignments
        const assignedCenters = document.getElementById('assignedCenters') ? 
            Array.from(document.getElementById('assignedCenters').selectedOptions).map(opt => parseInt(opt.value)) : [];
        
        const assignedDepartments = document.getElementById('assignedDepartments') ? 
            Array.from(document.getElementById('assignedDepartments').selectedOptions).map(opt => parseInt(opt.value)) : [];
        
        // Validate assignments based on roles
        if ((roles.includes('coordinator') || roles.includes('lecturer')) && assignedCenters.length === 0) {
            UI.showToast('Please assign at least one center for coordinator/lecturer roles', 'warning');
            return;
        }
        
        if ((roles.includes('department_head') || roles.includes('lecturer')) && assignedDepartments.length === 0) {
            UI.showToast('Please assign at least one department for department head/lecturer roles', 'warning');
            return;
        }

        // Check for duplicate email
        const existingStaff = DataService.getStaff();
        const duplicateEmail = existingStaff.find(s => 
            s.email === staffEmail && s.id !== currentEditingId
        );
        
        if (duplicateEmail) {
            UI.showToast('Email address already exists', 'error');
            return;
        }

        // Prepare data
        const staffData = {
            name: staffName,
            email: staffEmail,
            phone: staffPhone,
            roles: roles,
            centers: assignedCenters,
            departments: assignedDepartments,
            status: 'Active'
        };

        if (currentEditingId) {
            staffData.id = currentEditingId;
        }

        // Save
        const result = DataService.saveStaff(staffData);
        
        if (result.success) {
            UI.showToast(`Staff member ${currentEditingId ? 'updated' : 'added'} successfully`, 'success');
            
            // Refresh data
            centers = DataService.getCenters();
            departments = DataService.getDepartments();
            
            // Reset and close
            resetForm();
            bootstrap.Modal.getInstance(addStaffModal).hide();
            populateStaffTable();
            populateFilterDropdowns();
        } else {
            UI.showToast(result.error || 'Error saving staff member', 'error');
        }
    }

    function resetForm() {
        if (addStaffForm) addStaffForm.reset();
        currentEditingId = null;
        
        // Uncheck roles
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(cb => {
            cb.checked = false;
        });
        
        // Hide containers
        document.getElementById('centersAssignmentContainer').style.display = 'none';
        document.getElementById('departmentsAssignmentContainer').style.display = 'none';
        
        // Reset required
        document.getElementById('assignedCenters').required = false;
        document.getElementById('assignedDepartments').required = false;
        
        // Reset title
        document.getElementById('addStaffModalLabel').textContent = 'Add New Staff Member';
    }

    function getAssignedNames(ids, sourceArray) {
        if (!ids || ids.length === 0) return '';
        return ids.map(id => {
            const item = sourceArray.find(item => item.id === id);
            return item ? item.name : '';
        }).filter(name => name).join(', ');
    }

    function formatRoles(roles) {
        if (!roles) return '';
        const roleNames = {
            'coordinator': 'Coordinator',
            'department_head': 'Dept Head',
            'registrar': 'Registrar',
            'president': 'President',
            'lecturer': 'Lecturer'
        };
        return roles.map(r => roleNames[r] || r).join(', ');
    }

    function updateAssignmentVisibility() {
        const roles = Array.from(document.querySelectorAll('#addStaffModal .form-check-input:checked'))
            .map(cb => cb.value);
        
        const showCenters = roles.includes('coordinator') || roles.includes('lecturer');
        const centersContainer = document.getElementById('centersAssignmentContainer');
        if (centersContainer) {
            centersContainer.style.display = showCenters ? 'block' : 'none';
            if (showCenters) {
                document.getElementById('assignedCenters').required = true;
            } else {
                document.getElementById('assignedCenters').required = false;
            }
        }
        
        const showDepartments = roles.includes('department_head') || roles.includes('lecturer');
        const deptsContainer = document.getElementById('departmentsAssignmentContainer');
        if (deptsContainer) {
            deptsContainer.style.display = showDepartments ? 'block' : 'none';
            if (showDepartments) {
                document.getElementById('assignedDepartments').required = true;
            } else {
                document.getElementById('assignedDepartments').required = false;
            }
        }
    }

    function populateAssignmentDropdowns() {
        // Centers dropdown
        const centersSelect = document.getElementById('assignedCenters');
        if (centersSelect) {
            centersSelect.innerHTML = centers.map(center => 
                `<option value="${center.id}">${center.name}</option>`
            ).join('');
        }

        // Departments dropdown
        const deptsSelect = document.getElementById('assignedDepartments');
        if (deptsSelect) {
            deptsSelect.innerHTML = departments.map(dept => 
                `<option value="${dept.id}">${dept.name}</option>`
            ).join('');
        }
    }

    // Utility function for debouncing
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

// Add to DataService if not exists
if (typeof DataService !== 'undefined') {
    DataService.updateStaffStatus = function(id, status) {
        try {
            const staff = this.getStaff();
            const index = staff.findIndex(s => s.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Staff member not found' };
            }
            
            staff[index].status = status;
            staff[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('staff', JSON.stringify(staff));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
}