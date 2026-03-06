document.addEventListener('DOMContentLoaded', function() {
    // Sample data - in a real app, this would come from an API
    let centers = JSON.parse(localStorage.getItem('centers')) || [
        { id: 1, name: 'Main Campus Center', location: 'Building A, Main Campus', coordinator: 'John Doe', status: 'Active' },
        { id: 2, name: 'Downtown Center', location: '123 Downtown St', coordinator: 'Jane Smith', status: 'Active' },
        { id: 3, name: 'Northside Center', location: '456 North Ave', coordinator: 'Mike Johnson', status: 'Inactive' }
    ];

    const coordinators = JSON.parse(localStorage.getItem('staff')) || [
        { id: 1, name: 'John Doe', role: 'coordinator', centers: [1] },
        { id: 2, name: 'Jane Smith', role: 'coordinator', centers: [2] },
        { id: 3, name: 'Mike Johnson', role: 'coordinator', centers: [3] }
    ];

    const centersTable = document.getElementById('centersTable').getElementsByTagName('tbody')[0];
    const centerCoordinatorSelect = document.getElementById('centerCoordinator');
    const saveCenterBtn = document.getElementById('saveCenterBtn');
    const addCenterForm = document.getElementById('addCenterForm');
    const addCenterModal = document.getElementById('addCenterModal');
    let currentEditingId = null;

    // Populate centers table
    function populateCentersTable() {
        centersTable.innerHTML = '';
        centers.forEach(center => {
            const row = centersTable.insertRow();
            row.innerHTML = `
                <td>${center.id}</td>
                <td>${center.name}</td>
                <td>${center.location}</td>
                <td>${center.coordinator}</td>
                <td><span class="badge ${center.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${center.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${center.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${center.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                    <button class="btn btn-sm btn-outline-info view-btn" data-id="${center.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
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
    }

    // Handle view center
    function handleViewCenter(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        
        // In a real app, you might show a modal with more details
        alert(`Viewing Center:\n\nID: ${center.id}\nName: ${center.name}\nLocation: ${center.location}\nCoordinator: ${center.coordinator}\nStatus: ${center.status}`);
    }

    // Handle edit center
    function handleEditCenter(e) {
        const id = parseInt(e.target.closest('button').dataset.id);
        const center = centers.find(c => c.id === id);
        currentEditingId = id;

        // Fill the form with center data
        document.getElementById('centerName').value = center.name;
        document.getElementById('centerLocation').value = center.location;
        
        // Set the coordinator in the dropdown
        const coordinator = coordinators.find(c => c.name === center.coordinator);
        if (coordinator) {
            document.getElementById('centerCoordinator').value = coordinator.id;
        }

        // Change modal title
        document.getElementById('addCenterModalLabel').textContent = 'Edit Center';
        
        // Show the modal
        const modal = new bootstrap.Modal(addCenterModal);
        modal.show();
    }

    // Handle delete center
    function handleDeleteCenter(e) {
        if (confirm('Are you sure you want to delete this center?')) {
            const id = parseInt(e.target.closest('button').dataset.id);
            centers = centers.filter(c => c.id !== id);
            localStorage.setItem('centers', JSON.stringify(centers));
            populateCentersTable();
            alert('Center deleted successfully!');
        }
    }

    // Populate coordinators dropdown
    function populateCoordinatorsDropdown() {
        centerCoordinatorSelect.innerHTML = '<option value="">Select Coordinator</option>';
        coordinators.filter(c => c.role === 'coordinator').forEach(coordinator => {
            const option = document.createElement('option');
            option.value = coordinator.id;
            option.textContent = coordinator.name;
            centerCoordinatorSelect.appendChild(option);
        });
    }

    // Save or update center
    saveCenterBtn.addEventListener('click', function() {
        const centerName = document.getElementById('centerName').value;
        const centerLocation = document.getElementById('centerLocation').value;
        const coordinatorId = document.getElementById('centerCoordinator').value;
        
        if (centerName && centerLocation && coordinatorId) {
            const coordinator = coordinators.find(c => c.id == coordinatorId);
            
            if (currentEditingId) {
                // Update existing center
                const index = centers.findIndex(c => c.id === currentEditingId);
                if (index !== -1) {
                    centers[index] = {
                        ...centers[index],
                        name: centerName,
                        location: centerLocation,
                        coordinator: coordinator.name
                    };
                }
            } else {
                // Add new center
                const newCenter = {
                    id: centers.length > 0 ? Math.max(...centers.map(c => c.id)) + 1 : 1,
                    name: centerName,
                    location: centerLocation,
                    coordinator: coordinator.name,
                    status: 'Active'
                };
                centers.push(newCenter);
            }
            
            localStorage.setItem('centers', JSON.stringify(centers));
            populateCentersTable();
            
            // Reset form and close modal
            addCenterForm.reset();
            bootstrap.Modal.getInstance(addCenterModal).hide();
            currentEditingId = null;
            document.getElementById('addCenterModalLabel').textContent = 'Add New Center';
            
            // Show success message
            alert(`Center ${currentEditingId ? 'updated' : 'added'} successfully!`);
        } else {
            alert('Please fill in all fields');
        }
    });

    // Reset form when modal is closed
    addCenterModal.addEventListener('hidden.bs.modal', function() {
        addCenterForm.reset();
        currentEditingId = null;
        document.getElementById('addCenterModalLabel').textContent = 'Add New Center';
    });

    // Initialize
    populateCentersTable();
    populateCoordinatorsDropdown();
});