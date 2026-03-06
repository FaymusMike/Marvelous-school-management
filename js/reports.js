document.addEventListener('DOMContentLoaded', function() {
    // Sample data - in a real app, this would come from an API
    const lecturerReports = [
        { id: 1, lecturer: 'Dr. Adams', center: 'Main Campus', date: '2023-06-01', content: 'Completed all lectures for the week' },
        { id: 2, lecturer: 'Prof. Baker', center: 'Downtown', date: '2023-06-02', content: 'Issues with classroom equipment' }
    ];

    const coordinatorReports = [
        { id: 1, coordinator: 'John Doe', center: 'Main Campus', date: '2023-06-03', content: 'Monthly center performance report' },
        { id: 2, coordinator: 'Jane Smith', center: 'Downtown', date: '2023-06-04', content: 'Request for additional resources' }
    ];

    const registrarReports = [
        { id: 1, date: '2023-06-05', content: 'Quarterly academic performance summary' },
        { id: 2, date: '2023-06-06', content: 'Budget request for next semester' }
    ];

    const departmentReports = [
        { department: 'Exams and Records', type: 'Exam Results', submittedBy: 'Sarah Williams', date: '2023-06-07', status: 'Reviewed' },
        { department: 'Bursary', type: 'Financial Report', submittedBy: 'David Brown', date: '2023-06-08', status: 'Pending' },
        { department: 'Accounting', type: 'Expense Report', submittedBy: 'Lisa Johnson', date: '2023-06-09', status: 'Approved' }
    ];

    const lecturerCoordinatorReports = document.getElementById('lecturerCoordinatorReports');
    const coordinatorRegistrarReports = document.getElementById('coordinatorRegistrarReports');
    const registrarPresidentReports = document.getElementById('registrarPresidentReports');
    const departmentReportsTable = document.getElementById('departmentReportsTable').getElementsByTagName('tbody')[0];

    // Populate lecturer to coordinator reports
    function populateLecturerCoordinatorReports() {
        lecturerCoordinatorReports.innerHTML = '';
        lecturerReports.forEach(report => {
            const reportElement = document.createElement('div');
            reportElement.className = 'report-item mb-3 p-3 border rounded';
            reportElement.innerHTML = `
                <h6>${report.lecturer} (${report.center})</h6>
                <small class="text-muted">${report.date}</small>
                <p class="mt-2">${report.content}</p>
            `;
            lecturerCoordinatorReports.appendChild(reportElement);
        });
    }

    // Populate coordinator to registrar reports
    function populateCoordinatorRegistrarReports() {
        coordinatorRegistrarReports.innerHTML = '';
        coordinatorReports.forEach(report => {
            const reportElement = document.createElement('div');
            reportElement.className = 'report-item mb-3 p-3 border rounded';
            reportElement.innerHTML = `
                <h6>${report.coordinator} (${report.center})</h6>
                <small class="text-muted">${report.date}</small>
                <p class="mt-2">${report.content}</p>
            `;
            coordinatorRegistrarReports.appendChild(reportElement);
        });
    }

    // Populate registrar to president reports
    function populateRegistrarPresidentReports() {
        registrarPresidentReports.innerHTML = '';
        registrarReports.forEach(report => {
            const reportElement = document.createElement('div');
            reportElement.className = 'report-item mb-3 p-3 border rounded';
            reportElement.innerHTML = `
                <h6>Registrar's Report</h6>
                <small class="text-muted">${report.date}</small>
                <p class="mt-2">${report.content}</p>
            `;
            registrarPresidentReports.appendChild(reportElement);
        });
    }

    // Populate department reports table
    function populateDepartmentReportsTable() {
        departmentReportsTable.innerHTML = '';
        departmentReports.forEach(report => {
            const row = departmentReportsTable.insertRow();
            row.innerHTML = `
                <td>${report.department}</td>
                <td>${report.type}</td>
                <td>${report.submittedBy}</td>
                <td>${report.date}</td>
                <td><span class="badge ${report.status === 'Reviewed' ? 'bg-info' : 
                                       report.status === 'Approved' ? 'bg-success' : 
                                       'bg-warning'}">${report.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-btn">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            `;
        });
    }

    // Initialize
    populateLecturerCoordinatorReports();
    populateCoordinatorRegistrarReports();
    populateRegistrarPresidentReports();
    populateDepartmentReportsTable();
});