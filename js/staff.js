document.addEventListener('DOMContentLoaded', function() {
    // Initialize data from localStorage or with sample data
    initializeData();

    // DOM Elements
    const staffTable = document.getElementById('staffTable')?.getElementsByTagName('tbody')[0];
    const saveStaffBtn = document.getElementById('saveStaffBtn');
    const addStaffForm = document.getElementById('addStaffForm');
    const addStaffModal = document.getElementById('addStaffModal');
    let currentEditingId = null;

    // Only proceed if we're on the staff page
    if (!staffTable || !saveStaffBtn) return;

    // Load current data
    let staff = JSON.parse(localStorage.getItem('staff')) || [];
    let centers = JSON.parse(localStorage.getItem('centers')) || [];
    let departments = JSON.parse(localStorage.getItem('departments')) || [];

    // Initialize the page
    populateStaffTable();
    setupEventListeners();

    function initializeData() {
        if (!localStorage.getItem('staff')) {
            localStorage.setItem('staff', JSON.stringify([
                { 
                    id: 1, 
                    name: 'John Doe', 
                    roles: ['coordinator'], 
                    email: 'john@school.edu', 
                    phone: '123-456-7890', 
                    centers: [1], 
                    departments: [], 
                    status: 'Active' 
                },
                { 
                    id: 2, 
                    name: 'Jane Smith', 
                    roles: ['coordinator'], 
                    email: 'jane@school.edu', 
                    phone: '234-567-8901', 
                    centers: [2], 
                    departments: [], 
                    status: 'Active' 
                }
            ]));
        }

        if (!localStorage.getItem('centers')) {
            localStorage.setItem('centers', JSON.stringify([
                { id: 1, name: 'Main Campus Center' },
                { id: 2, name: 'Downtown Center' }
            ]));
        }

        if (!localStorage.getItem('departments')) {
            localStorage.setItem('departments', JSON.stringify([
                { id: 1, name: 'Exams and Records' },
                { id: 2, name: 'Bursary' }
            ]));
        }
    }

    function populateStaffTable() {
        if (!staffTable) return;
        
        staffTable.innerHTML = '';
        staff.forEach(member => {
            const assignedCenters = getAssignedNames(member.centers, centers);
            const assignedDepartments = getAssignedNames(member.departments, departments);

            const row = staffTable.insertRow();
            row.innerHTML = `
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${formatRoles(member.roles)}</td>
                <td>${member.email}</td>
                <td>${member.phone}</td>
                <td>${formatAssignments(assignedCenters, assignedDepartments)}</td>
                <td><span class="badge ${member.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${member.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${member.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${member.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                    <button class="btn btn-sm btn-outline-info view-btn" data-id="${member.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            `;
        });

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditStaff);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteStaff);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', handleViewStaff);
        });
    }

    function setupEventListeners() {
        // Role checkboxes event listeners
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateAssignmentVisibility();
            });
        });

        // Save staff button
        saveStaffBtn.addEventListener('click', handleSaveStaff);

        // Modal close event
        if (addStaffModal) {
            addStaffModal.addEventListener('hidden.bs.modal', resetForm);
        }
    }

    function getAssignedNames(ids, sourceArray) {
        return ids?.map(id => {
            const item = sourceArray.find(item => item.id === id);
            return item ? item.name : '';
        }).filter(name => name).join(', ') || '';
    }

    function formatRoles(roles) {
        if (!roles) return '';
        if (typeof roles === 'string') return getRoleName(roles);
        return roles.map(getRoleName).join(', ');
    }

    function formatAssignments(centers, departments) {
        const assignments = [];
        if (centers) assignments.push(`Centers: ${centers}`);
        if (departments) assignments.push(`Depts: ${departments}`);
        return assignments.join(' | ');
    }

    function getRoleName(role) {
        const roleNames = {
            'coordinator': 'Coordinator',
            'department_head': 'Department Head',
            'registrar': 'Registrar',
            'president': 'President',
            'lecturer': 'Lecturer'
        };
        return roleNames[role] || role;
    }

    function handleViewStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = staff.find(s => s.id === id);
        
        if (!member) return;
        
        const assignedCenters = getAssignedNames(member.centers, centers);
        const assignedDepartments = getAssignedNames(member.departments, departments);

        alert(`Viewing Staff:\n\nID: ${member.id}\nName: ${member.name}\nRoles: ${formatRoles(member.roles)}\nEmail: ${member.email}\nPhone: ${member.phone}\nCenters: ${assignedCenters || 'None'}\nDepartments: ${assignedDepartments || 'None'}\nStatus: ${member.status}`);
    }

    function handleEditStaff(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const member = staff.find(s => s.id === id);
        if (!member) return;
        
        currentEditingId = id;

        // Fill the form with staff data
        document.getElementById('staffName').value = member.name;
        document.getElementById('staffEmail').value = member.email;
        document.getElementById('staffPhone').value = member.phone;
        
        // Set the role checkboxes
        const roles = Array.isArray(member.roles) ? member.roles : [member.roles || member.role];
        roles.forEach(role => {
            const checkbox = document.querySelector(`#addStaffModal input[value="${role}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Populate and show assignment dropdowns
        updateAssignmentVisibility();
        populateAssignmentDropdown('assignedCenters', centers, member.centers);
        populateAssignmentDropdown('assignedDepartments', departments, member.departments);

        // Change modal title
        document.getElementById('addStaffModalLabel').textContent = 'Edit Staff Member';
        
        // Show the modal
        const modal = new bootstrap.Modal(addStaffModal);
        modal.show();
    }

    function populateAssignmentDropdown(dropdownId, sourceArray, selectedIds = []) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        sourceArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            option.selected = selectedIds.includes(item.id);
            dropdown.appendChild(option);
        });
    }

    function updateAssignmentVisibility() {
        const roles = Array.from(document.querySelectorAll('#addStaffModal .form-check-input:checked'))
            .map(checkbox => checkbox.value);
        
        // Show centers assignment if coordinator or lecturer is selected
        const showCenters = roles.includes('coordinator') || roles.includes('lecturer');
        document.getElementById('centersAssignmentContainer').style.display = 
            showCenters ? 'block' : 'none';
        
        // Show departments assignment if department_head or lecturer is selected
        const showDepartments = roles.includes('department_head') || roles.includes('lecturer');
        document.getElementById('departmentsAssignmentContainer').style.display = 
            showDepartments ? 'block' : 'none';
        
        // Populate dropdowns when shown
        if (showCenters) {
            populateAssignmentDropdown('assignedCenters', centers);
        }
        if (showDepartments) {
            populateAssignmentDropdown('assignedDepartments', departments);
        }
    }

    function handleDeleteStaff(e) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            const id = parseInt(e.target.closest('button').dataset.id);
            staff = staff.filter(s => s.id !== id);
            localStorage.setItem('staff', JSON.stringify(staff));
            populateStaffTable();
            alert('Staff member deleted successfully!');
        }
    }

    function handleSaveStaff() {
        const staffName = document.getElementById('staffName').value.trim();
        const staffEmail = document.getElementById('staffEmail').value.trim();
        const staffPhone = document.getElementById('staffPhone').value.trim();
        
        // Get selected roles
        const roles = Array.from(document.querySelectorAll('#addStaffModal .form-check-input:checked'))
            .map(checkbox => checkbox.value);
        
        if (!staffName || !staffEmail || !staffPhone || roles.length === 0) {
            alert('Please fill in all required fields and select at least one role');
            return;
        }

        // Get selected centers and departments
        const assignedCenters = document.getElementById('assignedCenters') ? 
            Array.from(document.getElementById('assignedCenters').selectedOptions).map(opt => parseInt(opt.value)) : [];
        
        const assignedDepartments = document.getElementById('assignedDepartments') ? 
            Array.from(document.getElementById('assignedDepartments').selectedOptions).map(opt => parseInt(opt.value)) : [];
        
        // Validate assignments based on roles
        if ((roles.includes('coordinator') || roles.includes('lecturer')) && assignedCenters.length === 0) {
            alert('Please assign at least one center for coordinator/lecturer roles');
            return;
        }
        
        if ((roles.includes('department_head') || roles.includes('lecturer')) && assignedDepartments.length === 0) {
            alert('Please assign at least one department for department head/lecturer roles');
            return;
        }

        // Prepare staff data
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
            // Update existing staff
            const index = staff.findIndex(s => s.id === currentEditingId);
            if (index !== -1) {
                staff[index] = { ...staff[index], ...staffData };
            }
        } else {
            // Add new staff
            const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
            staff.push({ id: newId, ...staffData });
        }
        
        // Save to localStorage
        localStorage.setItem('staff', JSON.stringify(staff));
        
        // Refresh UI
        populateStaffTable();
        resetForm();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(addStaffModal);
        if (modal) modal.hide();
        
        // Show success message
        alert(`Staff member ${currentEditingId ? 'updated' : 'added'} successfully!`);
    }

    function resetForm() {
        if (addStaffForm) addStaffForm.reset();
        currentEditingId = null;
        
        // Uncheck all role checkboxes
        document.querySelectorAll('#addStaffModal .form-check-input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Hide assignment containers
        document.getElementById('centersAssignmentContainer').style.display = 'none';
        document.getElementById('departmentsAssignmentContainer').style.display = 'none';
        
        // Reset modal title
        if (document.getElementById('addStaffModalLabel')) {
            document.getElementById('addStaffModalLabel').textContent = 'Add New Staff Member';
        }
    }
});