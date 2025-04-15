const Auth = {
    init() {
        this.setupAuthListeners();
        this.setupLoginForms();
        this.setupAccountLink();
        this.checkAuthentication();
    },

    setupAuthListeners() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.updateUIForAuthenticatedUser(user);
            } else {
                this.redirectToLogin();
            }
        });
    },

    setupLoginForms() {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginTab && registerTab) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            });
            
            registerTab.addEventListener('click', () => {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            });
        }
        
        const loginFormElement = document.getElementById('login-form-element');
        const registerFormElement = document.getElementById('register-form-element');
        
        if (loginFormElement) {
            loginFormElement.addEventListener('submit', e => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                this.loginUser(email, password);
            });
        }
        
        if (registerFormElement) {
            registerFormElement.addEventListener('submit', e => {
                e.preventDefault();
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('register-confirm-password').value;
                
                if (password !== confirmPassword) {
                    this.showError('register-error', 'Passwords do not match');
                    return;
                }
                
                this.registerUser(name, email, password);
            });
        }
    },

    loginUser(email, password) {
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                this.showError('login-error', error.message);
            });
    },

    registerUser(name, email, password) {
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                return db.collection('users').doc(userCredential.user.uid).set({
                    name,
                    email,
                    createdAt: timestamp()
                });
            })
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                this.showError('register-error', error.message);
            });
    },

    logoutUser() {
        auth.signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Logout Error:', error);
            });
    },

    setupAccountLink() {
        const accountLink = document.getElementById('account-link');
        
        if (accountLink) {
            accountLink.addEventListener('click', e => {
                e.preventDefault();
                
                auth.currentUser ? this.logoutUser() : window.location.href = 'login.html';
            });
        }
        
        const adminLogout = document.getElementById('admin-logout');
        
        if (adminLogout) {
            adminLogout.addEventListener('click', e => {
                e.preventDefault();
                this.logoutUser();
            });
        }
    },

    checkAuthentication() {
        const isLoginPage = window.location.pathname.includes('login.html');
        const isAdminPage = window.location.pathname.includes('admin.html');
        
        auth.onAuthStateChanged(user => {
            if (user) {
                if (isLoginPage) {
                    window.location.href = 'index.html';
                }
                
                if (isAdminPage) {
                    this.checkAdminAccess(user.uid);
                }
                
                this.updateUIForAuthenticatedUser(user);
            } else {
                if (!isLoginPage && this.isProtectedPage()) {
                    window.location.href = 'login.html';
                }
            }
        });
    },

    isProtectedPage() {
        const publicPages = ['login.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        return !publicPages.includes(currentPage);
    },

    updateUIForAuthenticatedUser(user) {
        const accountLink = document.getElementById('account-link');
        
        if (accountLink) {
            accountLink.textContent = 'Logout';
        }
    },

    checkAdminAccess(userId) {
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists && doc.data().isAdmin) {
                    return;
                } else {
                    window.location.href = 'index.html';
                }
            })
            .catch(() => {
                window.location.href = 'index.html';
            });
    },

    redirectToLogin() {
        if (this.isProtectedPage()) {
            window.location.href = 'login.html';
        }
    },

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});