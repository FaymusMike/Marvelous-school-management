// Data Service - Single source of truth for all data operations
const DataService = (function() {
    // Storage keys
    const STORAGE_KEYS = {
        STAFF: 'marvelous_staff',
        CENTERS: 'marvelous_centers',
        DEPARTMENTS: 'marvelous_departments',
        REPORTS: 'marvelous_reports',
        ACTIVITY_LOG: 'marvelous_activity_log',
        SETTINGS: 'marvelous_settings'
    };

    // Initialize data if not exists
    function initializeData() {
        // Initialize staff data
        if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([
                { 
                    id: 1, 
                    name: 'John Doe', 
                    roles: ['coordinator'], 
                    email: 'john.doe@school.edu', 
                    phone: '+1234567890', 
                    centers: [1], 
                    departments: [], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 2, 
                    name: 'Jane Smith', 
                    roles: ['coordinator'], 
                    email: 'jane.smith@school.edu', 
                    phone: '+1234567891', 
                    centers: [2], 
                    departments: [], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 3, 
                    name: 'Sarah Williams', 
                    roles: ['department_head'], 
                    email: 'sarah.williams@school.edu', 
                    phone: '+1234567892', 
                    centers: [], 
                    departments: [1], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 4, 
                    name: 'David Brown', 
                    roles: ['department_head'], 
                    email: 'david.brown@school.edu', 
                    phone: '+1234567893', 
                    centers: [], 
                    departments: [2], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 5, 
                    name: 'Dr. Adams', 
                    roles: ['lecturer'], 
                    email: 'dr.adams@school.edu', 
                    phone: '+1234567894', 
                    centers: [1], 
                    departments: [1], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 6, 
                    name: 'Prof. Baker', 
                    roles: ['lecturer'], 
                    email: 'prof.baker@school.edu', 
                    phone: '+1234567895', 
                    centers: [2], 
                    departments: [2], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                { 
                    id: 7, 
                    name: 'Mike Johnson', 
                    roles: ['coordinator', 'lecturer'], 
                    email: 'mike.johnson@school.edu', 
                    phone: '+1234567896', 
                    centers: [3], 
                    departments: [3], 
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]));
        }

        // Initialize centers data
        if (!localStorage.getItem(STORAGE_KEYS.CENTERS)) {
            localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify([
                { id: 1, name: 'Main Campus Center', location: 'Building A, Main Campus', coordinatorId: 1, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 2, name: 'Downtown Center', location: '123 Downtown St', coordinatorId: 2, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 3, name: 'Northside Center', location: '456 North Ave', coordinatorId: 7, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ]));
        }

        // Initialize departments data
        if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify([
                { id: 1, name: 'Exams and Records', headId: 3, reportingTo: 'registrar', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 2, name: 'Bursary', headId: 4, reportingTo: 'registrar', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 3, name: 'Accounting', headId: null, reportingTo: 'registrar', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 4, name: 'Certificate Department', headId: null, reportingTo: 'registrar', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: 5, name: 'Clearance Department', headId: null, reportingTo: 'registrar', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ]));
        }

        // Initialize reports data
        if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
            generateSampleReports();
        }

        // Initialize activity log
        if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify([]));
        }

        // Initialize settings
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                schoolName: 'Marvelous School',
                emailNotifications: true,
                dateFormat: 'YYYY-MM-DD',
                itemsPerPage: 10
            }));
        }
    }

    // Generate sample reports from actual data
    function generateSampleReports() {
        const staff = getStaff();
        const centers = getCenters();
        const departments = getDepartments();
        
        const reports = [];
        
        // Generate lecturer reports
        staff.filter(s => s.roles.includes('lecturer')).forEach(lecturer => {
            for (let i = 0; i < 2; i++) {
                reports.push({
                    id: reports.length + 1,
                    type: 'lecturer_to_coordinator',
                    fromId: lecturer.id,
                    fromName: lecturer.name,
                    toId: lecturer.centers[0] ? getCenterCoordinatorId(lecturer.centers[0]) : null,
                    centerId: lecturer.centers[0],
                    departmentId: lecturer.departments[0],
                    content: `Weekly lecture progress report - Week ${i + 1}`,
                    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                    status: 'submitted'
                });
            }
        });

        // Generate coordinator reports
        staff.filter(s => s.roles.includes('coordinator')).forEach(coordinator => {
            for (let i = 0; i < 2; i++) {
                reports.push({
                    id: reports.length + 1,
                    type: 'coordinator_to_registrar',
                    fromId: coordinator.id,
                    fromName: coordinator.name,
                    toId: 'registrar',
                    centerId: coordinator.centers[0],
                    content: `Monthly center performance report - Month ${i + 1}`,
                    date: new Date(Date.now() - i * 86400000 * 7).toISOString().split('T')[0],
                    status: i === 0 ? 'pending' : 'reviewed'
                });
            }
        });

        // Generate registrar reports
        for (let i = 0; i < 2; i++) {
            reports.push({
                id: reports.length + 1,
                type: 'registrar_to_president',
                fromId: 'registrar',
                fromName: 'Registrar',
                toId: 'president',
                content: `Quarterly academic performance summary - Q${i + 1}`,
                date: new Date(Date.now() - i * 86400000 * 30).toISOString().split('T')[0],
                status: i === 0 ? 'pending' : 'approved'
            });
        }

        // Generate department reports
        departments.forEach(dept => {
            reports.push({
                id: reports.length + 1,
                type: 'department_report',
                departmentId: dept.id,
                departmentName: dept.name,
                submittedBy: dept.headId ? getStaffById(dept.headId)?.name : 'Unassigned',
                reportType: 'Monthly Summary',
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            });
        });

        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }

    // Helper function to get coordinator for a center
    function getCenterCoordinatorId(centerId) {
        const center = getCenters().find(c => c.id === centerId);
        return center ? center.coordinatorId : null;
    }

    // CRUD Operations with validation and activity logging

    // Staff operations
    function getStaff() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
        } catch (e) {
            console.error('Error parsing staff data:', e);
            return [];
        }
    }

    function getStaffById(id) {
        return getStaff().find(s => s.id === id);
    }

    function saveStaff(staffData) {
        try {
            const staff = getStaff();
            const existingIndex = staff.findIndex(s => s.id === staffData.id);
            
            if (existingIndex >= 0) {
                // Update existing
                staff[existingIndex] = { ...staff[existingIndex], ...staffData, updatedAt: new Date().toISOString() };
            } else {
                // Add new
                staffData.id = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
                staffData.createdAt = new Date().toISOString();
                staffData.updatedAt = new Date().toISOString();
                staffData.status = staffData.status || 'Active';
                staff.push(staffData);
            }
            
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
            logActivity('staff', existingIndex >= 0 ? 'update' : 'create', staffData.id, `${staffData.name} - ${existingIndex >= 0 ? 'updated' : 'added'}`);
            return { success: true, data: staffData, staff: staff };
        } catch (e) {
            console.error('Error saving staff:', e);
            return { success: false, error: e.message };
        }
    }

    function deleteStaff(id) {
        try {
            // Check if staff is assigned as center coordinator
            const centers = getCenters();
            const assignedAsCoordinator = centers.some(c => c.coordinatorId === id);
            
            // Check if staff is assigned as department head
            const departments = getDepartments();
            const assignedAsHead = departments.some(d => d.headId === id);
            
            if (assignedAsCoordinator || assignedAsHead) {
                return { 
                    success: false, 
                    error: 'Cannot delete staff member assigned as center coordinator or department head. Please reassign first.' 
                };
            }

            const staff = getStaff();
            const staffMember = staff.find(s => s.id === id);
            const filtered = staff.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(filtered));
            
            if (staffMember) {
                logActivity('staff', 'delete', id, `${staffMember.name} - deleted`);
            }
            
            return { success: true };
        } catch (e) {
            console.error('Error deleting staff:', e);
            return { success: false, error: e.message };
        }
    }

    // Centers operations
    function getCenters() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CENTERS)) || [];
        } catch (e) {
            console.error('Error parsing centers data:', e);
            return [];
        }
    }

    function getCenterById(id) {
        return getCenters().find(c => c.id === id);
    }

    function saveCenter(centerData) {
        try {
            const centers = getCenters();
            const existingIndex = centers.findIndex(c => c.id === centerData.id);
            
            // Validate coordinator exists and has coordinator role
            if (centerData.coordinatorId) {
                const coordinator = getStaffById(centerData.coordinatorId);
                if (!coordinator || !coordinator.roles.includes('coordinator')) {
                    return { success: false, error: 'Selected coordinator is not valid or does not have coordinator role' };
                }
            }
            
            if (existingIndex >= 0) {
                // Update existing
                centers[existingIndex] = { ...centers[existingIndex], ...centerData, updatedAt: new Date().toISOString() };
            } else {
                // Add new
                centerData.id = centers.length > 0 ? Math.max(...centers.map(c => c.id)) + 1 : 1;
                centerData.createdAt = new Date().toISOString();
                centerData.updatedAt = new Date().toISOString();
                centerData.status = centerData.status || 'Active';
                centers.push(centerData);
            }
            
            localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(centers));
            logActivity('center', existingIndex >= 0 ? 'update' : 'create', centerData.id, `${centerData.name} - ${existingIndex >= 0 ? 'updated' : 'added'}`);
            
            // Update staff assignments if coordinator changed
            if (centerData.coordinatorId) {
                updateStaffCenterAssignments(centerData.id, centerData.coordinatorId);
            }
            
            return { success: true, data: centerData };
        } catch (e) {
            console.error('Error saving center:', e);
            return { success: false, error: e.message };
        }
    }

    function deleteCenter(id) {
        try {
            const centers = getCenters();
            const center = centers.find(c => c.id === id);
            
            // Check if center has staff assigned
            const staff = getStaff();
            const assignedStaff = staff.some(s => s.centers && s.centers.includes(id));
            
            if (assignedStaff) {
                return { 
                    success: false, 
                    error: 'Cannot delete center with assigned staff. Please reassign staff first.' 
                };
            }

            const filtered = centers.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(filtered));
            
            if (center) {
                logActivity('center', 'delete', id, `${center.name} - deleted`);
            }
            
            return { success: true };
        } catch (e) {
            console.error('Error deleting center:', e);
            return { success: false, error: e.message };
        }
    }

    // Departments operations
    function getDepartments() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) || [];
        } catch (e) {
            console.error('Error parsing departments data:', e);
            return [];
        }
    }

    function getDepartmentById(id) {
        return getDepartments().find(d => d.id === id);
    }

    function saveDepartment(deptData) {
        try {
            const departments = getDepartments();
            const existingIndex = departments.findIndex(d => d.id === deptData.id);
            
            // Validate department head exists and has department_head role
            if (deptData.headId) {
                const head = getStaffById(deptData.headId);
                if (!head || !head.roles.includes('department_head')) {
                    return { success: false, error: 'Selected department head is not valid or does not have department head role' };
                }
            }
            
            if (existingIndex >= 0) {
                // Update existing
                departments[existingIndex] = { ...departments[existingIndex], ...deptData, updatedAt: new Date().toISOString() };
            } else {
                // Add new
                deptData.id = departments.length > 0 ? Math.max(...departments.map(d => d.id)) + 1 : 1;
                deptData.createdAt = new Date().toISOString();
                deptData.updatedAt = new Date().toISOString();
                deptData.status = deptData.status || 'Active';
                departments.push(deptData);
            }
            
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
            logActivity('department', existingIndex >= 0 ? 'update' : 'create', deptData.id, `${deptData.name} - ${existingIndex >= 0 ? 'updated' : 'added'}`);
            
            // Update staff assignments if head changed
            if (deptData.headId) {
                updateStaffDepartmentAssignments(deptData.id, deptData.headId);
            }
            
            return { success: true, data: deptData };
        } catch (e) {
            console.error('Error saving department:', e);
            return { success: false, error: e.message };
        }
    }

    function deleteDepartment(id) {
        try {
            const departments = getDepartments();
            const dept = departments.find(d => d.id === id);
            
            // Check if department has staff assigned
            const staff = getStaff();
            const assignedStaff = staff.some(s => s.departments && s.departments.includes(id));
            
            if (assignedStaff) {
                return { 
                    success: false, 
                    error: 'Cannot delete department with assigned staff. Please reassign staff first.' 
                };
            }

            const filtered = departments.filter(d => d.id !== id);
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(filtered));
            
            if (dept) {
                logActivity('department', 'delete', id, `${dept.name} - deleted`);
            }
            
            return { success: true };
        } catch (e) {
            console.error('Error deleting department:', e);
            return { success: false, error: e.message };
        }
    }

    // Reports operations
    function getReports(filters = {}) {
        try {
            let reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
            
            if (filters.type) {
                reports = reports.filter(r => r.type === filters.type);
            }
            if (filters.status) {
                reports = reports.filter(r => r.status === filters.status);
            }
            if (filters.fromId) {
                reports = reports.filter(r => r.fromId === filters.fromId);
            }
            if (filters.startDate && filters.endDate) {
                reports = reports.filter(r => r.date >= filters.startDate && r.date <= filters.endDate);
            }
            
            return reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            console.error('Error parsing reports:', e);
            return [];
        }
    }

    function addReport(reportData) {
        try {
            const reports = getReports();
            reportData.id = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
            reportData.date = new Date().toISOString().split('T')[0];
            reports.push(reportData);
            localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
            logActivity('report', 'create', reportData.id, `New report added - ${reportData.type}`);
            return { success: true, data: reportData };
        } catch (e) {
            console.error('Error adding report:', e);
            return { success: false, error: e.message };
        }
    }

    function updateReportStatus(id, status) {
        try {
            const reports = getReports();
            const index = reports.findIndex(r => r.id === id);
            if (index >= 0) {
                reports[index].status = status;
                localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
                logActivity('report', 'update', id, `Report status updated to ${status}`);
                return { success: true, data: reports[index] };
            }
            return { success: false, error: 'Report not found' };
        } catch (e) {
            console.error('Error updating report:', e);
            return { success: false, error: e.message };
        }
    }

    // Activity logging
    function logActivity(entity, action, entityId, description) {
        try {
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) || [];
            logs.push({
                id: logs.length + 1,
                entity,
                action,
                entityId,
                description,
                user: localStorage.getItem('currentUser') || 'system',
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.shift();
            }
            
            localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
        } catch (e) {
            console.error('Error logging activity:', e);
        }
    }

    function getActivityLogs(limit = 50) {
        try {
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) || [];
            return logs.slice(-limit).reverse();
        } catch (e) {
            console.error('Error getting activity logs:', e);
            return [];
        }
    }

    // Helper functions for staff assignments
    function updateStaffCenterAssignments(centerId, coordinatorId) {
        const staff = getStaff();
        let updated = false;
        
        staff.forEach(member => {
            // Remove this center from previous coordinator's centers
            if (member.centers && member.centers.includes(centerId) && member.id !== coordinatorId) {
                member.centers = member.centers.filter(id => id !== centerId);
                updated = true;
            }
            
            // Add center to new coordinator if not already assigned
            if (member.id === coordinatorId && (!member.centers || !member.centers.includes(centerId))) {
                if (!member.centers) member.centers = [];
                member.centers.push(centerId);
                updated = true;
            }
        });
        
        if (updated) {
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
        }
    }

    function updateStaffDepartmentAssignments(deptId, headId) {
        const staff = getStaff();
        let updated = false;
        
        staff.forEach(member => {
            // Remove this department from previous head's departments
            if (member.departments && member.departments.includes(deptId) && member.id !== headId) {
                member.departments = member.departments.filter(id => id !== deptId);
                updated = true;
            }
            
            // Add department to new head if not already assigned
            if (member.id === headId && (!member.departments || !member.departments.includes(deptId))) {
                if (!member.departments) member.departments = [];
                member.departments.push(deptId);
                updated = true;
            }
        });
        
        if (updated) {
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
        }
    }

    // Validation functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
        return re.test(phone);
    }

    function validateRequired(value) {
        return value && value.trim() !== '';
    }

    // Statistics for dashboard
    function getStatistics() {
        const staff = getStaff();
        const centers = getCenters();
        const departments = getDepartments();
        const reports = getReports();
        
        return {
            totalStaff: staff.length,
            activeStaff: staff.filter(s => s.status === 'Active').length,
            totalCenters: centers.length,
            activeCenters: centers.filter(c => c.status === 'Active').length,
            totalDepartments: departments.length,
            activeDepartments: departments.filter(d => d.status === 'Active').length,
            totalReports: reports.length,
            pendingReports: reports.filter(r => r.status === 'pending').length,
            staffByRole: {
                coordinators: staff.filter(s => s.roles.includes('coordinator')).length,
                departmentHeads: staff.filter(s => s.roles.includes('department_head')).length,
                lecturers: staff.filter(s => s.roles.includes('lecturer')).length,
                registrar: staff.filter(s => s.roles.includes('registrar')).length,
                president: staff.filter(s => s.roles.includes('president')).length
            }
        };
    }

    // Initialize on creation
    initializeData();

    // Public API
    return {
        // Staff operations
        getStaff,
        getStaffById,
        saveStaff,
        deleteStaff,
        
        // Centers operations
        getCenters,
        getCenterById,
        saveCenter,
        deleteCenter,
        
        // Departments operations
        getDepartments,
        getDepartmentById,
        saveDepartment,
        deleteDepartment,
        
        // Reports operations
        getReports,
        addReport,
        updateReportStatus,
        
        // Activity logs
        getActivityLogs,
        
        // Statistics
        getStatistics,
        
        // Validation
        validateEmail,
        validatePhone,
        validateRequired,
        
        // Helper
        getCenterCoordinatorId,
        
        // Reinitialize reports (for admin use)
        regenerateReports: generateSampleReports
    };
})();

// Make it globally available
window.DataService = DataService;