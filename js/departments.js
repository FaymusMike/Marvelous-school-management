document.addEventListener('DOMContentLoaded', function() {
    // Sample data - in a real app, this would come from an API
    let departments = JSON.parse(localStorage.getItem('departments')) || [
        { id: 1, name: 'Exams and Records', head: 'Sarah Williams', reportingTo: 'registrar', status: 'Active' },
        { id: 2, name: 'Bursary', head: 'David Brown', reportingTo: 'registrar', status: 'Active' },
        { id: 3, name: 'Accounting', head: 'Lisa Johnson', reportingTo: 'registrar', status: 'Active' },
        { id: 4, name: 'Certificate Department', head: 'Robert Taylor', reportingTo: 'registrar', status: 'Active' },
        { id: 5, name: 'Clearance Department', head: 'Emily Davis', reportingTo: 'registrar', status: 'Active' }
    ];

    let staff = JSON.parse(localStorage.getItem('staff')) || [
        { id: 1, name: 'John Doe', role: 'coordinator' },
        { id: 2, name: 'Jane Smith', role: 'coordinator' },
        { id: 3, name: 'Mike Johnson', role: 'coordinator' },
        { id: 4, name: 'Sarah Williams', role: 'department_head' },
        { id: 5, name: 'David Brown', role: 'department_head' },
        { id: 6, name: 'Lisa Johnson', role: 'department_head' },
        { id: 7, name: 'Robert Taylor', role: 'department_head' },
        { id: 8, name: 'Emily Davis', role: 'department_head' }
    ];

    const departmentsTable = document.getElementById('departmentsTable')?.getElementsByTagName('tbody')[0];
    const departmentHeadSelect = document.getElementById('departmentHead');
    const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const addDepartmentModal = document.getElementById('addDepartmentModal');
    let currentEditingId = null;

    // Only proceed if we're on the departments page
    if (!departmentsTable || !departmentHeadSelect || !saveDepartmentBtn) return;

    // Populate departments table
    function populateDepartmentsTable() {
        departmentsTable.innerHTML = '';
        departments.forEach(dept => {
            const row = departmentsTable.insertRow();
            row.innerHTML = `
                <td>${dept.id}</td>
                <td>${dept.name}</td>
                <td>${dept.head}</td>
                <td>${dept.reportingTo === 'registrar' ? 'Registrar' : 'President'}</td>
                <td><span class="badge ${dept.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${dept.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${dept.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${dept.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                    <button class="btn btn-sm btn-outline-info view-btn" data-id="${dept.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            `;
        });

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditDepartment);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteDepartment);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', handleViewDepartment);
        });
    }

    // Handle view department
    function handleViewDepartment(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const dept = departments.find(d => d.id === id);
        
        alert(`Viewing Department:\n\nID: ${dept.id}\nName: ${dept.name}\nHead: ${dept.head}\nReporting To: ${dept.reportingTo === 'registrar' ? 'Registrar' : 'President'}\nStatus: ${dept.status}`);
    }

    // Handle edit department
    function handleEditDepartment(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const dept = departments.find(d => d.id === id);
        currentEditingId = id;

        // Fill the form with department data
        document.getElementById('departmentName').value = dept.name;
        document.getElementById('reportingTo').value = dept.reportingTo;
        
        // Set the department head in the dropdown
        const head = staff.find(s => s.name === dept.head);
        if (head) {
            document.getElementById('departmentHead').value = head.id;
        }

        // Change modal title
        document.getElementById('addDepartmentModalLabel').textContent = 'Edit Department';
        
        // Show the modal
        const modal = new bootstrap.Modal(addDepartmentModal);
        modal.show();
    }

    // Handle delete department
    function handleDeleteDepartment(e) {
        if (confirm('Are you sure you want to delete this department?')) {
            const id = parseInt(e.target.closest('button').dataset.id);
            departments = departments.filter(d => d.id !== id);
            localStorage.setItem('departments', JSON.stringify(departments));
            populateDepartmentsTable();
            alert('Department deleted successfully!');
        }
    }

    // Populate department heads dropdown
    function populateDepartmentHeadsDropdown() {
        if (!departmentHeadSelect) return;
        
        departmentHeadSelect.innerHTML = '<option value="">Select Department Head</option>';
        
        // Ensure we have staff data
        if (!staff || staff.length === 0) {
            console.error('No staff data available');
            return;
        }
        
        // Filter for department heads and populate dropdown
        staff.filter(s => s.role === 'department_head').forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = staffMember.name;
            departmentHeadSelect.appendChild(option);
        });
    }

    // Save or update department
    saveDepartmentBtn.addEventListener('click', function() {
        const departmentName = document.getElementById('departmentName')?.value;
        const departmentHeadId = document.getElementById('departmentHead')?.value;
        const reportingTo = document.getElementById('reportingTo')?.value;
        
        // Debug logging
        console.log('Form values:', {
            departmentName,
            departmentHeadId,
            reportingTo
        });
        
        if (!departmentName || !departmentHeadId || !reportingTo) {
            alert('Please fill in all fields');
            return;
        }

        const head = staff.find(s => s.id == departmentHeadId);
        
        if (!head) {
            alert('Selected department head not found in staff records');
            return;
        }

        if (currentEditingId) {
            // Update existing department
            const index = departments.findIndex(d => d.id === currentEditingId);
            if (index !== -1) {
                departments[index] = {
                    ...departments[index],
                    name: departmentName,
                    head: head.name,
                    reportingTo: reportingTo
                };
            }
        } else {
            // Add new department
            const newDepartment = {
                id: departments.length > 0 ? Math.max(...departments.map(d => d.id)) + 1 : 1,
                name: departmentName,
                head: head.name,
                reportingTo: reportingTo,
                status: 'Active'
            };
            departments.push(newDepartment);
        }
        
        localStorage.setItem('departments', JSON.stringify(departments));
        populateDepartmentsTable();
        
        // Reset form and close modal
        if (addDepartmentForm) addDepartmentForm.reset();
        if (addDepartmentModal) {
            const modal = bootstrap.Modal.getInstance(addDepartmentModal);
            if (modal) modal.hide();
        }
        currentEditingId = null;
        if (document.getElementById('addDepartmentModalLabel')) {
            document.getElementById('addDepartmentModalLabel').textContent = 'Add New Department';
        }
        
        // Show success message
        alert(`Department ${currentEditingId ? 'updated' : 'added'} successfully!`);
    });

    // Reset form when modal is closed
    if (addDepartmentModal) {
        addDepartmentModal.addEventListener('hidden.bs.modal', function() {
            if (addDepartmentForm) addDepartmentForm.reset();
            currentEditingId = null;
            if (document.getElementById('addDepartmentModalLabel')) {
                document.getElementById('addDepartmentModalLabel').textContent = 'Add New Department';
            }
        });
    }

    // Initialize
    populateDepartmentHeadsDropdown();
    populateDepartmentsTable();
});