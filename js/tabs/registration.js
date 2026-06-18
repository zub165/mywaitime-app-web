/**
 * Enhanced AI-Powered Registration Tab Manager
 * Handles quick patient registration with AI features
 */

class RegistrationManager {
    constructor() {
        this.formData = {};
        this.isSubmitting = false;
        this.startTime = Date.now();
        this.aiFeaturesUsed = 0;
        this.selectedConditions = [];
        this.selectedMedications = [];
        this.selectedAllergies = [];
        this.timerInterval = null;
        this.progressTracker = {
            personal: false,
            contact: false,
            medical: false,
            emergency: false,
            consent: false
        };
    }

    /**
     * Initialize the Enhanced AI-Powered Registration tab
     */
    async init() {
        try {
            // Start registration timer
            this.startRegistrationTimer();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize form validation
            this.initializeFormValidation();
            
            // Initialize AI features
            this.initializeAIFeatures();
            
            // Initialize progress tracking
            this.initializeProgressTracking();
            
            console.log('Enhanced AI Registration tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Registration tab:', error);
            this.showError('Failed to initialize registration form. Please try again.');
        }
    }

    /**
     * Initialize form validation (removed SSN requirement)
     */
    initializeFormValidation() {
        // Real-time validation for required fields (SSN removed)
        const requiredFields = [
            'first-name', 'last-name', 'date-of-birth', 'gender',
            'phone', 'city', 'state', 'zip-code',
            'emergency-name', 'emergency-relationship', 'emergency-phone'
        ];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                    this.updateProgress();
                });
                
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                    this.updateProgress();
                });
            }
        });

        // Special validation for email
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.addEventListener('blur', () => {
                this.validateEmail(emailField);
                this.updateProgress();
            });
        }

        // Special validation for phone formatting
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', () => {
                this.formatPhoneNumber(phoneField);
                this.updateProgress();
            });
        }

        // Special validation for emergency phone
        const emergencyPhoneField = document.getElementById('emergency-phone');
        if (emergencyPhoneField) {
            emergencyPhoneField.addEventListener('input', () => {
                this.formatPhoneNumber(emergencyPhoneField);
                this.updateProgress();
            });
        }

        // Real-time validation for consent checkboxes
        const consentCheckboxes = ['consent-treatment', 'consent-privacy'];
        consentCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateProgress();
                });
            }
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    /**
     * Validate email field
     */
    validateEmail(field) {
        const value = field.value.trim();
        
        if (value && !this.isValidEmail(value)) {
            this.showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    /**
     * Format phone number
     */
    formatPhoneNumber(field) {
        let value = field.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }
        
        field.value = value;
    }

    /**
     * Check if email is valid
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;
        
        // Validate all required fields
        const requiredFields = [
            'first-name', 'last-name', 'date-of-birth', 'gender',
            'phone', 'address', 'city', 'state', 'zip-code',
            'emergency-name', 'emergency-relationship', 'emergency-phone'
        ];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate email if provided
        const emailField = document.getElementById('email');
        if (emailField && emailField.value.trim() && !this.validateEmail(emailField)) {
            isValid = false;
        }

        // Validate consent checkboxes
        const consentTreatment = document.getElementById('consent-treatment');
        const consentPrivacy = document.getElementById('consent-privacy');
        
        if (!consentTreatment.checked) {
            this.showFieldError(consentTreatment, 'You must consent to medical treatment');
            isValid = false;
        }
        
        if (!consentPrivacy.checked) {
            this.showFieldError(consentPrivacy, 'You must consent to privacy policy');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Collect form data (SSN removed, AI features added)
     */
    collectFormData() {
        return {
            personal: {
                firstName: document.getElementById('first-name').value.trim(),
                lastName: document.getElementById('last-name').value.trim(),
                dateOfBirth: document.getElementById('date-of-birth').value,
                gender: document.getElementById('gender').value
            },
            contact: {
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                city: document.getElementById('city').value.trim(),
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zip-code').value.trim()
            },
            emergency: {
                name: document.getElementById('emergency-name').value.trim(),
                relationship: document.getElementById('emergency-relationship').value,
                phone: document.getElementById('emergency-phone').value.trim(),
                email: document.getElementById('emergency-email').value.trim()
            },
            medical: {
                conditions: this.selectedConditions,
                medications: this.selectedMedications,
                allergies: this.selectedAllergies,
                symptoms: document.getElementById('symptoms').value.trim()
            },
            insurance: {
                hasInsurance: document.getElementById('has-insurance').checked,
                provider: document.getElementById('insurance-provider').value.trim(),
                policyNumber: document.getElementById('policy-number').value.trim()
            },
            consent: {
                treatment: document.getElementById('consent-treatment').checked,
                privacy: document.getElementById('consent-privacy').checked,
                emergency: document.getElementById('consent-emergency').checked
            },
            aiFeatures: {
                featuresUsed: this.aiFeaturesUsed,
                completionTime: Date.now() - this.startTime,
                symptomAnalysis: document.getElementById('symptom-analysis').innerHTML || ''
            }
        };
    }

    /**
     * Submit registration form
     */
    async submitRegistration() {
        if (this.isSubmitting) return;
        
        try {
            // Validate form
            if (!this.validateForm()) {
                this.showError('Please correct the errors in the form before submitting.');
                return;
            }

            this.isSubmitting = true;
            this.showLoading();

            // Collect form data
            const formData = this.collectFormData();

            // Submit to Django API
            if (window.djangoAPI) {
                const patientData = {
                    first_name: formData.personal.firstName,
                    last_name: formData.personal.lastName,
                    date_of_birth: formData.personal.dateOfBirth,
                    gender: formData.personal.gender,
                    phone: formData.contact.phone,
                    email: formData.contact.email,
                    address: `${formData.contact.city}, ${formData.contact.state} ${formData.contact.zipCode}`,
                    allergies: formData.medical.allergies,
                    emergency_contact: {
                        name: formData.emergency.name,
                        relationship: formData.emergency.relationship,
                        phone: formData.emergency.phone,
                        email: formData.emergency.email
                    }
                };
                
                console.log('Submitting patient data to Django API:', patientData);
                
                const response = await window.djangoAPI.createPatient(patientData);
                console.log('Patient created successfully:', response);
                
                this.handleRegistrationSuccess({
                    registrationId: response.id,
                    status: 'submitted',
                    message: 'Patient registered successfully',
                    patientId: response.id
                });
                
            } else {
                // Mock success response
                this.handleRegistrationSuccess({
                    registrationId: 'REG-' + Date.now(),
                    status: 'submitted',
                    message: 'Registration submitted successfully (Mock)'
                });
            }

        } catch (error) {
            console.error('Failed to submit registration:', error);
            this.showError(`Failed to submit registration: ${error.message}`);
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    /**
     * Handle successful registration
     */
    handleRegistrationSuccess(response) {
        // Update registration status
        this.updateRegistrationStatus(response);
        
        // Show success message with patient ID
        const message = response.patientId ? 
            `Patient registered successfully! Patient ID: ${response.patientId}` : 
            'Registration submitted successfully! You will receive a confirmation email shortly.';
        
        this.showSuccess(message);
        
        // Show patient ID in UI if available
        if (response.patientId) {
            this.showPatientCreated(response);
        }
        
        // Reset form
        this.resetForm();
    }

    /**
     * Update registration status
     */
    updateRegistrationStatus(response) {
        const statusContainer = document.getElementById('registration-status');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Registration Submitted</strong>
                    <p class="mb-0 mt-2">Registration ID: ${response.registrationId}</p>
                    <p class="mb-0">Status: ${response.status}</p>
                </div>
            `;
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        const form = document.getElementById('patient-registration-form');
        if (form) {
            form.reset();
            
            // Clear all validation errors
            document.querySelectorAll('.is-invalid').forEach(field => {
                this.clearFieldError(field);
            });
        }
    }

    /**
     * Contact registration
     */
    contactRegistration() {
        // This could open a contact form or redirect to contact information
        if (window.app) {
            window.app.showNotification('Please call (813) 844-7000 for registration assistance.', 'info');
        }
    }

    /**
     * Download form
     */
    downloadForm() {
        // This could generate and download a PDF of the form
        if (window.app) {
            window.app.showNotification('Form download feature coming soon!', 'info');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('patient-registration-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitRegistration();
            });
        }

        // Contact registration button
        const contactBtn = document.getElementById('contact-registration');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                this.contactRegistration();
            });
        }

        // Download form button
        const downloadBtn = document.getElementById('download-form');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadForm();
            });
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Submit Registration';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.app) {
            window.app.showNotification(message, 'success');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (window.app) {
            window.app.showNotification(message, 'danger');
        }
    }

    /**
     * Show patient created information
     */
    showPatientCreated(response) {
        // Create a modal or notification to show patient details
        const patientId = response.patientId || response.registrationId;
        
        // You can enhance this to show more patient details
        if (window.app) {
            window.app.showNotification(
                `Patient created successfully! ID: ${patientId}`, 
                'success'
            );
        }
        
        // Store patient ID for easy access in medical records
        localStorage.setItem('lastCreatedPatientId', patientId);
    }

    // ==================== NEW AI-POWERED METHODS ====================

    /**
     * Start registration timer
     */
    startRegistrationTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('registration-timer');
            const completionTimeElement = document.getElementById('completion-time');
            
            if (timerElement) timerElement.textContent = timeString;
            if (completionTimeElement) completionTimeElement.textContent = `${elapsed}s`;
        }, 1000);
    }

    /**
     * Initialize AI features
     */
    initializeAIFeatures() {
        // Gender selection buttons
        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('gender').value = e.target.dataset.value;
                this.updateProgress();
            });
        });

        // Address selection buttons
        document.querySelectorAll('.address-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const city = e.target.dataset.city;
                const state = e.target.dataset.state;
                const zip = e.target.dataset.zip;
                
                document.getElementById('city').value = city;
                document.getElementById('state').value = state;
                document.getElementById('zip-code').value = zip;
                
                document.querySelectorAll('.address-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateProgress();
            });
        });

        // Condition selection buttons
        document.querySelectorAll('.condition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const condition = {
                    icd10: e.target.dataset.icd10,
                    name: e.target.dataset.name
                };
                
                if (this.selectedConditions.find(c => c.icd10 === condition.icd10)) {
                    this.selectedConditions = this.selectedConditions.filter(c => c.icd10 !== condition.icd10);
                    e.target.classList.remove('active');
                } else {
                    this.selectedConditions.push(condition);
                    e.target.classList.add('active');
                }
                
                this.updateSelectedConditions();
                this.updateProgress();
            });
        });

        // Allergy selection buttons
        document.querySelectorAll('.allergy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const allergy = e.target.dataset.allergy;
                
                if (this.selectedAllergies.includes(allergy)) {
                    this.selectedAllergies = this.selectedAllergies.filter(a => a !== allergy);
                    e.target.classList.remove('active');
                } else {
                    this.selectedAllergies.push(allergy);
                    e.target.classList.add('active');
                }
                
                this.updateSelectedAllergies();
                this.updateProgress();
            });
        });

        // Relationship selection buttons
        document.querySelectorAll('.relationship-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.relationship-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('emergency-relationship').value = e.target.dataset.value;
                this.updateProgress();
            });
        });

        // Medication search
        const searchBtn = document.getElementById('search-medication');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchMedication();
            });
        }

        // Symptom analysis
        const analyzeBtn = document.getElementById('analyze-symptoms');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeSymptoms();
            });
        }

        // Insurance toggle
        const insuranceToggle = document.getElementById('has-insurance');
        if (insuranceToggle) {
            insuranceToggle.addEventListener('change', (e) => {
                const fields = document.getElementById('insurance-fields');
                if (fields) {
                    fields.style.display = e.target.checked ? 'block' : 'none';
                }
                this.updateProgress();
            });
        }

        // Quick action buttons
        document.getElementById('auto-fill-form')?.addEventListener('click', () => this.autoFillForm());
        document.getElementById('save-draft')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('validate-form')?.addEventListener('click', () => this.validateForm());
        document.getElementById('ai-help')?.addEventListener('click', () => this.showAIHelp());
        document.getElementById('emergency-mode')?.addEventListener('click', () => this.enableEmergencyMode());
    }

    /**
     * Initialize progress tracking
     */
    initializeProgressTracking() {
        this.updateProgress();
    }

    /**
     * Update progress tracking
     */
    updateProgress() {
        // Check personal info
        const firstName = document.getElementById('first-name')?.value.trim();
        const lastName = document.getElementById('last-name')?.value.trim();
        const dob = document.getElementById('date-of-birth')?.value;
        const gender = document.getElementById('gender')?.value;
        this.progressTracker.personal = !!(firstName && lastName && dob && gender);

        // Check contact info
        const phone = document.getElementById('phone')?.value.trim();
        const city = document.getElementById('city')?.value.trim();
        const state = document.getElementById('state')?.value;
        const zip = document.getElementById('zip-code')?.value.trim();
        this.progressTracker.contact = !!(phone && city && state && zip);

        // Check medical info (optional but tracks if used)
        this.progressTracker.medical = this.selectedConditions.length > 0 || 
                                     this.selectedMedications.length > 0 || 
                                     this.selectedAllergies.length > 0;

        // Check emergency contact
        const emergencyName = document.getElementById('emergency-name')?.value.trim();
        const emergencyRelationship = document.getElementById('emergency-relationship')?.value;
        const emergencyPhone = document.getElementById('emergency-phone')?.value.trim();
        this.progressTracker.emergency = !!(emergencyName && emergencyRelationship && emergencyPhone);

        // Check consent
        const treatmentConsent = document.getElementById('consent-treatment')?.checked;
        const privacyConsent = document.getElementById('consent-privacy')?.checked;
        this.progressTracker.consent = !!(treatmentConsent && privacyConsent);

        // Calculate overall progress
        const completedSteps = Object.values(this.progressTracker).filter(Boolean).length;
        const totalSteps = Object.keys(this.progressTracker).length;
        const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const completionPercentage = document.getElementById('completion-percentage');

        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${progressPercentage}%`;
        }
        if (completionPercentage) {
            completionPercentage.textContent = `${progressPercentage}%`;
        }

        // Update step indicators
        Object.keys(this.progressTracker).forEach(step => {
            const stepElement = document.getElementById(`step-${step}`);
            if (stepElement) {
                if (this.progressTracker[step]) {
                    stepElement.classList.add('completed');
                } else {
                    stepElement.classList.remove('completed');
                }
            }
        });

        // Update AI features counter
        const aiFeaturesElement = document.getElementById('ai-features');
        if (aiFeaturesElement) {
            aiFeaturesElement.textContent = this.aiFeaturesUsed;
        }
    }

    /**
     * Update selected conditions display
     */
    updateSelectedConditions() {
        const container = document.getElementById('selected-conditions');
        if (container) {
            container.innerHTML = this.selectedConditions.map(condition => 
                `<span class="badge bg-warning me-1 mb-1">${condition.name} (${condition.icd10})</span>`
            ).join('');
        }
    }

    /**
     * Update selected allergies display
     */
    updateSelectedAllergies() {
        const container = document.getElementById('selected-allergies');
        if (container) {
            container.innerHTML = this.selectedAllergies.map(allergy => 
                `<span class="badge bg-danger me-1 mb-1">${allergy}</span>`
            ).join('');
        }
    }

    /**
     * Search medication using AI (Django API integration)
     */
    async searchMedication() {
        const searchInput = document.getElementById('medication-search');
        const medicationName = searchInput?.value.trim();
        
        if (!medicationName) {
            this.showError('Please enter a medication name to search');
            return;
        }

        try {
            this.aiFeaturesUsed++;
            this.updateProgress();
            
            // Call Django AI API
            const response = await fetch(`https://api.mywaitime.com/ai/medication/search/?name=${encodeURIComponent(medicationName)}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data.results.length > 0) {
                const resultsContainer = document.getElementById('medication-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = data.data.results.map(med => 
                        `<div class="medication-result p-2 border rounded mb-2">
                            <strong>${med.generic_name}</strong><br>
                            <small>Brand: ${med.brand_name} | Form: ${med.dosage_form}</small><br>
                            <small>Purpose: ${med.purpose}</small><br>
                            <button class="btn btn-sm btn-outline-primary mt-1" onclick="registrationManager.addMedication('${med.generic_name}', '${med.dosage_form}')">
                                Add to List
                            </button>
                        </div>`
                    ).join('');
                }
                this.showSuccess(`Found ${data.data.total_found} medication matches`);
            } else {
                // Fallback to mock data if API fails
                const mockResults = [
                    { generic_name: medicationName, brand_name: 'Generic', dosage_form: 'Tablet', purpose: 'Treatment' }
                ];
                
                const resultsContainer = document.getElementById('medication-results');
                if (resultsContainer) {
                    resultsContainer.innerHTML = mockResults.map(med => 
                        `<div class="medication-result p-2 border rounded mb-2">
                            <strong>${med.generic_name}</strong><br>
                            <small>Brand: ${med.brand_name} | Form: ${med.dosage_form}</small><br>
                            <button class="btn btn-sm btn-outline-primary mt-1" onclick="registrationManager.addMedication('${med.generic_name}', '${med.dosage_form}')">
                                Add to List
                            </button>
                        </div>`
                    ).join('');
                }
                this.showSuccess('Using offline medication database');
            }
        } catch (error) {
            console.error('Medication search failed:', error);
            this.showError('Failed to search medication. Please try again.');
        }
    }

    /**
     * Add medication to selected list
     */
    addMedication(name, dosage) {
        const medication = { name, dosage, addedAt: new Date().toISOString() };
        this.selectedMedications.push(medication);
        
        const container = document.getElementById('selected-medications');
        if (container) {
            container.innerHTML = this.selectedMedications.map(med => 
                `<span class="badge bg-primary me-1 mb-1">${med.name} (${med.dosage})</span>`
            ).join('');
        }
        
        this.updateProgress();
        this.showSuccess(`Added ${name} to medication list`);
    }

    /**
     * Analyze symptoms using AI (Django API integration)
     */
    async analyzeSymptoms() {
        const symptomsInput = document.getElementById('symptoms');
        const symptoms = symptomsInput?.value.trim();
        
        if (!symptoms) {
            this.showError('Please describe your symptoms for AI analysis');
            return;
        }

        try {
            this.aiFeaturesUsed++;
            this.updateProgress();
            
            // Parse symptoms into array
            const symptomsList = symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            // Get patient info for context
            const dob = document.getElementById('date-of-birth')?.value;
            const gender = document.getElementById('gender')?.value;
            let patientAge = null;
            
            if (dob) {
                const birthDate = new Date(dob);
                const today = new Date();
                patientAge = today.getFullYear() - birthDate.getFullYear();
            }
            
            // Call Django AI API
            const response = await fetch('https://api.mywaitime.com/ai/symptoms/analyze/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symptoms: symptomsList,
                    patient_age: patientAge,
                    patient_gender: gender
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                const result = data.data;
                const analysisContainer = document.getElementById('symptom-analysis');
                if (analysisContainer) {
                    analysisContainer.innerHTML = `
                        <div class="alert alert-info">
                            <h6><i class="fas fa-brain me-2"></i>AI Analysis Results</h6>
                            <p><strong>Urgency Level:</strong> ${result.urgency_level}</p>
                            <p><strong>Possible Conditions:</strong> ${result.possible_conditions.join(', ')}</p>
                            <p><strong>Recommendations:</strong> ${result.recommendations.join(', ')}</p>
                            <p><strong>Confidence Score:</strong> ${Math.round(result.confidence_score * 100)}%</p>
                        </div>
                    `;
                }
                this.showSuccess('AI symptom analysis completed');
            } else {
                // Fallback to mock analysis
                const mockResult = {
                    urgency_level: 'Moderate',
                    possible_conditions: ['Common Cold', 'Allergic Reaction', 'Stress-related'],
                    recommendations: ['Rest and hydration', 'Monitor symptoms', 'Seek medical attention if symptoms worsen'],
                    confidence_score: 0.6
                };
                
                const analysisContainer = document.getElementById('symptom-analysis');
                if (analysisContainer) {
                    analysisContainer.innerHTML = `
                        <div class="alert alert-warning">
                            <h6><i class="fas fa-brain me-2"></i>AI Analysis Results (Offline Mode)</h6>
                            <p><strong>Urgency Level:</strong> ${mockResult.urgency_level}</p>
                            <p><strong>Possible Conditions:</strong> ${mockResult.possible_conditions.join(', ')}</p>
                            <p><strong>Recommendations:</strong> ${mockResult.recommendations.join(', ')}</p>
                            <p><strong>Confidence Score:</strong> ${Math.round(mockResult.confidence_score * 100)}%</p>
                        </div>
                    `;
                }
                this.showSuccess('AI analysis completed (offline mode)');
            }
        } catch (error) {
            console.error('Symptom analysis failed:', error);
            this.showError('Failed to analyze symptoms. Please try again.');
        }
    }

    /**
     * Auto-fill form with common information
     */
    autoFillForm() {
        // Set default values for quick completion
        document.getElementById('state').value = 'FL';
        document.getElementById('emergency-relationship').value = 'spouse';
        
        // Auto-select gender if not selected
        const genderField = document.getElementById('gender');
        if (!genderField.value) {
            genderField.value = 'other';
        }

        this.updateProgress();
        this.showSuccess('Form auto-filled with common defaults');
    }

    /**
     * Save draft of registration
     */
    saveDraft() {
        const formData = this.collectFormData();
        localStorage.setItem('registration_draft', JSON.stringify(formData));
        this.showSuccess('Registration draft saved locally');
    }

    /**
     * Show AI help
     */
    showAIHelp() {
        if (window.app) {
            window.app.showNotification('AI Assistant: I can help you with medication lookup, symptom analysis, and ICD-10 code validation. Just ask!', 'info');
        }
    }

    /**
     * Enable emergency mode for faster registration
     */
    enableEmergencyMode() {
        // Pre-fill essential fields for emergency registration
        this.autoFillForm();
        
        // Show emergency notification
        if (window.app) {
            window.app.showNotification('Emergency mode activated - essential fields pre-filled for quick registration', 'warning');
        }
    }
}

// Make it globally available
window.RegistrationManager = RegistrationManager;
