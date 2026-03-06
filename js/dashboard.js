document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize data
    let refreshInterval = null;
    let charts = {};

    // Initialize dashboard
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();

    function initializeDashboard() {
        updateWelcomeMessage();
        loadStatistics();
        loadActivityLog();
        loadQuickActions();
        loadPendingReports();
        loadNotifications();
        loadUpcomingEvents();
        loadPerformanceMetrics();
        initializeCharts();
        loadRecentItems();
        setupDragAndDrop();
        loadWidgetSettings();
    }

    function setupEventListeners() {
        // Refresh activity
        document.getElementById('refreshActivity')?.addEventListener('click', () => {
            UI.showToast('Refreshing activity log...', 'info');
            loadActivityLog();
        });

        // Toggle sidebar
        document.getElementById('sidebarCollapse')?.addEventListener('click', toggleSidebar);

        // Date range selector
        document.getElementById('dateRange')?.addEventListener('change', function(e) {
            loadStatistics(e.target.value);
            updateCharts(e.target.value);
        });

        // Export dashboard
        document.getElementById('exportDashboard')?.addEventListener('click', exportDashboard);

        // Print dashboard
        document.getElementById('printDashboard')?.addEventListener('click', () => {
            window.print();
        });

        // Widget toggles
        document.querySelectorAll('.widget-toggle').forEach(toggle => {
            toggle.addEventListener('change', saveWidgetSettings);
        });

        // Search functionality
        document.getElementById('dashboardSearch')?.addEventListener('input', debounce(function(e) {
            searchDashboard(e.target.value);
        }, 300));

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Window resize
        window.addEventListener('resize', debounce(handleResize, 250));
    }

    // Enhanced welcome message with dynamic content
    function updateWelcomeMessage() {
        const welcomeEl = document.getElementById('welcomeMessage');
        const roleEl = document.getElementById('roleMessage');
        const dateEl = document.getElementById('currentDate');
        const weatherEl = document.getElementById('weatherInfo');
        
        if (welcomeEl && roleEl) {
            const hour = new Date().getHours();
            let greeting = 'Good ';
            if (hour < 12) greeting += 'Morning';
            else if (hour < 17) greeting += 'Afternoon';
            else greeting += 'Evening';
            
            // Add motivational quote based on time/role
            const quotes = getMotivationalQuotes(currentUser.role);
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            
            welcomeEl.innerHTML = `
                ${greeting}, <span class="text-primary">${currentUser.name}</span>!
                <small class="d-block text-muted mt-1">${randomQuote}</small>
            `;
            
            // Role-specific message with actionable items
            if (roleEl) {
                const roleInfo = getRoleInfo(currentUser.role);
                roleEl.innerHTML = `
                    <i class="bi bi-${roleInfo.icon} me-2"></i>
                    ${roleInfo.message}
                    ${roleInfo.action ? 
                        `<a href="${roleInfo.action.url}" class="ms-2 text-decoration-none">
                            <i class="bi bi-arrow-right-circle"></i> ${roleInfo.action.text}
                        </a>` : ''}
                `;
            }
        }

        // Update date
        if (dateEl) {
            dateEl.innerHTML = `
                <i class="bi bi-calendar3 me-2"></i>
                ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            `;
        }

        // Simulate weather (in real app, would use API)
        if (weatherEl) {
            const weather = getSimulatedWeather();
            weatherEl.innerHTML = `
                <i class="bi bi-${weather.icon} me-2"></i>
                ${weather.temp}°C, ${weather.condition}
            `;
        }
    }

    // Enhanced statistics loading with trends and comparisons
    function loadStatistics(timeframe = 'week') {
        const statsContainer = document.getElementById('statsCards');
        if (!statsContainer) return;
        
        UI.showLoading(statsContainer);
        
        setTimeout(() => {
            const stats = DataService.getStatistics(timeframe);
            const trends = DataService.getTrends(timeframe);
            
            // Generate stats based on user role
            const visibleStats = getRoleBasedStats(currentUser.role, stats, trends);
            
            statsContainer.innerHTML = visibleStats.map(stat => `
                <div class="col-md-3 mb-3">
                    <div class="card h-100 border-0 shadow-sm stat-card" data-stat="${stat.key}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="card-title text-muted mb-2">
                                        <i class="bi bi-${stat.icon} me-2"></i>${stat.label}
                                    </h6>
                                    <h3 class="mb-0">${stat.value}</h3>
                                    ${stat.trend ? `
                                        <small class="text-${stat.trend > 0 ? 'success' : 'danger'}">
                                            <i class="bi bi-arrow-${stat.trend > 0 ? 'up' : 'down'}"></i>
                                            ${Math.abs(stat.trend)}% from last ${timeframe}
                                        </small>
                                    ` : ''}
                                </div>
                                <div class="stat-icon">
                                    <i class="bi bi-${stat.icon} fs-1 text-${stat.color} opacity-25"></i>
                                </div>
                            </div>
                            <div class="mt-3 progress" style="height: 4px;">
                                <div class="progress-bar bg-${stat.color}" 
                                     style="width: ${stat.progress || 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers for stats
            document.querySelectorAll('.stat-card').forEach(card => {
                card.addEventListener('click', () => {
                    const stat = card.dataset.stat;
                    showStatDetails(stat);
                });
            });
            
            UI.hideLoading(statsContainer);
        }, 500);
    }

    // Enhanced activity log with infinite scroll
    function loadActivityLog(offset = 0, limit = 10) {
        const logContainer = document.getElementById('activityLog');
        if (!logContainer) return;
        
        if (offset === 0) {
            UI.showLoading(logContainer);
        }
        
        setTimeout(() => {
            const logs = DataService.getActivityLogs(offset, limit);
            const hasMore = logs.length === limit;
            
            if (offset === 0) {
                logContainer.innerHTML = '';
            }
            
            if (logs.length === 0 && offset === 0) {
                logContainer.innerHTML = getEmptyActivityHTML();
                return;
            }
            
            logs.forEach(log => {
                const logItem = createActivityItem(log);
                logContainer.appendChild(logItem);
            });
            
            // Add load more button if needed
            if (hasMore) {
                addLoadMoreButton(logContainer, offset + limit);
            }
            
            UI.hideLoading(logContainer);
        }, 500);
    }

    function createActivityItem(log) {
        const div = document.createElement('div');
        div.className = 'activity-item d-flex align-items-start mb-3 p-2 rounded hover-bg-light';
        div.innerHTML = `
            <div class="activity-icon me-3">
                <span class="badge rounded-circle p-2 bg-${getActivityColor(log.action)}-subtle">
                    <i class="bi bi-${getActivityIcon(log.action)} text-${getActivityColor(log.action)}"></i>
                </span>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between">
                    <strong>${log.description}</strong>
                    <small class="text-muted time-ago" data-time="${log.timestamp}">
                        ${formatTimeAgo(log.timestamp)}
                    </small>
                </div>
                <small class="text-muted d-flex align-items-center">
                    <i class="bi bi-person me-1"></i> ${log.user}
                    <span class="mx-2">•</span>
                    <i class="bi bi-geo-alt me-1"></i> ${log.location || 'System'}
                </small>
                ${log.details ? `<small class="d-block text-muted mt-1">${log.details}</small>` : ''}
            </div>
        `;
        return div;
    }

    // Enhanced quick actions with favorites
    function loadQuickActions() {
        const actionsContainer = document.getElementById('quickActions');
        if (!actionsContainer) return;
        
        // Get favorite actions from localStorage
        const favorites = JSON.parse(localStorage.getItem('favoriteActions')) || [];
        
        let actions = getRoleBasedActions(currentUser.role);
        
        // Mark favorites
        actions = actions.map(action => ({
            ...action,
            favorite: favorites.includes(action.action)
        }));
        
        // Separate favorites and others
        const favoriteActions = actions.filter(a => a.favorite);
        const otherActions = actions.filter(a => !a.favorite);
        
        actionsContainer.innerHTML = `
            <div class="mb-3">
                <small class="text-muted">
                    <i class="bi bi-star-fill text-warning me-1"></i> Favorites
                </small>
                <div class="d-grid gap-2 mt-1">
                    ${favoriteActions.map(action => createQuickActionButton(action)).join('')}
                </div>
            </div>
            <div>
                <small class="text-muted">
                    <i class="bi bi-grid me-1"></i> All Actions
                </small>
                <div class="d-grid gap-2 mt-1">
                    ${otherActions.map(action => createQuickActionButton(action)).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', handleQuickAction);
        });
        
        document.querySelectorAll('.favorite-toggle').forEach(btn => {
            btn.addEventListener('click', toggleFavorite);
        });
    }

    function createQuickActionButton(action) {
        return `
            <div class="quick-action-wrapper position-relative">
                <button class="btn btn-outline-primary text-start w-100 quick-action-btn" 
                        data-action="${action.action}"
                        data-url="${action.url || ''}"
                        data-modal="${action.modal || false}">
                    <i class="bi bi-${action.icon} me-2"></i> ${action.label}
                    ${action.badge ? `<span class="badge bg-${action.badge.color} ms-2">${action.badge.text}</span>` : ''}
                </button>
                <button class="btn btn-sm favorite-toggle position-absolute top-0 end-0"
                        data-action="${action.action}"
                        title="${action.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="bi bi-star${action.favorite ? '-fill text-warning' : ''}"></i>
                </button>
            </div>
        `;
    }

    // Enhanced pending reports with priorities
    function loadPendingReports() {
        const reportsContainer = document.getElementById('pendingReportsList');
        if (!reportsContainer) return;
        
        const reports = DataService.getReports({ 
            status: ['pending', 'submitted'],
            assignedTo: currentUser.id 
        }).slice(0, 5);
        
        if (reports.length === 0) {
            reportsContainer.innerHTML = getEmptyReportsHTML();
            return;
        }
        
        reportsContainer.innerHTML = reports.map(report => `
            <div class="pending-report-item d-flex justify-content-between align-items-center p-2 mb-2 rounded border-start border-${getPriorityColor(report.priority)}" 
                 data-id="${report.id}">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-${getPriorityBadge(report.priority)} me-2">
                            ${report.priority || 'normal'}
                        </span>
                        <strong>${report.fromName}</strong>
                        ${report.isUrgent ? '<span class="badge bg-danger ms-2">URGENT</span>' : ''}
                    </div>
                    <small class="text-muted d-block">
                        ${report.type.replace(/_/g, ' ')}
                    </small>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i> ${formatTimeAgo(report.date)}
                        ${report.deadline ? ` | Due: ${UI.formatDate(report.deadline)}` : ''}
                    </small>
                </div>
                <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.pending-report-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const id = this.dataset.id;
                    viewReportDetails(id);
                }
            });
        });
        
        document.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewReportDetails(btn.dataset.id);
            });
        });
    }

    // New: Load notifications
    function loadNotifications() {
        const notificationsContainer = document.getElementById('notificationsList');
        if (!notificationsContainer) return;
        
        const notifications = DataService.getNotifications(currentUser.id);
        
        if (notifications.length === 0) {
            notificationsContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-bell-slash fs-1"></i>
                    <p class="mt-2">No new notifications</p>
                </div>
            `;
            return;
        }
        
        notificationsContainer.innerHTML = notifications.map(notification => `
            <div class="notification-item p-2 mb-2 rounded ${notification.read ? '' : 'bg-light'}" 
                 data-id="${notification.id}">
                <div class="d-flex">
                    <div class="me-2">
                        <span class="badge rounded-circle p-2 bg-${notification.type}">
                            <i class="bi bi-${getNotificationIcon(notification.type)} text-white"></i>
                        </span>
                    </div>
                    <div class="flex-grow-1">
                        <strong>${notification.title}</strong>
                        <p class="small mb-1">${notification.message}</p>
                        <small class="text-muted">${formatTimeAgo(notification.timestamp)}</small>
                    </div>
                    ${!notification.read ? '<span class="badge bg-primary ms-2">New</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    // New: Load upcoming events
    function loadUpcomingEvents() {
        const eventsContainer = document.getElementById('upcomingEvents');
        if (!eventsContainer) return;
        
        const events = DataService.getUpcomingEvents(currentUser.id);
        
        if (events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-calendar-x fs-1"></i>
                    <p class="mt-2">No upcoming events</p>
                </div>
            `;
            return;
        }
        
        eventsContainer.innerHTML = events.map(event => `
            <div class="event-item d-flex align-items-center p-2 mb-2 rounded border">
                <div class="event-date text-center me-3 p-2 bg-light rounded">
                    <div class="small text-muted">${new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div class="h5 mb-0">${new Date(event.date).getDate()}</div>
                </div>
                <div class="flex-grow-1">
                    <strong>${event.title}</strong>
                    <small class="d-block text-muted">
                        <i class="bi bi-clock me-1"></i>${event.time}
                        ${event.location ? ` | <i class="bi bi-geo-alt me-1"></i>${event.location}` : ''}
                    </small>
                </div>
            </div>
        `).join('');
    }

    // New: Load performance metrics
    function loadPerformanceMetrics() {
        const metricsContainer = document.getElementById('performanceMetrics');
        if (!metricsContainer) return;
        
        const metrics = DataService.getPerformanceMetrics(currentUser.id);
        
        metricsContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-6">
                    <div class="metric-card p-2 border rounded text-center">
                        <h4 class="mb-0 text-primary">${metrics.completionRate}%</h4>
                        <small class="text-muted">Task Completion</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="metric-card p-2 border rounded text-center">
                        <h4 class="mb-0 text-success">${metrics.responseTime}h</h4>
                        <small class="text-muted">Avg Response</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="metric-card p-2 border rounded text-center">
                        <h4 class="mb-0 text-info">${metrics.reportsSubmitted}</h4>
                        <small class="text-muted">Reports</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="metric-card p-2 border rounded text-center">
                        <h4 class="mb-0 text-warning">${metrics.meetingsAttended}</h4>
                        <small class="text-muted">Meetings</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Enhanced charts with real data
    function initializeCharts() {
        // Activity Chart with real data
        const activityCtx = document.getElementById('activityChart')?.getContext('2d');
        if (activityCtx) {
            const activityData = DataService.getWeeklyActivity();
            
            if (charts.activity) charts.activity.destroy();
            
            charts.activity = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: activityData.labels,
                    datasets: [
                        {
                            label: 'Activities',
                            data: activityData.values,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Average',
                            data: activityData.averages,
                            borderColor: '#95a5a6',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: getChartOptions('activity')
            });
        }

        // Staff Distribution Chart with real data
        const stats = DataService.getStatistics();
        const staffCtx = document.getElementById('staffChart')?.getContext('2d');
        if (staffCtx) {
            if (charts.staff) charts.staff.destroy();
            
            charts.staff = new Chart(staffCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Coordinators', 'Department Heads', 'Lecturers', 'Registrar', 'President'],
                    datasets: [{
                        data: [
                            stats.staffByRole.coordinators,
                            stats.staffByRole.departmentHeads,
                            stats.staffByRole.lecturers,
                            stats.staffByRole.registrar,
                            stats.staffByRole.president
                        ],
                        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c'],
                        borderWidth: 0
                    }]
                },
                options: getChartOptions('doughnut')
            });
        }

        // Add trend chart
        const trendCtx = document.getElementById('trendChart')?.getContext('2d');
        if (trendCtx) {
            const trendData = DataService.getTrendData();
            
            if (charts.trend) charts.trend.destroy();
            
            charts.trend = new Chart(trendCtx, {
                type: 'bar',
                data: {
                    labels: trendData.labels,
                    datasets: [
                        {
                            label: 'Reports',
                            data: trendData.reports,
                            backgroundColor: '#3498db'
                        },
                        {
                            label: 'Staff Changes',
                            data: trendData.staffChanges,
                            backgroundColor: '#2ecc71'
                        }
                    ]
                },
                options: getChartOptions('bar')
            });
        }
    }

    // New: Load recent items
    function loadRecentItems() {
        const recentContainer = document.getElementById('recentItems');
        if (!recentContainer) return;
        
        const recent = DataService.getRecentItems(currentUser.id);
        
        recentContainer.innerHTML = recent.map(item => `
            <div class="recent-item d-flex align-items-center p-2 mb-1 rounded" data-type="${item.type}" data-id="${item.id}">
                <i class="bi bi-${getItemIcon(item.type)} me-2 text-${getItemColor(item.type)}"></i>
                <div class="flex-grow-1">
                    <span>${item.name}</span>
                    <small class="text-muted d-block">${item.details}</small>
                </div>
                <small class="text-muted time-ago" data-time="${item.timestamp}">
                    ${formatTimeAgo(item.timestamp)}
                </small>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', function() {
                const type = this.dataset.type;
                const id = this.dataset.id;
                navigateToItem(type, id);
            });
        });
    }

    // Setup drag-and-drop for widgets
    function setupDragAndDrop() {
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach(widget => {
            widget.setAttribute('draggable', true);
            
            widget.addEventListener('dragstart', handleDragStart);
            widget.addEventListener('dragover', handleDragOver);
            widget.addEventListener('drop', handleDrop);
            widget.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.target.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const draggable = document.getElementById(id);
        const dropzone = e.target.closest('.widget');
        
        if (dropzone && draggable && draggable !== dropzone) {
            const parent = dropzone.parentNode;
            parent.insertBefore(draggable, dropzone.nextSibling);
            saveWidgetOrder();
        }
        
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    // Save widget settings
    function saveWidgetSettings() {
        const settings = {};
        document.querySelectorAll('.widget-toggle').forEach(toggle => {
            settings[toggle.dataset.widget] = toggle.checked;
        });
        localStorage.setItem('widgetSettings', JSON.stringify(settings));
    }

    function loadWidgetSettings() {
        const settings = JSON.parse(localStorage.getItem('widgetSettings')) || {};
        Object.keys(settings).forEach(widget => {
            const toggle = document.querySelector(`.widget-toggle[data-widget="${widget}"]`);
            const widgetEl = document.getElementById(`${widget}Widget`);
            if (toggle && widgetEl) {
                toggle.checked = settings[widget];
                widgetEl.style.display = settings[widget] ? 'block' : 'none';
            }
        });
    }

    // Save widget order
    function saveWidgetOrder() {
        const widgets = [];
        document.querySelectorAll('.widget').forEach(widget => {
            widgets.push(widget.id);
        });
        localStorage.setItem('widgetOrder', JSON.stringify(widgets));
    }

    // Export dashboard
    function exportDashboard() {
        const dashboardData = {
            exportedAt: new Date().toISOString(),
            user: currentUser,
            statistics: DataService.getStatistics(),
            recentActivity: DataService.getActivityLogs(0, 20),
            charts: {
                activity: charts.activity?.data,
                staff: charts.staff?.data
            }
        };
        
        const dataStr = JSON.stringify(dashboardData, null, 2);
        downloadFile(dataStr, `dashboard_export_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
        
        UI.showToast('Dashboard exported successfully', 'success');
    }

    // Search dashboard
    function searchDashboard(query) {
        if (!query) {
            document.querySelectorAll('.searchable').forEach(el => {
                el.style.display = '';
            });
            return;
        }
        
        const searchable = document.querySelectorAll('.searchable');
        searchable.forEach(el => {
            const text = el.textContent.toLowerCase();
            el.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    // Auto-refresh
    function startAutoRefresh() {
        const refreshInterval = parseInt(localStorage.getItem('refreshInterval')) || 60;
        setInterval(() => {
            if (document.getElementById('autoRefresh')?.checked) {
                refreshDashboard();
            }
        }, refreshInterval * 1000);
    }

    function refreshDashboard() {
        loadStatistics();
        loadActivityLog();
        loadPendingReports();
        loadNotifications();
        updateCharts();
        UI.showToast('Dashboard refreshed', 'success', 1000);
    }

    // Update charts with new data
    function updateCharts(timeframe = 'week') {
        if (charts.activity) {
            const activityData = DataService.getWeeklyActivity(timeframe);
            charts.activity.data.labels = activityData.labels;
            charts.activity.data.datasets[0].data = activityData.values;
            charts.activity.update();
        }
        
        if (charts.trend) {
            const trendData = DataService.getTrendData(timeframe);
            charts.trend.data.labels = trendData.labels;
            charts.trend.data.datasets[0].data = trendData.reports;
            charts.trend.data.datasets[1].data = trendData.staffChanges;
            charts.trend.update();
        }
    }

    // Show stat details
    function showStatDetails(statKey) {
        const details = DataService.getStatDetails(statKey);
        
        UI.alert(`
            <h6>${details.label} Details</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    ${details.rows.map(row => `
                        <tr>
                            <td>${row.label}</td>
                            <td class="text-end"><strong>${row.value}</strong></td>
                            <td>
                                <span class="badge bg-${row.trend > 0 ? 'success' : 'danger'}">
                                    ${row.trend > 0 ? '+' : ''}${row.trend}%
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `, `${details.label} Statistics`, 'lg');
    }

    // Helper functions
    function getRoleBasedStats(role, stats, trends) {
        const baseStats = {
            president: [
                { key: 'staff', icon: 'people', label: 'Total Staff', value: stats.totalStaff, trend: trends.staff, color: 'primary', progress: 100 },
                { key: 'centers', icon: 'building', label: 'Centers', value: stats.totalCenters, trend: trends.centers, color: 'success', progress: 85 },
                { key: 'departments', icon: 'diagram-3', label: 'Departments', value: stats.totalDepartments, trend: trends.departments, color: 'info', progress: 90 },
                { key: 'reports', icon: 'file-text', label: 'Reports', value: stats.totalReports, trend: trends.reports, color: 'warning', progress: 75 }
            ],
            registrar: [
                { key: 'staff', icon: 'people', label: 'Staff', value: stats.totalStaff, trend: trends.staff, color: 'primary', progress: 100 },
                { key: 'centers', icon: 'building', label: 'Centers', value: stats.totalCenters, trend: trends.centers, color: 'success', progress: 85 },
                { key: 'departments', icon: 'diagram-3', label: 'Depts', value: stats.totalDepartments, trend: trends.departments, color: 'info', progress: 90 },
                { key: 'pending', icon: 'clock', label: 'Pending', value: stats.pendingReports, trend: trends.pending, color: 'warning', progress: 60 }
            ]
        };

        return baseStats[role] || baseStats.registrar;
    }

    function getRoleBasedActions(role) {
        const actions = {
            president: [
                { icon: 'plus-circle', label: 'Add Staff', action: 'addStaff', url: 'staff.html' },
                { icon: 'building-add', label: 'Add Center', action: 'addCenter', url: 'centers.html' },
                { icon: 'diagram-3', label: 'Add Department', action: 'addDept', url: 'departments.html' },
                { icon: 'file-text', label: 'View Reports', action: 'reports', url: 'reports.html' },
                { icon: 'graph-up', label: 'Analytics', action: 'analytics', modal: true },
                { icon: 'gear', label: 'Settings', action: 'settings', url: 'settings.html' }
            ],
            registrar: [
                { icon: 'plus-circle', label: 'Add Staff', action: 'addStaff', url: 'staff.html' },
                { icon: 'building-add', label: 'Add Center', action: 'addCenter', url: 'centers.html' },
                { icon: 'diagram-3', label: 'Add Department', action: 'addDept', url: 'departments.html' },
                { icon: 'file-text', label: 'View Reports', action: 'reports', url: 'reports.html' },
                { icon: 'clock', label: 'Pending Approvals', action: 'pending', url: 'reports.html?status=pending' }
            ],
            coordinator: [
                { icon: 'file-text', label: 'Submit Report', action: 'submitReport', modal: true, badge: { text: 'Due', color: 'warning' } },
                { icon: 'eye', label: 'View Reports', action: 'viewReports', url: 'reports.html' },
                { icon: 'building', label: 'My Center', action: 'center', url: 'centers.html' },
                { icon: 'person', label: 'My Profile', action: 'profile', modal: true }
            ],
            department_head: [
                { icon: 'file-text', label: 'Submit Report', action: 'submitReport', modal: true },
                { icon: 'people', label: 'Manage Staff', action: 'staff', url: 'staff.html' },
                { icon: 'diagram-3', label: 'My Department', action: 'department', url: 'departments.html' },
                { icon: 'graph-up', label: 'Performance', action: 'performance', modal: true }
            ],
            lecturer: [
                { icon: 'file-text', label: 'Submit Report', action: 'submitReport', modal: true },
                { icon: 'book', label: 'My Courses', action: 'courses', modal: true },
                { icon: 'calendar', label: 'Schedule', action: 'schedule', modal: true }
            ]
        };

        return actions[role] || actions.lecturer;
    }

    function getRoleInfo(role) {
        const info = {
            president: {
                icon: 'star-fill',
                message: 'You have full access to all system features.',
                action: { text: 'View Analytics', url: '#analytics' }
            },
            registrar: {
                icon: 'briefcase-fill',
                message: 'You can manage centers, departments, and staff.',
                action: { text: 'Pending Tasks', url: '#pending' }
            },
            coordinator: {
                icon: 'people-fill',
                message: 'You can view your center and submit reports.',
                action: { text: 'Submit Report', url: '#report' }
            },
            department_head: {
                icon: 'diagram-3-fill',
                message: 'You can manage your department and submit reports.',
                action: { text: 'View Department', url: '#dept' }
            },
            lecturer: {
                icon: 'book-fill',
                message: 'You can view your assignments and submit reports.',
                action: { text: 'View Schedule', url: '#schedule' }
            }
        };
        return info[role] || info.lecturer;
    }

    function getMotivationalQuotes(role) {
        const quotes = {
            president: [
                "Leadership is the capacity to translate vision into reality.",
                "The art of leadership is saying no, not saying yes.",
                "Great leaders don't set out to be a leader, they set out to make a difference."
            ],
            registrar: [
                "Organization is the key to success.",
                "Efficiency is doing better what is already being done.",
                "The secret of getting ahead is getting started."
            ],
            default: [
                "Make today amazing!",
                "Success is not final, failure is not fatal.",
                "Your attitude determines your direction."
            ]
        };
        return quotes[role] || quotes.default;
    }

    function getSimulatedWeather() {
        const conditions = [
            { icon: 'sun', temp: 24, condition: 'Sunny' },
            { icon: 'cloud-sun', temp: 22, condition: 'Partly Cloudy' },
            { icon: 'cloud', temp: 20, condition: 'Cloudy' },
            { icon: 'cloud-rain', temp: 18, condition: 'Rainy' }
        ];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    function getActivityIcon(action) {
        const icons = {
            'create': 'plus-circle',
            'update': 'pencil',
            'delete': 'trash',
            'view': 'eye',
            'login': 'box-arrow-in-right',
            'logout': 'box-arrow-right',
            'submit': 'send',
            'approve': 'check-circle'
        };
        return icons[action] || 'info-circle';
    }

    function getActivityColor(action) {
        const colors = {
            'create': 'success',
            'update': 'primary',
            'delete': 'danger',
            'view': 'info',
            'login': 'success',
            'logout': 'warning',
            'submit': 'info',
            'approve': 'success'
        };
        return colors[action] || 'secondary';
    }

    function getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'x-circle'
        };
        return icons[type] || 'bell';
    }

    function getPriorityColor(priority) {
        const colors = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'info',
            'normal': 'primary'
        };
        return colors[priority] || 'secondary';
    }

    function getPriorityBadge(priority) {
        const badges = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'info',
            'normal': 'secondary'
        };
        return badges[priority] || 'secondary';
    }

    function getItemIcon(type) {
        const icons = {
            'report': 'file-text',
            'staff': 'person',
            'center': 'building',
            'department': 'diagram-3'
        };
        return icons[type] || 'file';
    }

    function getItemColor(type) {
        const colors = {
            'report': 'primary',
            'staff': 'success',
            'center': 'info',
            'department': 'warning'
        };
        return colors[type] || 'secondary';
    }

    function getChartOptions(type) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                }
            }
        };

        if (type === 'activity') {
            return {
                ...baseOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true }
                    }
                },
                plugins: {
                    ...baseOptions.plugins,
                    legend: { display: false }
                }
            };
        }

        return baseOptions;
    }

    function formatTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000); // seconds

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return UI.formatDate(timestamp);
    }

    function getEmptyActivityHTML() {
        return `
            <div class="text-center text-muted py-5">
                <i class="bi bi-clock-history fs-1"></i>
                <p class="mt-3 mb-2">No recent activity</p>
                <small>Activities will appear here as you use the system</small>
            </div>
        `;
    }

    function getEmptyReportsHTML() {
        return `
            <div class="text-center text-muted py-4">
                <i class="bi bi-check-circle fs-1"></i>
                <p class="mt-2 mb-0">All caught up!</p>
                <small>No pending reports to review</small>
            </div>
        `;
    }

    function addLoadMoreButton(container, newOffset) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn btn-outline-primary btn-sm w-100 mt-2';
        loadMoreBtn.innerHTML = '<i class="bi bi-arrow-down"></i> Load More';
        loadMoreBtn.onclick = () => {
            loadMoreBtn.remove();
            loadActivityLog(newOffset);
        };
        container.appendChild(loadMoreBtn);
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function handleQuickAction(e) {
        const btn = e.target.closest('.quick-action-btn');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const url = btn.dataset.url;
        const isModal = btn.dataset.modal === 'true';
        
        if (url) {
            window.location.href = url;
        } else if (isModal) {
            if (action === 'submitReport') {
                showReportModal();
            } else if (action === 'profile') {
                showProfileModal();
            } else if (action === 'analytics') {
                showAnalyticsModal();
            }
        }
    }

    function toggleFavorite(e) {
        e.stopPropagation();
        const btn = e.target.closest('.favorite-toggle');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const icon = btn.querySelector('i');
        
        let favorites = JSON.parse(localStorage.getItem('favoriteActions')) || [];
        
        if (favorites.includes(action)) {
            favorites = favorites.filter(f => f !== action);
            icon.classList.remove('bi-star-fill', 'text-warning');
            icon.classList.add('bi-star');
            UI.showToast('Removed from favorites', 'info');
        } else {
            favorites.push(action);
            icon.classList.add('bi-star-fill', 'text-warning');
            icon.classList.remove('bi-star');
            UI.showToast('Added to favorites', 'success');
        }
        
        localStorage.setItem('favoriteActions', JSON.stringify(favorites));
    }

    function handleKeyboardShortcuts(e) {
        // Ctrl+R to refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshDashboard();
        }
        
        // Ctrl+E to export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportDashboard();
        }
        
        // Ctrl+P to print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
        
        // ? to show shortcuts
        if (e.key === '?' && !e.ctrlKey) {
            showKeyboardShortcuts();
        }
    }

    function handleResize() {
        // Re-render charts on window resize
        Object.values(charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }

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

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
        localStorage.setItem('sidebarCollapsed', document.getElementById('sidebar').classList.contains('active'));
    }

    // Show report modal
    function showReportModal() {
        // Populate report types based on user role
        const typeSelect = document.getElementById('reportType');
        if (typeSelect) {
            typeSelect.innerHTML = getReportTypes(currentUser.role)
                .map(type => `<option value="${type.value}">${type.label}</option>`)
                .join('');
        }
        
        new bootstrap.Modal(document.getElementById('reportModal')).show();
    }

    // Show profile modal
    function showProfileModal() {
        UI.alert(`
            <div class="text-center mb-3">
                <i class="bi bi-person-circle fs-1"></i>
                <h5 class="mt-2">${currentUser.name}</h5>
                <span class="badge bg-primary">${currentUser.role}</span>
            </div>
            <table class="table table-sm">
                <tr>
                    <th>User ID:</th>
                    <td>${currentUser.id}</td>
                </tr>
                <tr>
                    <th>Email:</th>
                    <td>${currentUser.email || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Last Login:</th>
                    <td>${UI.formatDate(currentUser.lastLogin)}</td>
                </tr>
                <tr>
                    <th>Login Time:</th>
                    <td>${new Date(currentUser.loginTime).toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Session Duration:</th>
                    <td>${getSessionDuration()}</td>
                </tr>
                <tr>
                    <th>Demo Mode:</th>
                    <td>${currentUser.isDemo ? 'Yes' : 'No'}</td>
                </tr>
            </table>
        `, 'User Profile');
    }

    // Show analytics modal
    function showAnalyticsModal() {
        const stats = DataService.getStatistics('year');
        
        UI.alert(`
            <div class="row mb-3">
                <div class="col-6">
                    <div class="border rounded p-3 text-center">
                        <h3 class="text-primary">${stats.growthRate}%</h3>
                        <small>Growth Rate</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="border rounded p-3 text-center">
                        <h3 class="text-success">${stats.retentionRate}%</h3>
                        <small>Retention</small>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Change</th>
                    </tr>
                    ${Object.entries(stats.metrics).map(([key, value]) => `
                        <tr>
                            <td>${key}</td>
                            <td>${value.current}</td>
                            <td>
                                <span class="badge bg-${value.change > 0 ? 'success' : 'danger'}">
                                    ${value.change > 0 ? '+' : ''}${value.change}%
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `, 'Analytics Dashboard', 'lg');
    }

    // Show keyboard shortcuts
    function showKeyboardShortcuts() {
        UI.alert(`
            <div class="row">
                <div class="col-6">
                    <h6>General</h6>
                    <ul class="list-unstyled">
                        <li><kbd>Ctrl+R</kbd> Refresh</li>
                        <li><kbd>Ctrl+E</kbd> Export</li>
                        <li><kbd>Ctrl+P</kbd> Print</li>
                        <li><kbd>?</kbd> Show shortcuts</li>
                    </ul>
                </div>
                <div class="col-6">
                    <h6>Navigation</h6>
                    <ul class="list-unstyled">
                        <li><kbd>Alt+S</kbd> Staff</li>
                        <li><kbd>Alt+C</kbd> Centers</li>
                        <li><kbd>Alt+D</kbd> Departments</li>
                        <li><kbd>Alt+R</kbd> Reports</li>
                    </ul>
                </div>
            </div>
        `, 'Keyboard Shortcuts');
    }

    function getSessionDuration() {
        const start = new Date(currentUser.loginTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 60000); // minutes
        
        if (diff < 60) return `${diff} minutes`;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours}h ${minutes}m`;
    }

    function getReportTypes(role) {
        const types = {
            president: [
                { value: 'president_report', label: 'Presidential Report' },
                { value: 'institutional_review', label: 'Institutional Review' }
            ],
            registrar: [
                { value: 'registrar_report', label: 'Registrar Report' },
                { value: 'academic_summary', label: 'Academic Summary' }
            ],
            coordinator: [
                { value: 'coordinator_report', label: 'Center Report' },
                { value: 'staff_evaluation', label: 'Staff Evaluation' }
            ],
            department_head: [
                { value: 'department_report', label: 'Department Report' },
                { value: 'budget_request', label: 'Budget Request' }
            ],
            lecturer: [
                { value: 'lecturer_report', label: 'Lecture Report' },
                { value: 'attendance_report', label: 'Attendance Report' }
            ]
        };
        
        return types[role] || types.lecturer;
    }

    function navigateToItem(type, id) {
        switch(type) {
            case 'report':
                window.location.href = `reports.html?id=${id}`;
                break;
            case 'staff':
                window.location.href = `staff.html?id=${id}`;
                break;
            case 'center':
                window.location.href = `centers.html?id=${id}`;
                break;
            case 'department':
                window.location.href = `departments.html?id=${id}`;
                break;
        }
    }

    function viewReportDetails(reportId) {
        // Navigate to reports page with report ID
        window.location.href = `reports.html?id=${reportId}`;
    }
});

// Initialize sidebar state from localStorage
if (localStorage.getItem('sidebarCollapsed') === 'true') {
    document.getElementById('sidebar')?.classList.add('active');
    document.getElementById('content')?.classList.add('active');
}