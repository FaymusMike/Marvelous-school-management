document.addEventListener('DOMContentLoaded', function() {
    // Initialize data structure
    initializeCentersData();
    
    // DOM Elements
    const centersTable = document.getElementById('centersTable')?.getElementsByTagName('tbody')[0];
    const centerCoordinatorSelect = document.getElementById('centerCoordinator');
    const saveCenterBtn = document.getElementById('saveCenterBtn');
    const addCenterForm = document.getElementById('addCenterForm');
    const addCenterModal = document.getElementById('addCenterModal');
    let currentEditingId = null;
    
    // State management
    let centers = [];
    let staff = [];
    let departments = [];
    
    // Only proceed if we're on the centers page
    if (!centersTable || !centerCoordinatorSelect || !saveCenterBtn) return;
    
    // Load all data
    loadAllData();
    
    // Initialize the page
    populateCoordinatorsDropdown();
    populateCentersTable();
    setupEventListeners();
    addEnhancedFeatures();
    
    function initializeCentersData() {
        if (!localStorage.getItem('centers')) {
            const sampleCenters = [
                { 
                    id: 1, 
                    name: 'Main Campus Center', 
                    location: 'Building A, Main Campus', 
                    coordinator: 'John Doe', 
                    coordinatorId: 1,
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    departments: [1, 2], // Associated departments
                    staffCount: 15
                },
                { 
                    id: 2, 
                    name: 'Downtown Center', 
                    location: '123 Downtown St', 
                    coordinator: 'Jane Smith', 
                    coordinatorId: 2,
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    departments: [3],
                    staffCount: 8
                },
                { 
                    id: 3, 
                    name: 'Northside Center', 
                    location: '456 North Ave', 
                    coordinator: 'Mike Johnson', 
                    coordinatorId: 3,
                    status: 'Inactive',
                    createdAt: new Date().toISOString(),
                    departments: [],
                    staffCount: 0
                }
            ];
            localStorage.setItem('centers', JSON.stringify(sampleCenters));
        }
    }
    
    function loadAllData() {
        centers = JSON.parse(localStorage.getItem('centers')) || [];
        staff = JSON.parse(localStorage.getItem('staff')) || [];
        departments = JSON.parse(localStorage.getItem('departments')) || [];
    }
    
    function setupEventListeners() {
        // Save center button
        saveCenterBtn.addEventListener('click', handleSaveCenter);
        
        // Modal close event
        addCenterModal.addEventListener('hidden.bs.modal', resetForm);
        
        // Search functionality (will be added dynamically)
        document.addEventListener('keyup', function(e) {
            if (e.target.id === 'searchCenters') {
                filterCentersTable(e.target.value);
            }
        });
    }
    
    function addEnhancedFeatures() {
        // Add search bar above the table
        const cardBody = document.querySelector('#centersTable').closest('.card-body');
        if (cardBody && !document.getElementById('searchCenters')) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'row mb-3';
            searchDiv.innerHTML = `
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="searchCenters" placeholder="Search centers...">
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-outline-secondary me-2" id="exportCentersBtn">
                        <i class="bi bi-download"></i> Export
                    </button>
                    <button class="btn btn-outline-info" id="viewStatsBtn">
                        <i class="bi bi-graph-up"></i> Statistics
                    </button>
                </div>
            `;
            cardBody.insertBefore(searchDiv, cardBody.querySelector('.table-responsive'));
            
            // Add event listeners for new buttons
            document.getElementById('exportCentersBtn').addEventListener('click', exportCenters);
            document.getElementById('viewStatsBtn').addEventListener('click', showCenterStatistics);
        }
    }
    
    function getAvailableCoordinators() {
        return staff.filter(member => 
            member.roles && member.roles.includes('coordinator')
        ).map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: 'coordinator',
            centers: member.centers || []
        }));
    }
    
    function populateCoordinatorsDropdown() {
        centerCoordinatorSelect.innerHTML = '<option value="">Select Coordinator</option>';
        const availableCoordinators = getAvailableCoordinators();
        
        if (availableCoordinators.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.disabled = true;
            option.textContent = 'No coordinators available - add staff with coordinator role first';
            centerCoordinatorSelect.appendChild(option);
        } else {
            availableCoordinators.forEach(coordinator => {
                const option = document.createElement('option');
                option.value = coordinator.id;
                option.textContent = `${coordinator.name} ${coordinator.email ? '- ' + coordinator.email : ''}`;
                
                // Disable coordinators already assigned to maximum centers (optional)
                const assignedCenters = centers.filter(c => c.coordinatorId === coordinator.id).length;
                if (assignedCenters >= 3) { // Max 3 centers per coordinator
                    option.disabled = true;
                    option.textContent += ' (Maximum centers reached)';
                }
                
                centerCoordinatorSelect.appendChild(option);
            });
        }
    }
    
    function populateCentersTable() {
        centersTable.innerHTML = '';
        
        if (centers.length === 0) {
            const row = centersTable.insertRow();
            row.innerHTML = `
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-building fs-1 d-block mb-3 text-muted"></i>
                    <p class="text-muted mb-0">No centers found. Click "Add New Center" to create one.</p>
                </td>
            `;
            return;
        }
        
        centers.forEach(center => {
            const coordinator = staff.find(s => s.id === center.coordinatorId);
            const row = centersTable.insertRow();
            row.dataset.id = center.id;
            
            // Calculate additional metrics
            const departmentCount = center.departments?.length || 0;
            const staffCount = center.staffCount || calculateStaffCount(center.id);
            
            row.innerHTML = `
                <td>${center.id}</td>
                <td>
                    <strong>${center.name}</strong>
                    <br>
                    <small class="text-muted">Created: ${formatDate(center.createdAt)}</small>
                </td>
                <td>${center.location}</td>
                <td>
                    ${coordinator ? `
                        <div><strong>${coordinator.name}</strong></div>
                        <small class="text-muted">${coordinator.email || ''}</small>
                    ` : '<span class="text-danger">No coordinator assigned</span>'}
                </td>
                <td>
                    <div><span class="badge ${center.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${center.status}</span></div>
                    <small class="text-muted">${departmentCount} depts | ${staffCount} staff</small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${center.id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info view-btn" data-id="${center.id}" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success assign-btn" data-id="${center.id}" title="Assign Departments">
                            <i class="bi bi-diagram-3"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${center.id}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditCenter);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteCenter);
        });
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', handleViewCenter);
        });
        
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', handleAssignDepartments);
        });
    }
    
    function calculateStaffCount(centerId) {
        return staff.filter(member => 
            member.centers && member.centers.includes(centerId)
        ).length;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    function filterCentersTable(searchTerm) {
        const filter = searchTerm.toLowerCase();
        const rows = centersTable.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            if (row.cells.length === 1 && row.cells[0].colSpan === 6) return; // Skip empty state row
            
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    }
    
    function handleViewCenter(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        if (!center) return;
        
        const coordinator = staff.find(s => s.id === center.coordinatorId);
        const assignedDepartments = departments.filter(d => center.departments?.includes(d.id));
        const assignedStaff = staff.filter(s => s.centers?.includes(center.id));
        
        // Create a detailed view modal
        const detailsHtml = `
            <div class="container">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Center Name:</strong> ${center.name}
                    </div>
                    <div class="col-md-6">
                        <strong>Status:</strong> 
                        <span class="badge ${center.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${center.status}</span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Location:</strong> ${center.location}
                    </div>
                    <div class="col-md-6">
                        <strong>Created:</strong> ${formatDate(center.createdAt)}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <strong>Coordinator:</strong> 
                        ${coordinator ? `${coordinator.name} (${coordinator.email || 'No email'})` : 'Not assigned'}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <strong>Departments (${assignedDepartments.length}):</strong>
                        <ul class="list-unstyled">
                            ${assignedDepartments.map(d => `<li><i class="bi bi-diagram-2 me-2"></i>${d.name}</li>`).join('') || '<li class="text-muted">No departments assigned</li>'}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <strong>Staff Members (${assignedStaff.length}):</strong>
                        <ul class="list-unstyled">
                            ${assignedStaff.map(s => `<li><i class="bi bi-person me-2"></i>${s.name} (${s.roles.join(', ')})</li>`).join('') || '<li class="text-muted">No staff assigned</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal('Center Details', detailsHtml);
    }
    
    function handleEditCenter(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        if (!center) return;
        
        currentEditingId = id;
        
        // Fill the form with center data
        document.getElementById('centerName').value = center.name;
        document.getElementById('centerLocation').value = center.location;
        
        // Set the coordinator in the dropdown
        if (center.coordinatorId) {
            document.getElementById('centerCoordinator').value = center.coordinatorId;
        }
        
        // Change modal title
        document.getElementById('addCenterModalLabel').textContent = 'Edit Center';
        
        // Show the modal
        const modal = new bootstrap.Modal(addCenterModal);
        modal.show();
    }
    
    function handleDeleteCenter(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        
        // Check if center has staff or departments
        const hasStaff = staff.some(s => s.centers?.includes(id));
        const hasDepartments = center.departments && center.departments.length > 0;
        
        let warningMessage = 'Are you sure you want to delete this center?';
        if (hasStaff || hasDepartments) {
            warningMessage = 'WARNING: This center has ';
            if (hasStaff) warningMessage += 'assigned staff ';
            if (hasStaff && hasDepartments) warningMessage += 'and ';
            if (hasDepartments) warningMessage += 'associated departments ';
            warningMessage += '. Deleting it will remove these associations. Continue?';
        }
        
        if (confirm(warningMessage)) {
            // Remove center from staff assignments
            staff = staff.map(s => ({
                ...s,
                centers: s.centers ? s.centers.filter(cId => cId !== id) : []
            }));
            
            // Remove center from centers array
            centers = centers.filter(c => c.id !== id);
            
            // Save updates
            localStorage.setItem('centers', JSON.stringify(centers));
            localStorage.setItem('staff', JSON.stringify(staff));
            
            // Refresh data
            loadAllData();
            populateCoordinatorsDropdown();
            populateCentersTable();
            
            showNotification('Center deleted successfully!', 'success');
        }
    }
    
    function handleAssignDepartments(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        
        // Create department assignment modal
        const modalHtml = `
            <div class="modal fade" id="assignDeptModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Assign Departments to ${center.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="assignDeptForm">
                                <div class="mb-3">
                                    <label class="form-label">Select Departments</label>
                                    <select class="form-select" id="deptAssignment" multiple size="5">
                                        ${departments.map(dept => `
                                            <option value="${dept.id}" ${center.departments?.includes(dept.id) ? 'selected' : ''}>
                                                ${dept.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <small class="text-muted">Hold Ctrl/Cmd to select multiple departments</small>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveDeptAssignment">Save Assignments</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('assignDeptModal'));
        modal.show();
        
        // Handle save
        document.getElementById('saveDeptAssignment').addEventListener('click', function() {
            const selectedDepts = Array.from(document.getElementById('deptAssignment').selectedOptions)
                .map(opt => parseInt(opt.value));
            
            // Update center
            const centerIndex = centers.findIndex(c => c.id === id);
            if (centerIndex !== -1) {
                centers[centerIndex].departments = selectedDepts;
                localStorage.setItem('centers', JSON.stringify(centers));
                
                // Update departments with center reference
                departments = departments.map(dept => ({
                    ...dept,
                    center: selectedDepts.includes(dept.id) ? id : dept.center
                }));
                localStorage.setItem('departments', JSON.stringify(departments));
                
                // Refresh
                loadAllData();
                populateCentersTable();
                
                // Close modal
                modal.hide();
                document.getElementById('assignDeptModal').remove();
                
                showNotification('Departments assigned successfully!', 'success');
            }
        });
        
        // Clean up modal on close
        document.getElementById('assignDeptModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
    
    function handleSaveCenter() {
        const centerName = document.getElementById('centerName').value.trim();
        const centerLocation = document.getElementById('centerLocation').value.trim();
        const coordinatorId = document.getElementById('centerCoordinator').value;
        
        // Validation
        if (!centerName || !centerLocation || !coordinatorId) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const coordinator = staff.find(s => s.id == coordinatorId);
        if (!coordinator) {
            showNotification('Selected coordinator not found', 'error');
            return;
        }
        
        // Check if coordinator is already assigned to too many centers
        if (!currentEditingId) {
            const coordinatorCenters = centers.filter(c => c.coordinatorId == coordinatorId).length;
            if (coordinatorCenters >= 3) {
                if (!confirm('This coordinator already manages 3 centers. Adding another may overload them. Continue anyway?')) {
                    return;
                }
            }
        }
        
        if (currentEditingId) {
            // Update existing center
            const index = centers.findIndex(c => c.id === currentEditingId);
            if (index !== -1) {
                const oldCoordinatorId = centers[index].coordinatorId;
                
                centers[index] = {
                    ...centers[index],
                    name: centerName,
                    location: centerLocation,
                    coordinator: coordinator.name,
                    coordinatorId: coordinator.id,
                    updatedAt: new Date().toISOString()
                };
                
                // Update coordinator's center list
                if (oldCoordinatorId !== coordinator.id) {
                    // Remove center from old coordinator
                    staff = staff.map(s => {
                        if (s.id === oldCoordinatorId) {
                            return {
                                ...s,
                                centers: s.centers ? s.centers.filter(cId => cId !== currentEditingId) : []
                            };
                        }
                        return s;
                    });
                    
                    // Add center to new coordinator
                    staff = staff.map(s => {
                        if (s.id === coordinator.id) {
                            return {
                                ...s,
                                centers: [...(s.centers || []), currentEditingId]
                            };
                        }
                        return s;
                    });
                }
            }
        } else {
            // Add new center
            const newId = centers.length > 0 ? Math.max(...centers.map(c => c.id)) + 1 : 1;
            const newCenter = {
                id: newId,
                name: centerName,
                location: centerLocation,
                coordinator: coordinator.name,
                coordinatorId: coordinator.id,
                status: 'Active',
                createdAt: new Date().toISOString(),
                departments: [],
                staffCount: 0
            };
            centers.push(newCenter);
            
            // Update coordinator's center list
            staff = staff.map(s => {
                if (s.id === coordinator.id) {
                    return {
                        ...s,
                        centers: [...(s.centers || []), newId]
                    };
                }
                return s;
            });
        }
        
        // Save all changes
        localStorage.setItem('centers', JSON.stringify(centers));
        localStorage.setItem('staff', JSON.stringify(staff));
        
        // Refresh data
        loadAllData();
        populateCoordinatorsDropdown();
        populateCentersTable();
        
        // Reset form and close modal
        resetForm();
        bootstrap.Modal.getInstance(addCenterModal).hide();
        
        showNotification(`Center ${currentEditingId ? 'updated' : 'added'} successfully!`, 'success');
    }
    
    function resetForm() {
        if (addCenterForm) addCenterForm.reset();
        currentEditingId = null;
        document.getElementById('addCenterModalLabel').textContent = 'Add New Center';
        
        // Remove any error highlights
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    }
    
    function exportCenters() {
        const dataStr = JSON.stringify(centers, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `centers_export_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Centers exported successfully!', 'success');
    }
    
    function showCenterStatistics() {
        const activeCenters = centers.filter(c => c.status === 'Active').length;
        const inactiveCenters = centers.filter(c => c.status !== 'Active').length;
        const totalStaff = staff.length;
        const staffInCenters = staff.filter(s => s.centers && s.centers.length > 0).length;
        
        const statsHtml = `
            <div class="container">
                <div class="row text-center mb-4">
                    <div class="col-md-4">
                        <div class="border rounded p-3">
                            <h3 class="text-primary">${centers.length}</h3>
                            <small>Total Centers</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="border rounded p-3">
                            <h3 class="text-success">${activeCenters}</h3>
                            <small>Active Centers</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="border rounded p-3">
                            <h3 class="text-warning">${inactiveCenters}</h3>
                            <small>Inactive Centers</small>
                        </div>
                    </div>
                </div>
                <div class="row text-center">
                    <div class="col-md-6">
                        <div class="border rounded p-3">
                            <h3>${staffInCenters}</h3>
                            <small>Staff in Centers</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="border rounded p-3">
                            <h3>${totalStaff - staffInCenters}</h3>
                            <small>Unassigned Staff</small>
                        </div>
                    </div>
                </div>
                <hr>
                <h6 class="mt-3">Centers by Staff Count:</h6>
                <ul class="list-unstyled">
                    ${centers.sort((a, b) => (b.staffCount || 0) - (a.staffCount || 0))
                        .slice(0, 5)
                        .map(c => `<li><strong>${c.name}:</strong> ${c.staffCount || 0} staff members</li>`)
                        .join('')}
                </ul>
            </div>
        `;
        
        showCustomModal('Center Statistics', statsHtml);
    }
    
    function showCustomModal(title, content) {
        const modalId = 'customModal_' + Date.now();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '300px';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Refresh data when staff changes (listening for storage events)
    window.addEventListener('storage', function(e) {
        if (e.key === 'staff' || e.key === 'departments') {
            loadAllData();
            populateCoordinatorsDropdown();
            populateCentersTable();
        }
    });
});