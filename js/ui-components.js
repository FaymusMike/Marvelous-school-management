// UI Components - Toast notifications, modals, loading states
const UI = (function() {
    // Toast container
    let toastContainer = null;
    
    function init() {
        // Create toast container if it doesn't exist
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
    }

    // Show toast notification
    function showToast(message, type = 'info', duration = 3000) {
        init();
        
        const toastId = 'toast-' + Date.now();
        const bgColor = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
        toast.show();
        
        // Remove from DOM after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Show loading spinner
    function showLoading(container, message = 'Loading...') {
        const spinnerHtml = `
            <div class="text-center p-4 loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">${message}</p>
            </div>
        `;
        
        if (typeof container === 'string') {
            document.querySelector(container).innerHTML = spinnerHtml;
        } else if (container) {
            container.innerHTML = spinnerHtml;
        }
    }

    // Hide loading spinner
    function hideLoading(container) {
        if (typeof container === 'string') {
            const element = document.querySelector(container);
            if (element && element.querySelector('.loading-spinner')) {
                element.innerHTML = '';
            }
        } else if (container && container.querySelector('.loading-spinner')) {
            container.innerHTML = '';
        }
    }

    // Show confirmation dialog
    function confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            // Check if we're in a modal context
            const modal = document.querySelector('.modal.show');
            
            const modalId = 'confirm-modal-' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary confirm-btn">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const confirmModal = new bootstrap.Modal(document.getElementById(modalId));
            confirmModal.show();
            
            document.getElementById(modalId).addEventListener('click', (e) => {
                if (e.target.classList.contains('confirm-btn')) {
                    confirmModal.hide();
                    setTimeout(() => {
                        document.getElementById(modalId).remove();
                        resolve(true);
                    }, 300);
                }
            });
            
            document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
                resolve(false);
            });
        });
    }

    // Show alert dialog
    function alert(message, title = 'Notice') {
        return new Promise((resolve) => {
            const modalId = 'alert-modal-' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const alertModal = new bootstrap.Modal(document.getElementById(modalId));
            alertModal.show();
            
            document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
                resolve();
            });
        });
    }

    // Format date
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Format time
    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // Initialize tooltips
    function initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Initialize popovers
    function initPopovers() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function(popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }

    // Search and filter table
    function filterTable(tableId, searchTerm, columns = []) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();
        
        Array.from(rows).forEach(row => {
            let match = false;
            const cells = row.getElementsByTagName('td');
            
            if (columns.length === 0) {
                // Search all columns
                match = Array.from(cells).some(cell => 
                    cell.textContent.toLowerCase().includes(term)
                );
            } else {
                // Search specific columns
                columns.forEach(colIndex => {
                    if (cells[colIndex] && cells[colIndex].textContent.toLowerCase().includes(term)) {
                        match = true;
                    }
                });
            }
            
            row.style.display = match ? '' : 'none';
        });
    }

    // Export table to CSV
    function exportTableToCSV(tableId, filename = 'export.csv') {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = [];
        
        // Get headers
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push(th.textContent.trim());
        });
        rows.push(headers.join(','));
        
        // Get data
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach(td => {
                // Remove HTML and clean text
                let text = td.textContent.trim().replace(/,/g, ';');
                row.push(`"${text}"`);
            });
            rows.push(row.join(','));
        });
        
        // Download
        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Print table
    function printTable(tableId, title = 'Report') {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { padding: 20px; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h2 class="mb-4">${title}</h2>
                    <div class="table-responsive">
                        ${table.outerHTML}
                    </div>
                    <p class="text-muted mt-4">Generated on: ${new Date().toLocaleString()}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    // Public API
    return {
        showToast,
        showLoading,
        hideLoading,
        confirm,
        alert,
        formatDate,
        formatTime,
        initTooltips,
        initPopovers,
        filterTable,
        exportTableToCSV,
        printTable
    };
})();

// Make it globally available
window.UI = UI;