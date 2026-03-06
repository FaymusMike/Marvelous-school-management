document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const demoButtons = document.querySelectorAll('.demo-login');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('bi-eye');
            this.querySelector('i').classList.toggle('bi-eye-slash');
        });
    }

    // Handle regular login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (!username || !password) {
                UI.showToast('Please enter both username and password', 'warning');
                return;
            }

            // Simple validation - in real app, this would call an API
            if (username === 'admin' && password === 'admin123') {
                loginUser({
                    id: 0,
                    name: 'Administrator',
                    role: 'president',
                    username: username,
                    isDemo: false
                });
            } else {
                UI.showToast('Invalid username or password. Try demo access.', 'error');
            }
        });
    }

    // Handle demo login
    demoButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.dataset.role;
            let userData = null;
            
            // Find appropriate staff member for the role
            const staff = DataService.getStaff();
            
            switch(role) {
                case 'president':
                    userData = {
                        id: 'president',
                        name: 'President',
                        role: 'president',
                        isDemo: true
                    };
                    break;
                    
                case 'registrar':
                    userData = {
                        id: 'registrar',
                        name: 'Registrar',
                        role: 'registrar',
                        isDemo: true
                    };
                    break;
                    
                case 'coordinator':
                    const coordinator = staff.find(s => s.roles.includes('coordinator'));
                    if (coordinator) {
                        userData = {
                            id: coordinator.id,
                            name: coordinator.name,
                            role: 'coordinator',
                            staffData: coordinator,
                            isDemo: true
                        };
                    }
                    break;
                    
                case 'department_head':
                    const deptHead = staff.find(s => s.roles.includes('department_head'));
                    if (deptHead) {
                        userData = {
                            id: deptHead.id,
                            name: deptHead.name,
                            role: 'department_head',
                            staffData: deptHead,
                            isDemo: true
                        };
                    }
                    break;
                    
                case 'lecturer':
                    const lecturer = staff.find(s => s.roles.includes('lecturer'));
                    if (lecturer) {
                        userData = {
                            id: lecturer.id,
                            name: lecturer.name,
                            role: 'lecturer',
                            staffData: lecturer,
                            isDemo: true
                        };
                    }
                    break;
            }
            
            if (userData) {
                loginUser(userData);
            } else {
                UI.showToast('No sample user found for this role', 'error');
            }
        });
    });

    // Login function
    function loginUser(userData) {
        // Store user info
        localStorage.setItem('currentUser', JSON.stringify({
            ...userData,
            loginTime: new Date().toISOString()
        }));
        
        localStorage.setItem('isLoggedIn', 'true');
        
        UI.showToast(`Welcome, ${userData.name}!`, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }

    // Add animation to login card
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            loginCard.style.transition = 'all 0.5s ease';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
        }, 100);
    }
});