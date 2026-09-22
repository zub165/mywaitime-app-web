/**
 * Doctor Registration System with AI Assistance
 */

class DoctorRegistrationSystem {
    constructor() {
        this.apiBaseUrl = 'https://api.mywaitime.com/api';
        this.selectedSpecialty = null;
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSpecialtySelection();
        this.setupAIAssistant();
        this.setupFormValidation();
        console.log('🏥 Doctor Registration System initialized');
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('doctorRegistrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        document.querySelectorAll('.smart-input').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                this.clearValidation(input);
            });
        });

        // Phone number formatting
        document.getElementById('phone').addEventListener('input', (e) => {
            e.target.value = this.formatPhoneNumber(e.target.value);
        });

        // License number formatting
        document.getElementById('licenseNumber').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    setupSpecialtySelection() {
        document.querySelectorAll('.specialty-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.specialty-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Add selection to clicked option
                option.classList.add('selected');
                this.selectedSpecialty = option.dataset.specialty;

                // Update form field
                document.getElementById('specialty').value = this.selectedSpecialty;

                console.log(`Specialty selected: ${this.selectedSpecialty}`);
                this.showNotification(`✅ ${option.querySelector('strong').textContent} selected`, 'success');
            });
        });
    }

    setupAIAssistant() {
        document.querySelectorAll('.ai-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                this.handleAISuggestion(suggestion.dataset.action);
            });
        });
    }

    setupFormValidation() {
        // Email validation
        document.getElementById('email').addEventListener('input', (e) => {
            this.validateEmail(e.target);
        });

        // License validation
        document.getElementById('licenseNumber').addEventListener('input', (e) => {
            this.validateLicense(e.target);
        });
    }

    handleAISuggestion(action) {
        const suggestions = {
            'emergency-doctor': {
                specialty: 'emergency',
                medicalSchool: 'Johns Hopkins School of Medicine',
                yearsExperience: '5-10'
            },
            'cardiologist': {
                specialty: 'cardiology',
                medicalSchool: 'Mayo Clinic School of Medicine',
                yearsExperience: '10-15'
            },
            'pediatrician': {
                specialty: 'pediatrics',
                medicalSchool: 'Harvard Medical School',
                yearsExperience: '3-7'
            },
            'surgeon': {
                specialty: 'surgery',
                medicalSchool: 'Stanford School of Medicine',
                yearsExperience: '8-12'
            },
            'auto-fill': this.generateRandomDoctorProfile()
        };

        const suggestion = suggestions[action];
        if (suggestion) {
            this.fillFormWithSuggestion(suggestion);
            this.showNotification(`🤖 AI suggestion applied: ${action}`, 'info');
        }
    }

    fillFormWithSuggestion(data) {
        // Fill specialty
        if (data.specialty) {
            document.querySelector(`[data-specialty="${data.specialty}"]`).click();
        }

        // Fill other fields
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field && field.tagName !== 'SELECT') {
                field.value = data[key];
                this.animateField(field);
            } else if (field && field.tagName === 'SELECT') {
                field.value = data[key];
            }
        });
    }

    generateRandomDoctorProfile() {
        const medicalSchools = [
            'Johns Hopkins School of Medicine',
            'Harvard Medical School',
            'Stanford School of Medicine',
            'Mayo Clinic School of Medicine',
            'UCLA School of Medicine',
            'Yale School of Medicine',
            'Columbia University College of Physicians and Surgeons',
            'University of Pennsylvania Perelman School of Medicine'
        ];

        const specialties = ['emergency', 'cardiology', 'neurology', 'pediatrics', 'surgery', 'internal'];
        const experienceLevels = ['2-5', '6-10', '11-15', '16-20'];

        return {
            medicalSchool: medicalSchools[Math.floor(Math.random() * medicalSchools.length)],
            specialty: specialties[Math.floor(Math.random() * specialties.length)],
            yearsExperience: experienceLevels[Math.floor(Math.random() * experienceLevels.length)]
        };
    }

    formatPhoneNumber(value) {
        // Remove all non-numeric characters
        const phoneNumber = value.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (phoneNumber.length >= 10) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
        } else if (phoneNumber.length >= 6) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
        } else if (phoneNumber.length >= 3) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        } else {
            return phoneNumber;
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
            case 'tel':
                isValid = /^\(\d{3}\) \d{3}-\d{4}$/.test(value);
                message = isValid ? '✅ Valid phone number' : '❌ Invalid phone format';
                break;
            case 'text':
                if (field.id === 'licenseNumber') {
                    isValid = /^[A-Z]{2,3}\d{6,8}$/.test(value);
                    message = isValid ? '✅ Valid license format' : '❌ License format: MD123456';
                } else {
                    isValid = value.length >= 2;
                    message = isValid ? '✅ Valid name' : '❌ Name too short';
                }
                break;
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    validateEmail(field) {
        const email = field.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        this.showFieldValidation(field, isValid, 
            isValid ? '✅ Valid email' : '❌ Invalid email format');

        return isValid;
    }

    validateLicense(field) {
        const license = field.value.toUpperCase();
        const licenseRegex = /^[A-Z]{2,3}\d{6,8}$/;
        const isValid = licenseRegex.test(license);

        this.showFieldValidation(field, isValid, 
            isValid ? '✅ Valid license format' : '❌ Format: MD123456');

        return isValid;
    }

    showFieldValidation(field, isValid, message) {
        // Remove existing validation classes
        field.classList.remove('is-valid', 'is-invalid');
        
        // Add appropriate class
        field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        
        // Show validation message
        console.log(`${field.name || field.id}: ${message}`);
    }

    clearValidation(field) {
        field.classList.remove('is-valid', 'is-invalid');
    }

    async handleSubmit() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.showLoading(true);

        try {
            const formData = this.getFormData();
            
            // Validate form
            if (!this.validateForm(formData)) {
                throw new Error('Please fix the form errors before submitting');
            }

            // Submit to backend
            const result = await this.submitDoctorRegistration(formData);
            
            if (result.success) {
                this.handleSuccessfulRegistration(result);
            } else {
                throw new Error(result.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    getFormData() {
        const form = document.getElementById('doctorRegistrationForm');
        const formData = new FormData(form);
        
        return {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            licenseNumber: formData.get('licenseNumber'),
            yearsExperience: formData.get('yearsExperience'),
            medicalSchool: formData.get('medicalSchool'),
            specialty: this.selectedSpecialty,
            role: 'doctor'
        };
    }

    validateForm(data) {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'licenseNumber', 'yearsExperience', 'medicalSchool'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showNotification(`❌ ${field} is required`, 'error');
                return false;
            }
        }

        if (!this.selectedSpecialty) {
            this.showNotification('❌ Please select a medical specialty', 'error');
            return false;
        }

        // Validate email format
        if (!this.validateEmail(document.getElementById('email'))) {
            return false;
        }

        // Validate license format
        if (!this.validateLicense(document.getElementById('licenseNumber'))) {
            return false;
        }

        return true;
    }

    async submitDoctorRegistration(data) {
        const payload = {
            email: data.email,
            password: this.generatePassword(), // Generate secure password
            full_name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            role: 'doctor',
            license_number: data.licenseNumber,
            years_experience: data.yearsExperience,
            medical_school: data.medicalSchool,
            specialty: data.specialty
        };

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

    generatePassword() {
        // Generate a secure password for the doctor
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    handleSuccessfulRegistration(result) {
        // Save doctor data
        localStorage.setItem('doctorData', JSON.stringify(result.doctor));
        localStorage.setItem('userRole', 'doctor');
        localStorage.setItem('isAuthenticated', 'true');

        // Show success message
        this.showNotification(
            `🎉 Welcome Dr. ${result.doctor.full_name}! Registration successful. You will receive login credentials via email.`, 
            'success'
        );

        // Redirect to doctor dashboard
        setTimeout(() => {
            window.location.href = 'doctor-dashboard.html';
        }, 3000);
    }

    showLoading(show) {
        const btn = document.querySelector('.submit-btn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');

        if (show) {
            btnText.style.display = 'none';
            spinner.classList.add('show');
            btn.disabled = true;
        } else {
            btnText.style.display = 'block';
            spinner.classList.remove('show');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DoctorRegistrationSystem();
});
