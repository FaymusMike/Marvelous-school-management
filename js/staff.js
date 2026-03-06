document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Check permissions
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

    // Only proceed if we're on the staff page
    if (!staffTable || !saveStaffBtn) return;

    // Load initial data
    let centers = DataService.getCenters();
    let departments = DataService.getDepartments();

    // Initialize the page
    populateStaffTable();
    setupEventListeners();
    populateAssignmentDropdowns();

    function setupEventListeners() {
        // Role checkboxes
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', updateAssignmentVisibility);
        });

        // Save button
        saveStaffBtn.addEventListener('click', handleSaveStaff);

        // Modal close
        if (addStaffModal) {
            addStaffModal.addEventListener('hidden.bs.modal', resetForm);
        }

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                UI.filterTable('staffTable', e.target.value);
            });
        }

        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                UI.exportTableToCSV('staffTable', 'staff_list.csv');
            });
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
                        <td colspan="8" class="text-center py-4">
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

            staffTable.innerHTML = staff.map(member => {
                const assignedCenters = getAssignedNames(member.centers, centers);
                const assignedDepartments = getAssignedNames(member.departments, departments);

                return `
                    <tr>
                        <td>${member.id}</td>
                        <td>
                            <strong>${member.name}</strong>
                            <small class="d-block text-muted">${member.email}</small>
                        </td>
                        <td>${formatRoles(member.roles)}</td>
                        <td>${member.phone}</td>
                        <td>
                            ${assignedCenters ? `<span class="badge bg-info me-1" title="Centers">${assignedCenters}</span>` : ''}
                            ${assignedDepartments ? `<span class="badge bg-secondary" title="Departments">${assignedDepartments}</span>` : ''}
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

            UI.hideLoading(staffTable.parentElement);
            UI.initTooltips();
        }, 300);
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

    function handleViewStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = DataService.getStaffById(id);
        
        if (!member) return;
        
        const assignedCenters = getAssignedNames(member.centers, centers);
        const assignedDepartments = getAssignedNames(member.departments, departments);

        UI.alert(`
            <div class="text-start">
                <p><strong>ID:</strong> ${member.id}</p>
                <p><strong>Name:</strong> ${member.name}</p>
                <p><strong>Email:</strong> ${member.email}</p>
                <p><strong>Phone:</strong> ${member.phone}</p>
                <p><strong>Roles:</strong> ${formatRoles(member.roles)}</p>
                <p><strong>Centers:</strong> ${assignedCenters || 'None'}</p>
                <p><strong>Departments:</strong> ${assignedDepartments || 'None'}</p>
                <p><strong>Status:</strong> <span class="badge ${member.status === 'Active' ? 'bg-success' : 'bg-danger'}">${member.status}</span></p>
                <p><strong>Created:</strong> ${UI.formatDate(member.createdAt)}</p>
                <p><strong>Last Updated:</strong> ${UI.formatDate(member.updatedAt)}</p>
            </div>
        `, 'Staff Details');
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
        
        const confirmed = await UI.confirm(
            `Are you sure you want to delete <strong>${member.name}</strong>?`,
            'Delete Staff Member'
        );
        
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

    // Add search box to the page
    const cardBody = document.querySelector('.card-body');
    if (cardBody && !document.getElementById('searchStaff')) {
        const searchDiv = document.createElement('div');
        searchDiv.className = 'row mb-3';
        searchDiv.innerHTML = `
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="searchStaff" placeholder="Search staff...">
                </div>
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-success" id="exportStaff">
                    <i class="bi bi-download"></i> Export CSV
                </button>
            </div>
        `;
        cardBody.insertBefore(searchDiv, cardBody.querySelector('.table-responsive'));
    }
});