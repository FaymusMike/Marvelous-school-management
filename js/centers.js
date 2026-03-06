document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Check permissions (only president and registrar can manage centers)
    if (!['president', 'registrar'].includes(currentUser.role)) {
        UI.showToast('You do not have permission to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }

    // DOM Elements
    const centersTable = document.getElementById('centersTable')?.getElementsByTagName('tbody')[0];
    const centerCoordinatorSelect = document.getElementById('centerCoordinator');
    const saveCenterBtn = document.getElementById('saveCenterBtn');
    const addCenterForm = document.getElementById('addCenterForm');
    const addCenterModal = document.getElementById('addCenterModal');
    const searchInput = document.getElementById('searchCenters');
    const exportBtn = document.getElementById('exportCenters');
    const refreshBtn = document.getElementById('refreshCenters');
    const viewToggle = document.getElementById('viewToggle');
    
    let currentEditingId = null;
    let currentViewMode = 'all'; // 'all' or 'active'

    // Only proceed if we're on the centers page
    if (!centersTable || !saveCenterBtn) return;

    // Initialize the page
    loadCenters();
    loadCoordinators();
    setupEventListeners();

    function setupEventListeners() {
        // Save button
        saveCenterBtn.addEventListener('click', handleSaveCenter);

        // Modal close
        if (addCenterModal) {
            addCenterModal.addEventListener('hidden.bs.modal', resetForm);
            addCenterModal.addEventListener('show.bs.modal', function() {
                loadCoordinators(); // Refresh coordinator list when modal opens
            });
        }

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                UI.filterTable('centersTable', e.target.value, [1, 2, 3]); // Search in name, location, coordinator
            });
        }

        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                UI.exportTableToCSV('centersTable', 'centers_list.csv');
            });
        }

        // Refresh data
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                UI.showToast('Refreshing centers...', 'info');
                loadCenters();
            });
        }

        // View toggle
        if (viewToggle) {
            viewToggle.addEventListener('change', function(e) {
                currentViewMode = e.target.value;
                loadCenters();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+N for new center
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (!currentEditingId) {
                    resetForm();
                    new bootstrap.Modal(addCenterModal).show();
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
                loadCenters();
            }
        });
    }

    function loadCenters() {
        if (!centersTable) return;
        
        UI.showLoading(centersTable.parentElement, 'Loading centers...');
        
        setTimeout(() => {
            const allCenters = DataService.getCenters();
            
            // Filter based on view mode
            let centers = allCenters;
            if (currentViewMode === 'active') {
                centers = allCenters.filter(c => c.status === 'Active');
            } else if (currentViewMode === 'inactive') {
                centers = allCenters.filter(c => c.status === 'Inactive');
            }

            if (centers.length === 0) {
                centersTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-5">
                            <i class="bi bi-building fs-1 text-muted"></i>
                            <p class="mt-3 mb-2">No centers found</p>
                            <p class="text-muted small">${allCenters.length === 0 ? 'Click "Add New Center" to create your first center.' : 'Try changing your view filter.'}</p>
                            ${allCenters.length === 0 ? `
                                <button class="btn btn-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addCenterModal">
                                    <i class="bi bi-plus"></i> Add First Center
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
                UI.hideLoading(centersTable.parentElement);
                return;
            }

            // Get all staff for coordinator names
            const staff = DataService.getStaff();

            centersTable.innerHTML = centers.map(center => {
                const coordinator = staff.find(s => s.id === center.coordinatorId);
                const coordinatorName = coordinator ? coordinator.name : 'Unassigned';
                
                // Get additional stats for this center
                const centerStaff = staff.filter(s => s.centers && s.centers.includes(center.id));
                const lecturerCount = centerStaff.filter(s => s.roles.includes('lecturer')).length;
                const coordinatorCount = centerStaff.filter(s => s.roles.includes('coordinator')).length;

                return `
                    <tr class="center-row" data-id="${center.id}">
                        <td>
                            <strong>#${center.id}</strong>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-building text-primary me-2"></i>
                                <div>
                                    <strong>${center.name}</strong>
                                    <small class="d-block text-muted">${center.location}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-person-circle text-info me-2"></i>
                                <div>
                                    ${coordinatorName}
                                    <small class="d-block text-muted">
                                        <i class="bi bi-people"></i> ${lecturerCount} Lecturers
                                    </small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge ${center.status === 'Active' ? 'bg-success' : 'bg-danger'}">
                                <i class="bi bi-${center.status === 'Active' ? 'check-circle' : 'x-circle'} me-1"></i>
                                ${center.status}
                            </span>
                        </td>
                        <td>
                            <small class="text-muted">
                                <i class="bi bi-calendar"></i> ${UI.formatDate(center.updatedAt || center.createdAt)}
                            </small>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-outline-primary view-btn" data-id="${center.id}" title="View Details">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-warning edit-btn" data-id="${center.id}" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger delete-btn" data-id="${center.id}" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                                <button class="btn btn-outline-info staff-btn" data-id="${center.id}" title="View Staff">
                                    <i class="bi bi-people"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add event listeners
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => handleViewCenter(btn.dataset.id));
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => handleEditCenter(btn.dataset.id));
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => handleDeleteCenter(btn.dataset.id));
            });

            document.querySelectorAll('.staff-btn').forEach(btn => {
                btn.addEventListener('click', () => handleViewCenterStaff(btn.dataset.id));
            });

            // Add double-click to edit on rows
            document.querySelectorAll('.center-row').forEach(row => {
                row.addEventListener('dblclick', function() {
                    const id = this.dataset.id;
                    handleEditCenter(id);
                });
            });

            UI.hideLoading(centersTable.parentElement);
            UI.initTooltips();

            // Update statistics if stats element exists
            updateStatistics(centers, allCenters.length);
        }, 300);
    }

    function loadCoordinators() {
        if (!centerCoordinatorSelect) return;
        
        const staff = DataService.getStaff();
        const coordinators = staff.filter(s => s.roles.includes('coordinator') && s.status === 'Active');
        
        centerCoordinatorSelect.innerHTML = '<option value="">Select Coordinator...</option>';
        
        if (coordinators.length === 0) {
            centerCoordinatorSelect.innerHTML += `
                <option value="" disabled class="text-warning">
                    ⚠️ No coordinators available. Add staff with coordinator role first.
                </option>
            `;
            return;
        }

        // Group coordinators by their assigned centers for better UX
        const assignedCoordinators = coordinators.filter(c => c.centers && c.centers.length > 0);
        const unassignedCoordinators = coordinators.filter(c => !c.centers || c.centers.length === 0);

        // Add unassigned coordinators first (preferred for new centers)
        if (unassignedCoordinators.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Available Coordinators';
            unassignedCoordinators.forEach(coordinator => {
                const option = document.createElement('option');
                option.value = coordinator.id;
                option.textContent = `${coordinator.name} (Available)`;
                optgroup.appendChild(option);
            });
            centerCoordinatorSelect.appendChild(optgroup);
        }

        // Add assigned coordinators
        if (assignedCoordinators.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Assigned Coordinators';
            assignedCoordinators.forEach(coordinator => {
                const centerNames = coordinator.centers.map(cId => {
                    const center = DataService.getCenterById(cId);
                    return center ? center.name : 'Unknown';
                }).join(', ');
                
                const option = document.createElement('option');
                option.value = coordinator.id;
                option.textContent = `${coordinator.name} (${centerNames})`;
                optgroup.appendChild(option);
            });
            centerCoordinatorSelect.appendChild(optgroup);
        }
    }

    function handleViewCenter(centerId) {
        const center = DataService.getCenterById(parseInt(centerId));
        if (!center) return;

        const staff = DataService.getStaff();
        const coordinator = staff.find(s => s.id === center.coordinatorId);
        const centerStaff = staff.filter(s => s.centers && s.centers.includes(center.id));
        
        const lecturerCount = centerStaff.filter(s => s.roles.includes('lecturer')).length;
        const staffList = centerStaff.map(s => `• ${s.name} (${s.roles.join(', ')})`).join('\n');

        UI.alert(`
            <div class="text-start">
                <h5 class="mb-3">${center.name}</h5>
                
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="p-3 bg-light rounded text-center">
                            <h3 class="mb-0">${lecturerCount}</h3>
                            <small class="text-muted">Lecturers</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 bg-light rounded text-center">
                            <h3 class="mb-0">${centerStaff.length}</h3>
                            <small class="text-muted">Total Staff</small>
                        </div>
                    </div>
                </div>
                
                <table class="table table-sm">
                    <tr>
                        <th>ID:</th>
                        <td>${center.id}</td>
                    </tr>
                    <tr>
                        <th>Location:</th>
                        <td>${center.location}</td>
                    </tr>
                    <tr>
                        <th>Coordinator:</th>
                        <td>${coordinator ? coordinator.name : 'Unassigned'}</td>
                    </tr>
                    <tr>
                        <th>Status:</th>
                        <td><span class="badge ${center.status === 'Active' ? 'bg-success' : 'bg-danger'}">${center.status}</span></td>
                    </tr>
                    <tr>
                        <th>Created:</th>
                        <td>${UI.formatDate(center.createdAt)}</td>
                    </tr>
                    <tr>
                        <th>Last Updated:</th>
                        <td>${UI.formatDate(center.updatedAt)}</td>
                    </tr>
                </table>
                
                ${centerStaff.length > 0 ? `
                    <div class="mt-3">
                        <strong>Staff Members:</strong>
                        <div class="bg-light p-2 rounded mt-1" style="max-height: 150px; overflow-y: auto;">
                            ${staffList.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `, 'Center Details');
    }

    function handleViewCenterStaff(centerId) {
        const center = DataService.getCenterById(parseInt(centerId));
        if (!center) return;

        const staff = DataService.getStaff();
        const centerStaff = staff.filter(s => s.centers && s.centers.includes(center.id));

        if (centerStaff.length === 0) {
            UI.alert(`No staff members assigned to ${center.name}`, 'Center Staff');
            return;
        }

        const staffList = centerStaff.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.roles.join(', ')}</td>
                <td>
                    <span class="badge ${s.status === 'Active' ? 'bg-success' : 'bg-danger'}">${s.status}</span>
                </td>
            </tr>
        `).join('');

        UI.alert(`
            <h5 class="mb-3">Staff at ${center.name}</h5>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Roles</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staffList}
                    </tbody>
                </table>
            </div>
        `, 'Center Staff', 'lg');
    }

    function handleEditCenter(centerId) {
        const center = DataService.getCenterById(parseInt(centerId));
        if (!center) return;
        
        currentEditingId = center.id;

        // Fill form
        document.getElementById('centerName').value = center.name;
        document.getElementById('centerLocation').value = center.location;
        
        // Set coordinator
        if (center.coordinatorId) {
            document.getElementById('centerCoordinator').value = center.coordinatorId;
        }

        // Update modal title
        document.getElementById('addCenterModalLabel').textContent = 'Edit Center';
        
        // Show modal
        new bootstrap.Modal(addCenterModal).show();
    }

    async function handleDeleteCenter(centerId) {
        const center = DataService.getCenterById(parseInt(centerId));
        if (!center) return;
        
        // Check if center has staff
        const staff = DataService.getStaff();
        const assignedStaff = staff.some(s => s.centers && s.centers.includes(center.id));
        
        let warningMessage = `Are you sure you want to delete <strong>${center.name}</strong>?`;
        if (assignedStaff) {
            warningMessage = `<span class="text-danger">⚠️ This center has staff assigned!</span><br><br>
                ${warningMessage}<br>
                <small class="text-danger">Deleting this center will remove assignments from all staff members.</small>`;
        }
        
        const confirmed = await UI.confirm(warningMessage, 'Delete Center');
        
        if (confirmed) {
            const result = DataService.deleteCenter(center.id);
            
            if (result.success) {
                UI.showToast(`Center "${center.name}" deleted successfully`, 'success');
                loadCenters();
                loadCoordinators(); // Refresh coordinator list
            } else {
                UI.showToast(result.error || 'Error deleting center', 'error');
            }
        }
    }

    function handleSaveCenter() {
        const centerName = document.getElementById('centerName').value.trim();
        const centerLocation = document.getElementById('centerLocation').value.trim();
        const coordinatorId = document.getElementById('centerCoordinator').value;
        
        // Validation
        if (!DataService.validateRequired(centerName)) {
            UI.showToast('Please enter center name', 'warning');
            return;
        }
        
        if (!DataService.validateRequired(centerLocation)) {
            UI.showToast('Please enter center location', 'warning');
            return;
        }
        
        if (!coordinatorId) {
            UI.showToast('Please select a coordinator', 'warning');
            return;
        }

        // Get coordinator name for display
        const staff = DataService.getStaff();
        const coordinator = staff.find(s => s.id == coordinatorId);
        
        if (!coordinator) {
            UI.showToast('Selected coordinator not found', 'error');
            return;
        }

        // Prepare data
        const centerData = {
            name: centerName,
            location: centerLocation,
            coordinatorId: parseInt(coordinatorId),
            status: 'Active'
        };

        if (currentEditingId) {
            centerData.id = currentEditingId;
            // Preserve existing status if not changing
            const existing = DataService.getCenterById(currentEditingId);
            if (existing) {
                centerData.status = existing.status;
            }
        }

        // Save
        const result = DataService.saveCenter(centerData);
        
        if (result.success) {
            UI.showToast(`Center ${currentEditingId ? 'updated' : 'added'} successfully`, 'success');
            
            // Reset and close
            resetForm();
            bootstrap.Modal.getInstance(addCenterModal).hide();
            loadCenters();
            loadCoordinators(); // Refresh coordinator list
            
            // If this was an edit and coordinator changed, show notification
            if (currentEditingId && result.data.coordinatorId !== coordinator.id) {
                UI.showToast(`Coordinator updated to ${coordinator.name}`, 'info');
            }
        } else {
            UI.showToast(result.error || 'Error saving center', 'error');
        }
    }

    function resetForm() {
        if (addCenterForm) addCenterForm.reset();
        currentEditingId = null;
        document.getElementById('addCenterModalLabel').textContent = 'Add New Center';
    }

    function updateStatistics(centers, totalCount) {
        const statsContainer = document.getElementById('centerStats');
        if (!statsContainer) return;

        const activeCount = centers.filter(c => c.status === 'Active').length;
        const inactiveCount = centers.filter(c => c.status === 'Inactive').length;
        
        // Get total staff assigned to centers
        const staff = DataService.getStaff();
        const staffInCenters = staff.filter(s => s.centers && s.centers.length > 0).length;

        statsContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${totalCount}</h5>
                            <small>Total Centers</small>
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
                    <div class="card bg-warning text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${inactiveCount}</h5>
                            <small>Inactive</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body p-2 text-center">
                            <h5 class="mb-0">${staffInCenters}</h5>
                            <small>Assigned Staff</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Add search and controls to the page
    const cardBody = document.querySelector('.card-body');
    if (cardBody && !document.getElementById('searchCenters')) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'row mb-3 align-items-center';
        controlsDiv.innerHTML = `
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="searchCenters" placeholder="Search centers...">
                    <button class="btn btn-outline-secondary" type="button" id="clearSearch" title="Clear search">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="viewToggle">
                    <option value="all">All Centers</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>
            <div class="col-md-5 text-end">
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary" id="refreshCenters" title="Refresh (F5)">
                        <i class="bi bi-arrow-repeat"></i> Refresh
                    </button>
                    <button class="btn btn-success" id="exportCenters" title="Export to CSV">
                        <i class="bi bi-download"></i> Export
                    </button>
                    <button class="btn btn-info" id="printCenters" title="Print">
                        <i class="bi bi-printer"></i> Print
                    </button>
                </div>
            </div>
        `;
        cardBody.insertBefore(controlsDiv, cardBody.querySelector('.table-responsive'));

        // Add stats container
        const statsDiv = document.createElement('div');
        statsDiv.id = 'centerStats';
        statsDiv.className = 'mb-3';
        cardBody.insertBefore(statsDiv, cardBody.querySelector('.table-responsive'));

        // Add clear search functionality
        document.getElementById('clearSearch')?.addEventListener('click', function() {
            document.getElementById('searchCenters').value = '';
            UI.filterTable('centersTable', '');
        });

        // Add print functionality
        document.getElementById('printCenters')?.addEventListener('click', function() {
            UI.printTable('centersTable', 'Centers Report');
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