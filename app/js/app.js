/**
 * Main Application Controller
 * Handles initialization, navigation, and global state management
 */

class ERWaitTimeApp {
    constructor() {
        this.currentTab = 'er-wait';
        this.isLoading = false;
        this.user = null;
        const host = (typeof location !== 'undefined' && location.hostname) || '';
        const productionApi = host.includes('mywaitime.com') || host.includes('mywaittime.com') || host.includes('github.io');
        this.config = {
            // Local Node :3002 proxies /api → Django; GitHub Pages must call api.mywaitime.com
            apiBaseUrl: productionApi ? 'https://api.mywaitime.com/api' : '/api',
            mapApiKey: 'your-map-api-key',
            defaultLocation: {
                lat: 27.9506,
                lng: -82.4572,
                city: 'Tampa',
                state: 'FL'
            }
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading();
            
            // Set up global error handling for external routing errors
            this.setupGlobalErrorHandling();
            
            // Check for user authentication first
            await this.checkUserSession();
            
            // If no user is logged in, show registration/login screen
            if (!this.user) {
                this.showAuthenticationRequired();
                this.hideLoading();
                return;
            }
            
            // Initialize components
            await this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial tab
            await this.loadTab(this.currentTab);
            
            this.hideLoading();
            this.showNotification('Application loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.hideLoading();
            this.showNotification('Failed to load application. Please refresh the page.', 'danger');
        }
    }

    /**
     * Set up global error handling to suppress external routing errors
     */
    setupGlobalErrorHandling() {
        // Override console.error to filter out external routing errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args[0]?.toString() || '';
            // Filter out external "No route matched" errors that come from browser extensions or external libraries
            if (message.includes('No route matched') && !message.includes('ERWaitTimeApp')) {
                return; // Suppress this error
            }
            originalConsoleError.apply(console, args);
        };

        // Handle unhandled promise rejections that might be related to routing
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason;
            if (error && error.message && error.message.includes('No route matched')) {
                event.preventDefault(); // Prevent the error from showing in console
                return;
            }
        });

        // Add global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            // Don't let errors crash the entire application
            event.preventDefault();
        });

        // Add emergency modal cleanup
        this.setupEmergencyModalCleanup();
    }

    /**
     * Set up emergency modal cleanup to prevent UI hanging
     */
    setupEmergencyModalCleanup() {
        // Add keyboard shortcut to force close all modals (Ctrl+Shift+M)
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'M') {
                console.log('Emergency modal cleanup triggered');
                this.forceCloseAllModals();
            }
        });

        // Add automatic modal cleanup after 30 seconds of inactivity
        let lastActivity = Date.now();
        document.addEventListener('click', () => lastActivity = Date.now());
        document.addEventListener('keydown', () => lastActivity = Date.now());
        
        setInterval(() => {
            if (Date.now() - lastActivity > 30000) {
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    console.log('Auto-closing stale modals');
                    this.forceCloseAllModals();
                }
            }
        }, 5000);
    }

    /**
     * Force close all open modals
     */
    forceCloseAllModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        });
        
        // Remove any backdrop elements
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Initialize all application components
     */
    async initializeComponents() {
        // Initialize API client
        if (window.APIClient) {
            window.apiClient = new APIClient(this.config.apiBaseUrl);
        }
        
        // Initialize router
        if (window.Router) {
            window.router = new Router(this);
        }
        
        // Initialize utilities
        if (window.Utils) {
            window.utils = new Utils();
        }
        
        // Check backend connections
        await this.checkBackendConnections();
        
        // Check for user session
        await this.checkUserSession();
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]') || e.target.closest('[data-tab]')) {
                e.preventDefault();
                const tabElement = e.target.matches('[data-tab]') ? e.target : e.target.closest('[data-tab]');
                const tabName = tabElement.getAttribute('data-tab');
                this.navigateToTab(tabName);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.loadTab(e.state.tab, false);
            }
        });

        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost. Some features may not work.', 'warning');
        });
    }

    /**
     * Navigate to a specific tab
     */
    async navigateToTab(tabName) {
        if (this.isLoading) return;
        
        try {
            this.showLoading();
            
            // Update navigation state
            this.updateNavigationState(tabName);
            
            // Load tab content
            await this.loadTab(tabName);
            
            // Update browser history
            history.pushState({ tab: tabName }, '', `#${tabName}`);
            
            this.hideLoading();
            
        } catch (error) {
            console.error(`Failed to navigate to ${tabName}:`, error);
            this.hideLoading();
            this.showNotification(`Failed to load ${tabName} tab`, 'danger');
        }
    }

    /**
     * Load tab content
     */
    async loadTab(tabName, updateHistory = true) {
        if (this.currentTab === tabName && !updateHistory) return;
        
        console.log(`Loading tab: ${tabName}`);
        this.currentTab = tabName;
        
        try {
            // Get tab content
            const tabContent = await this.getTabContent(tabName);
            console.log(`Tab content loaded for ${tabName}:`, tabContent.substring(0, 100) + '...');
            
            // Update DOM
            const contentContainer = document.getElementById('tab-content');
            if (contentContainer) {
                contentContainer.innerHTML = tabContent;
                contentContainer.classList.add('fade-in');
                console.log(`Tab content inserted into DOM for ${tabName}`);
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    contentContainer.classList.remove('fade-in');
                }, 500);
            } else {
                console.error('Tab content container not found');
            }
            
            // Initialize tab-specific functionality
            await this.initializeTab(tabName);
            console.log(`Tab ${tabName} initialized successfully`);
            
        } catch (error) {
            console.error(`Error loading tab ${tabName}:`, error);
            this.showNotification(`Failed to load ${tabName} content`, 'danger');
        }
    }

    /**
     * Get tab content HTML
     */
    async getTabContent(tabName) {
        try {
            console.log(`Fetching tab content for: ${tabName}`);
            const response = await fetch(`tabs/${tabName}.html`);
            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${tabName} tab: ${response.status}`);
            }
            
            const content = await response.text();
            console.log(`Tab content fetched successfully for ${tabName}, length: ${content.length}`);
            return content;
        } catch (error) {
            console.error(`Error loading ${tabName} tab:`, error);
            return this.getErrorContent(tabName);
        }
    }

    /**
     * Initialize tab-specific functionality
     */
    async initializeTab(tabName) {
        const tabInitializers = {
            'er-wait': () => this.initializeERWaitTab(),
            'chat': () => this.initializeChatTab(),
            'hospital': () => this.initializeHospitalTab(),
            'registration': () => this.initializeRegistrationTab(),
            'records': () => this.initializeRecordsTab(),
            'directions': () => this.initializeDirectionsTab()
        };

        const initializer = tabInitializers[tabName];
        if (initializer) {
            try {
                // Suppress external routing errors that might interfere
                const originalConsoleError = console.error;
                console.error = (...args) => {
                    const message = args[0]?.toString() || '';
                    // Filter out external "No route matched" errors
                    if (message.includes('No route matched') && !message.includes('ERWaitTimeApp')) {
                        return; // Suppress this error
                    }
                    originalConsoleError.apply(console, args);
                };

                await initializer();
                
            } catch (error) {
                console.error(`Failed to initialize ${tabName} tab:`, error);
                this.showNotification(`Failed to initialize ${tabName} functionality`, 'warning');
            } finally {
                console.error = originalConsoleError;
            }
        }
    }

    /**
     * Initialize ER Wait Time tab
     */
    async initializeERWaitTab() {
        if (window.ERWaitManager) {
            window.erWaitManager = new ERWaitManager();
            await window.erWaitManager.init();
        }
    }

    /**
     * Initialize Chat tab
     */
    async initializeChatTab() {
        if (window.ChatManager) {
            window.chatManager = new ChatManager();
            await window.chatManager.init();
        }
    }

    /**
     * Initialize Hospital tab
     */
    async initializeHospitalTab() {
        if (window.HospitalManager) {
            window.hospitalManager = new HospitalManager();
            await window.hospitalManager.init();
        }
    }

    /**
     * Initialize Registration tab
     */
    async initializeRegistrationTab() {
        if (window.RegistrationManager) {
            window.registrationManager = new RegistrationManager();
            await window.registrationManager.init();
        }
    }

    /**
     * Initialize Records tab
     */
    async initializeRecordsTab() {
        if (window.RecordsManager) {
            window.recordsManager = new RecordsManager();
            await window.recordsManager.init();
        }
    }

    /**
     * Initialize Directions tab
     */
    async initializeDirectionsTab() {
        if (window.DirectionsManager) {
            window.directionsManager = new DirectionsManager();
            await window.directionsManager.init();
        }
    }

    /**
     * Update navigation state
     */
    updateNavigationState(activeTab) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-tab="${activeTab}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Check backend connections
     */
    async checkBackendConnections() {
        this.backendStatus = {
            django: false,
            frontend: true
        };

        try {
            // Test Django backend
            const response = await fetch(`${this.config.apiBaseUrl}/hospitals/`);
            if (response.ok) {
                this.backendStatus.django = true;
                console.log('✅ Django backend connected');
            }
        } catch (error) {
            console.error('❌ Django backend connection failed:', error);
        }

        // Update UI with backend status
        this.updateBackendStatus();
    }

    /**
     * Update backend status in UI with modern animations
     */
    updateBackendStatus() {
        const statusElement = document.querySelector('.badge.bg-success, .badge.bg-danger');
        if (statusElement) {
            // Add pulse animation for status change
            statusElement.classList.add('pulse');
            
            setTimeout(() => {
                if (this.backendStatus.django) {
                    statusElement.innerHTML = '<i class="fas fa-circle me-1" style="font-size: 0.5rem;"></i>Backend Connected';
                    statusElement.className = 'badge bg-success me-2';
                } else {
                    statusElement.innerHTML = '<i class="fas fa-circle me-1" style="font-size: 0.5rem;"></i>Backend Offline';
                    statusElement.className = 'badge bg-danger me-2';
                }
                statusElement.classList.remove('pulse');
            }, 500);
        }
        
    }




    /**
     * Check user session
     */
    async checkUserSession() {
        try {
            if (window.AuthService) {
                this.user = window.AuthService.getSession();
            } else {
                const userData = localStorage.getItem('er-wait-user') || localStorage.getItem('user');
                if (userData) {
                    this.user = JSON.parse(userData);
                }
            }
            if (this.user) {
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Failed to check user session:', error);
        }
    }

    /**
     * Update user info display
     */
    updateUserInfo() {
        const userInfoElement = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userInfoElement && this.user) {
            userInfoElement.textContent = this.user.username || this.user.first_name || 'User';
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
            }
        } else {
            if (userInfoElement) {
                userInfoElement.textContent = 'Guest User';
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.clearUserSession();
        
        // Remove auth screen if exists
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.remove();
        }

        // Hide navigation
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.style.display = 'none';
        }

        // Show authentication screen
        this.showAuthenticationRequired();
        
        this.showNotification('You have been logged out successfully.', 'info');
    }

    /**
     * Show loading spinner
     */
    showLoading() {
        this.isLoading = true;
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('d-none');
        }
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        this.isLoading = false;
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('d-none');
        }
    }

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const toastMessage = document.getElementById('toast-message');
        
        if (toast && toastMessage) {
            // Update message
            toastMessage.textContent = message;
            
            // Update toast type
            toast.className = `toast ${type}`;
            
            // Show toast
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Trigger resize events for components that need it
        if (window.hospitalManager && window.hospitalManager.handleResize) {
            window.hospitalManager.handleResize();
        }
        
        if (window.directionsManager && window.directionsManager.handleResize) {
            window.directionsManager.handleResize();
        }
    }

    /**
     * Get error content for failed tab loads
     */
    getErrorContent(tabName) {
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error Loading ${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Tab</strong>
                <p class="mb-0 mt-2">Failed to load the ${tabName} tab. Please try refreshing the page.</p>
                <button class="btn btn-danger btn-sm mt-2" onclick="location.reload()">
                    <i class="fas fa-refresh me-1"></i>Refresh Page
                </button>
            </div>
        `;
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
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

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Set current user
     */
    setCurrentUser(user) {
        this.user = window.AuthService ? window.AuthService.saveSession(user) : user;
        if (!window.AuthService) {
            localStorage.setItem('er-wait-user', JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isAuthenticated', 'true');
            if (user && user.role) localStorage.setItem('userRole', user.role);
            if (user && user.token) localStorage.setItem('authToken', user.token);
        }
        this.updateUserInfo();
    }

    /**
     * Clear user session
     */
    clearUserSession() {
        this.user = null;
        if (window.AuthService) {
            window.AuthService.clearSession();
        } else {
            localStorage.removeItem('er-wait-user');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('authToken');
        }
        this.updateUserInfo();
    }

    /**
     * Show authentication required screen
     */
    showAuthenticationRequired() {
        // Hide all tabs
        const tabContent = document.querySelectorAll('.tab-content');
        tabContent.forEach(tab => {
            tab.style.display = 'none';
        });

        // Hide navigation
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.style.display = 'none';
        }

        // Create authentication screen
        const authScreen = document.createElement('div');
        authScreen.id = 'auth-screen';
        authScreen.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h1>🏥 ER Wait Time</h1>
                    <p>Please register or login to access ER wait times and hospital information</p>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="register">Register</button>
                    <button class="auth-tab" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="forgot">Forgot</button>
                </div>

                <div class="auth-content">
                    <!-- Registration Form -->
                    <div id="register-form" class="auth-form active">
                        <h3>Create Account</h3>
                        <form id="registrationForm">
                            <div class="form-group">
                                <label for="reg-role">I am a:</label>
                                <select id="reg-role" required>
                                    <option value="user">Patient / User</option>
                                    <option value="doctor">Doctor</option>
                                </select>
                                <small style="color:#888;display:block;margin-top:4px;">Admins cannot self-register — use Login with an admin account.</small>
                            </div>
                            <div class="form-group">
                                <label for="reg-email" style="font-size:0.85rem;color:#555;">Email</label>
                                <input type="email" id="reg-email" placeholder="you@example.com" required autocomplete="email">
                            </div>
                            <div class="form-group">
                                <label for="reg-password" style="font-size:0.85rem;color:#555;">Password</label>
                                <input type="password" id="reg-password" placeholder="8+ chars, upper, lower, number, symbol" required autocomplete="new-password">
                            </div>
                            <div class="form-group">
                                <input type="text" id="reg-firstname" placeholder="First Name" autocomplete="given-name">
                            </div>
                            <div class="form-group">
                                <input type="text" id="reg-lastname" placeholder="Last Name" autocomplete="family-name">
                            </div>
                            <div class="form-group">
                                <input type="tel" id="reg-phone" placeholder="Phone Number" autocomplete="tel">
                            </div>
                            <input type="hidden" id="reg-username" value="">
                            <button type="submit" class="btn-primary">Register</button>
                        </form>
                    </div>

                    <!-- Login Form -->
                    <div id="login-form" class="auth-form">
                        <h3>Login to Account</h3>
                        <form id="loginForm">
                            <div class="form-group">
                                <input type="text" id="login-username" placeholder="Email or Username" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="login-password" placeholder="Password" required>
                            </div>
                            <button type="submit" class="btn-primary">Login</button>
                        </form>
                        <p style="text-align:center;margin-top:1rem;font-size:0.9rem;">
                            <a href="#" id="goto-forgot" style="color:#667eea;">Forgot password?</a>
                        </p>
                    </div>

                    <!-- Forgot Password Form -->
                    <div id="forgot-form" class="auth-form">
                        <h3>Reset Password</h3>
                        <p style="color:#666;font-size:0.9rem;text-align:center;">Enter your email. We will send a reset link if an account exists.</p>
                        <form id="forgotForm">
                            <div class="form-group">
                                <input type="email" id="forgot-email" placeholder="Email" required>
                            </div>
                            <button type="submit" class="btn-primary">Send Reset Link</button>
                        </form>
                    </div>
                </div>

                <div class="auth-footer">
                    <p>By using this service, you agree to our terms of service and privacy policy.</p>
                    <p style="margin-top:0.5rem;"><a href="smart-login.html" style="color:#667eea;">Open Smart Login</a></p>
                </div>
            </div>
        `;

        // Add styles
        const authStyles = document.createElement('style');
        authStyles.textContent = `
            #auth-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                min-height: 100vh;
                min-height: 100dvh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow-y: auto;
                overflow-x: hidden;
                padding: max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px));
                -webkit-overflow-scrolling: touch;
            }
            
            .auth-container {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: min(400px, 100%);
                margin: auto;
            }
            
            .auth-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .auth-header h1 {
                color: #333;
                margin: 0 0 0.5rem 0;
                font-size: 1.8rem;
            }
            
            .auth-header p {
                color: #666;
                margin: 0;
                font-size: 0.9rem;
            }
            
            .auth-tabs {
                display: flex;
                margin-bottom: 1.5rem;
                border-bottom: 1px solid #eee;
            }
            
            .auth-tab {
                flex: 1;
                padding: 0.75rem;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 1rem;
                color: #666;
                border-bottom: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .auth-tab.active {
                color: #667eea;
                border-bottom-color: #667eea;
            }
            
            .auth-form {
                display: none;
            }
            
            .auth-form.active {
                display: block;
            }
            
            .auth-form h3 {
                margin: 0 0 1.5rem 0;
                color: #333;
                text-align: center;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 500;
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
                min-height: 44px;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .btn-primary {
                width: 100%;
                padding: 0.75rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.3s ease;
                margin-top: 1rem;
                min-height: 44px;
                touch-action: manipulation;
            }
            
            .btn-primary:hover {
                background: #5a6fd8;
            }
            
            .auth-footer {
                margin-top: 1.5rem;
                text-align: center;
            }
            
            .auth-footer p {
                color: #999;
                font-size: 0.8rem;
                margin: 0;
            }

            @media (max-width: 767.98px) {
                #auth-screen {
                    align-items: flex-start;
                    justify-content: flex-start;
                }

                .auth-container {
                    padding: 1.25rem;
                    border-radius: 10px;
                    max-width: 100%;
                }

                .auth-header {
                    margin-bottom: 1.25rem;
                }

                .auth-header h1 {
                    font-size: clamp(1.45rem, 8vw, 1.8rem);
                }

                .auth-form h3 {
                    margin-bottom: 1rem;
                    font-size: 1.25rem;
                }
            }

            @media (max-height: 720px) {
                #auth-screen {
                    align-items: flex-start;
                }

                .auth-container {
                    margin-top: 0;
                    margin-bottom: 0;
                }
            }
        `;

        document.head.appendChild(authStyles);
        document.body.appendChild(authScreen);

        // Set up auth form event listeners
        this.setupAuthEventListeners();
    }

    /**
     * Set up authentication form event listeners
     */
    setupAuthEventListeners() {
        // Tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        const authForms = document.querySelectorAll('.auth-form');

        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active form
                authForms.forEach(form => form.classList.remove('active'));
                document.getElementById(`${tabName}-form`).classList.add('active');
            });
        });

        // Registration form
        const regForm = document.getElementById('registrationForm');
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegistration();
        });

        // Login form
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        const forgotForm = document.getElementById('forgotForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleForgotPassword();
            });
        }

        const gotoForgot = document.getElementById('goto-forgot');
        if (gotoForgot) {
            gotoForgot.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('.auth-tab[data-tab="forgot"]')?.click();
            });
        }
    }

    /**
     * Handle user registration
     */
    async handleRegistration() {
        try {
            const first = document.getElementById('reg-firstname').value.trim();
            const last = document.getElementById('reg-lastname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const usernameFromEmail = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
            const result = await window.AuthService.registerAccount({
                username: usernameFromEmail,
                email,
                password: document.getElementById('reg-password').value,
                role: document.getElementById('reg-role').value,
                first_name: first,
                last_name: last,
                full_name: [first, last].filter(Boolean).join(' '),
                phone: document.getElementById('reg-phone').value.trim(),
            });

            if (result.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                document.querySelector('.auth-tab[data-tab="login"]')?.click();
            } else {
                this.showNotification('Registration failed: ' + result.message, 'danger');
            }
        } catch (error) {
            this.showNotification('Registration error: ' + error.message, 'danger');
        }
    }

    /**
     * Handle user login
     */
    async handleLogin() {
        try {
            const identifier = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const result = await window.AuthService.login({
                email: identifier.includes('@') ? identifier : undefined,
                username: identifier.includes('@') ? undefined : identifier,
                password,
            });

            if (result.success) {
                this.setCurrentUser(result.user);

                const authScreen = document.getElementById('auth-screen');
                if (authScreen) authScreen.remove();

                const navigation = document.querySelector('.navigation') || document.querySelector('.navbar');
                if (navigation) navigation.style.display = '';

                const mainTabContent = document.getElementById('tab-content');
                if (mainTabContent) mainTabContent.style.display = '';

                if (result.user.role === 'admin') {
                    window.location.href = 'admin-panel.html';
                    return;
                }

                await this.initializeComponents();
                this.setupEventListeners();
                await this.loadTab(this.currentTab);

                this.showNotification('Login successful! Welcome to ER Wait Time.', 'success');
            } else {
                this.showNotification('Login failed: ' + result.message, 'danger');
            }
        } catch (error) {
            this.showNotification('Login error: ' + error.message, 'danger');
        }
    }

    async handleForgotPassword() {
        try {
            const email = document.getElementById('forgot-email').value.trim();
            const result = await window.AuthService.requestPasswordReset(email);
            if (result.success) {
                this.showNotification(result.message || 'Check your email for a reset link.', 'success');
            } else {
                this.showNotification(result.message || 'Could not start password reset.', 'danger');
            }
        } catch (error) {
            this.showNotification('Password reset error: ' + error.message, 'danger');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ERWaitTimeApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ERWaitTimeApp;
}
