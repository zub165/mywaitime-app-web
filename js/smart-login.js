/**
 * Smart Login System with AI Compatibility
 * Handles role-based authentication and auto-fill capabilities
 */

class SmartLoginSystem {
    constructor() {
        this.currentRole = 'patient';
        this.apiBaseUrl = 'https://api.mywaitime.com/api';
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupQuickFill();
        this.setupVoiceInput();
        this.setupAutoSave();
        console.log('🚀 Smart Login System initialized');
    }

    setupEventListeners() {
        // Role selection
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectRole(e.target.dataset.role);
            });
        });

        // Quick fill options
        document.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleQuickFill(e.target.dataset.action);
            });
        });

        // Form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Auto-fill on typing
        document.getElementById('email').addEventListener('input', () => {
            this.autoCompleteEmail();
        });

        // Real-time validation
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    selectRole(role) {
        this.currentRole = role;
        
        // Update UI
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-role="${role}"]`).classList.add('active');

        // Show/hide role-specific fields
        const doctorFields = document.getElementById('doctorFields');
        const phoneGroup = document.getElementById('phoneGroup');
        
        if (role === 'doctor') {
            doctorFields.classList.remove('hidden');
            phoneGroup.classList.add('hidden');
        } else if (role === 'admin') {
            doctorFields.classList.add('hidden');
            phoneGroup.classList.add('hidden');
        } else {
            doctorFields.classList.add('hidden');
            phoneGroup.classList.remove('hidden');
        }

        console.log(`Role selected: ${role}`);
    }

    setupQuickFill() {
        // Demo data for quick fill
        this.demoData = {
            patient: {
                email: 'patient@demo.com',
                password: 'patient123',
                fullName: 'John Smith',
                phone: '+1-555-0123'
            },
            doctor: {
                email: 'doctor@demo.com',
                password: 'doctor123',
                fullName: 'Dr. Sarah Johnson',
                license: 'MD123456',
                specialty: 'emergency'
            },
            admin: {
                email: 'zm_199@hotmail.com',
                password: 'Bismilah786',
                fullName: 'System Administrator'
            }
        };
    }

    handleQuickFill(action) {
        switch (action) {
            case 'demo-patient':
                this.fillForm(this.demoData.patient, 'patient');
                break;
            case 'demo-doctor':
                this.fillForm(this.demoData.doctor, 'doctor');
                break;
            case 'auto-fill':
                this.autoFillForm();
                break;
            case 'voice-input':
                this.startVoiceInput();
                break;
        }
    }

    fillForm(data, role) {
        this.selectRole(role);
        
        // Fill form fields
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = data[key];
                this.animateField(field);
            }
        });

        // Confirm password
        if (data.password) {
            document.getElementById('confirmPassword').value = data.password;
        }

        console.log(`Form filled with ${role} data`);
        this.showNotification(`✅ ${role} data loaded!`, 'success');
    }

    autoFillForm() {
        // AI-powered auto-fill based on browser data
        const email = this.generateSmartEmail();
        const password = this.generateSmartPassword();
        const name = this.generateSmartName();
        
        const autoData = {
            email: email,
            password: password,
            fullName: name,
            phone: this.generatePhone()
        };

        this.fillForm(autoData, this.currentRole);
        this.showNotification('🤖 AI auto-fill completed!', 'info');
    }

    generateSmartEmail() {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const names = ['user', 'patient', 'john', 'sarah', 'mike', 'lisa'];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        return `${randomName}${randomNum}@${randomDomain}`;
    }

    generateSmartPassword() {
        const words = ['health', 'care', 'medical', 'emergency', 'hospital'];
        const numbers = Math.floor(Math.random() * 9000) + 1000;
        const word = words[Math.floor(Math.random() * words.length)];
        
        return `${word}${numbers}`;
    }

    generateSmartName() {
        const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Emma', 'James', 'Anna'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }

    generatePhone() {
        const areaCode = Math.floor(Math.random() * 900) + 100;
        const exchange = Math.floor(Math.random() * 900) + 100;
        const number = Math.floor(Math.random() * 9000) + 1000;
        
        return `+1-${areaCode}-${exchange}-${number}`;
    }

    setupVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };
        }
    }

    startVoiceInput() {
        if (this.recognition) {
            this.recognition.start();
            this.showNotification('🎤 Listening... Speak now!', 'info');
        } else {
            this.showNotification('❌ Voice input not supported', 'error');
        }
    }

    processVoiceInput(transcript) {
        // Simple voice processing for common inputs
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('patient')) {
            this.fillForm(this.demoData.patient, 'patient');
        } else if (lowerTranscript.includes('doctor')) {
            this.fillForm(this.demoData.doctor, 'doctor');
        } else if (lowerTranscript.includes('admin')) {
            this.fillForm(this.demoData.admin, 'admin');
        }
        
        this.showNotification(`🎤 Voice processed: ${transcript}`, 'info');
    }

    autoCompleteEmail() {
        const email = document.getElementById('email').value;
        if (email.includes('@') && !email.includes('.')) {
            // Auto-complete common domains
            const commonDomains = ['.com', '.org', '.net', '.edu'];
            // This would trigger autocomplete suggestions
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.type) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                message = isValid ? '✅ Valid email' : '❌ Invalid email format';
                break;
            case 'password':
                isValid = value.length >= 6;
                message = isValid ? '✅ Password is strong' : '❌ Password too short';
                break;
            case 'tel':
                isValid = /^\+?[\d\s\-\(\)]+$/.test(value);
                message = isValid ? '✅ Valid phone number' : '❌ Invalid phone format';
                break;
        }

        this.showFieldValidation(field, isValid, message);
    }

    showFieldValidation(field, isValid, message) {
        // Remove existing validation classes
        field.classList.remove('is-valid', 'is-invalid');
        
        // Add appropriate class
        field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        
        // Show validation message
        console.log(`${field.name}: ${message}`);
    }

    async handleSubmit() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showLoading(true);

        try {
            const formData = this.getFormData();
            
            // Validate form
            if (!this.validateForm(formData)) {
                throw new Error('Form validation failed');
            }

            // Check if passwords match
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Attempt login/registration
            const result = await this.authenticateUser(formData);
            
            if (result.success) {
                this.handleSuccessfulAuth(result);
            } else {
                throw new Error(result.message || 'Authentication failed');
            }

        } catch (error) {
            console.error('Authentication error:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    getFormData() {
        const form = document.getElementById('loginForm');
        const formData = new FormData(form);
        
        return {
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            license: formData.get('license'),
            specialty: formData.get('specialty'),
            role: this.currentRole
        };
    }

    validateForm(data) {
        const requiredFields = ['email', 'password', 'confirmPassword', 'fullName'];
        
        if (this.currentRole === 'doctor') {
            requiredFields.push('license', 'specialty');
        } else if (this.currentRole === 'patient') {
            requiredFields.push('phone');
        }

        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showNotification(`❌ ${field} is required`, 'error');
                return false;
            }
        }

        return true;
    }

    async authenticateUser(data) {
        try {
            // First try to login
            const loginResponse = await this.attemptLogin(data.email, data.password);
            
            if (loginResponse.success) {
                return {
                    success: true,
                    user: loginResponse.user,
                    isNewUser: false
                };
            }

            // If login fails, try registration
            const registerResponse = await this.attemptRegistration(data);
            
            if (registerResponse.success) {
                // Auto-login after registration
                const autoLoginResponse = await this.attemptLogin(data.email, data.password);
                return {
                    success: true,
                    user: autoLoginResponse.user,
                    isNewUser: true
                };
            }

            return { success: false, message: 'Authentication failed' };

        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: error.message };
        }
    }

    async attemptLogin(email, password) {
        const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();
        return result;
    }

    async attemptRegistration(data) {
        const payload = {
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            role: data.role
        };

        if (data.phone) payload.phone = data.phone;
        if (data.license) payload.license = data.license;
        if (data.specialty) payload.specialty = data.specialty;

        const response = await fetch(`${this.apiBaseUrl}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return result;
    }

    handleSuccessfulAuth(result) {
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userRole', result.user.role);
        localStorage.setItem('isAuthenticated', 'true');

        // Show success message
        const message = result.isNewUser ? 
            `🎉 Welcome ${result.user.full_name}! Registration successful.` :
            `👋 Welcome back ${result.user.full_name}!`;
        
        this.showNotification(message, 'success');

        // Redirect based on role and new user status
        setTimeout(() => {
            this.redirectUser(result.user, result.isNewUser);
        }, 2000);
    }

    redirectUser(user, isNewUser) {
        if (user.role === 'admin') {
            window.location.href = 'admin-panel.html';
        } else if (isNewUser && user.role === 'patient') {
            window.location.href = 'index.html?tab=registration&new_user=true';
        } else {
            window.location.href = 'index.html?tab=er-wait';
        }
    }

    showLoading(show) {
        const btn = document.querySelector('.btn-login');
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        if (show) {
            btnText.style.display = 'none';
            loading.classList.add('show');
            btn.disabled = true;
        } else {
            btnText.style.display = 'block';
            loading.classList.remove('show');
            btn.disabled = false;
        }
    }

    animateField(field) {
        field.style.transform = 'scale(1.05)';
        field.style.backgroundColor = '#e8f4fd';
        
        setTimeout(() => {
            field.style.transform = 'scale(1)';
            field.style.backgroundColor = '';
        }, 300);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    setupAutoSave() {
        // Auto-save form data to localStorage
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                const formData = this.getFormData();
                localStorage.setItem('loginFormData', JSON.stringify(formData));
            });
        });

        // Restore form data on page load
        const savedData = localStorage.getItem('loginFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Restore non-sensitive data
                if (data.email) document.getElementById('email').value = data.email;
                if (data.fullName) document.getElementById('fullName').value = data.fullName;
                if (data.phone) document.getElementById('phone').value = data.phone;
                if (data.role) this.selectRole(data.role);
            } catch (error) {
                console.error('Error restoring form data:', error);
            }
        }
    }
}

// Quick Admin Login Function
function quickAdminLogin() {
    const smartLogin = new SmartLoginSystem();
    smartLogin.fillForm({
        email: 'zm_199@hotmail.com',
        password: 'Bismilah786',
        fullName: 'System Administrator'
    }, 'admin');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartLoginSystem();
});
