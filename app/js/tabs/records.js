/**
 * Records Tab Manager
 * Handles medical records functionality
 */

class RecordsManager {
    constructor() {
        this.currentPatient = null;
        this.records = {
            visits: [],
            diagnoses: [],
            medications: [],
            labResults: [],
            imaging: [],
            procedures: []
        };
    }

    /**
     * Initialize the Records tab
     */
    async init() {
        try {
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Records tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Records tab:', error);
            this.showError('Failed to initialize records system. Please try again.');
        }
    }

    /**
     * Search for patient (Django API integration)
     */
    async searchPatient() {
        const patientId = document.getElementById('patient-id').value.trim();
        const patientName = document.getElementById('patient-name').value.trim();
        const patientDob = document.getElementById('patient-dob').value;

        if (!patientId && !patientName && !patientDob) {
            this.showError('Please enter at least one search criteria.');
            return;
        }

        try {
            this.showLoading();

            // Search for patient using Django API
            if (window.djangoAPI) {
                const response = await window.djangoAPI.searchPatients({
                    patientId,
                    patientName,
                    dateOfBirth: patientDob
                });
                
                if (response.patients && response.patients.length > 0) {
                    this.currentPatient = response.patients[0];
                    this.displayPatientInfo();
                    await this.loadPatientRecords();
                } else {
                    this.showError('No patient found with the provided information.');
                }
            } else {
                // Fallback to mock patient data
                this.currentPatient = {
                    id: 'P001',
                    name: 'John Doe',
                    dateOfBirth: '1985-06-15',
                    gender: 'Male',
                    phone: '(555) 123-4567',
                    address: '123 Main St, Tampa, FL 33601'
                };
                this.displayPatientInfo();
                this.loadMockRecords();
            }

        } catch (error) {
            console.error('Failed to search patient:', error);
            this.showError('Failed to search for patient. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display patient information
     */
    displayPatientInfo() {
        if (!this.currentPatient) return;

        const patientInfoSection = document.getElementById('patient-info-section');
        const patientDetails = document.getElementById('patient-details');

        if (patientInfoSection && patientDetails) {
            patientDetails.innerHTML = `
                <div class="col-md-3">
                    <h6 class="text-primary">Patient ID</h6>
                    <p>${this.currentPatient.id}</p>
                </div>
                <div class="col-md-3">
                    <h6 class="text-primary">Name</h6>
                    <p>${this.currentPatient.name}</p>
                </div>
                <div class="col-md-3">
                    <h6 class="text-primary">Date of Birth</h6>
                    <p>${this.currentPatient.dateOfBirth}</p>
                </div>
                <div class="col-md-3">
                    <h6 class="text-primary">Gender</h6>
                    <p>${this.currentPatient.gender}</p>
                </div>
            `;

            patientInfoSection.style.display = 'block';
            document.getElementById('records-nav-section').style.display = 'block';
            document.getElementById('records-content-section').style.display = 'block';
        }
    }

    /**
     * Load patient records (Django API integration)
     */
    async loadPatientRecords() {
        if (!this.currentPatient) return;

        try {
            if (window.djangoAPI) {
                const response = await window.djangoAPI.getPatientRecords(this.currentPatient.id);
                this.records = response.records || this.records;
                console.log('Loaded patient records from Django API:', this.records);
            } else {
                this.loadMockRecords();
            }

            // Load all record types
            await Promise.all([
                this.loadVisits(),
                this.loadDiagnoses(),
                this.loadMedications(),
                this.loadLabResults(),
                this.loadImaging(),
                this.loadProcedures()
            ]);

        } catch (error) {
            console.error('Failed to load patient records:', error);
            this.showError('Failed to load patient records. Please try again.');
        }
    }

    /**
     * Load mock records for development
     */
    loadMockRecords() {
        this.records = {
            visits: [
                {
                    id: 1,
                    date: '2024-01-15',
                    type: 'Emergency Visit',
                    provider: 'Dr. Smith',
                    reason: 'Chest pain',
                    diagnosis: 'Acute myocardial infarction',
                    treatment: 'Cardiac catheterization, stent placement'
                },
                {
                    id: 2,
                    date: '2024-01-10',
                    type: 'Follow-up',
                    provider: 'Dr. Johnson',
                    reason: 'Post-surgical follow-up',
                    diagnosis: 'Recovery from appendectomy',
                    treatment: 'Wound care, pain management'
                }
            ],
            diagnoses: [
                {
                    id: 1,
                    date: '2024-01-15',
                    diagnosis: 'Acute myocardial infarction',
                    provider: 'Dr. Smith',
                    status: 'Active',
                    notes: 'ST-elevation MI, treated with PCI'
                },
                {
                    id: 2,
                    date: '2024-01-05',
                    diagnosis: 'Acute appendicitis',
                    provider: 'Dr. Brown',
                    status: 'Resolved',
                    notes: 'Laparoscopic appendectomy performed'
                }
            ],
            medications: [
                {
                    id: 1,
                    name: 'Aspirin',
                    dosage: '81mg',
                    frequency: 'Once daily',
                    startDate: '2024-01-15',
                    provider: 'Dr. Smith',
                    status: 'Active'
                },
                {
                    id: 2,
                    name: 'Atorvastatin',
                    dosage: '40mg',
                    frequency: 'Once daily',
                    startDate: '2024-01-15',
                    provider: 'Dr. Smith',
                    status: 'Active'
                }
            ],
            labResults: [
                {
                    id: 1,
                    date: '2024-01-15',
                    test: 'Troponin I',
                    result: '15.2 ng/mL',
                    reference: '< 0.04 ng/mL',
                    status: 'Abnormal',
                    provider: 'Dr. Smith'
                },
                {
                    id: 2,
                    date: '2024-01-15',
                    test: 'Complete Blood Count',
                    result: 'Normal',
                    reference: 'Normal',
                    status: 'Normal',
                    provider: 'Dr. Smith'
                }
            ],
            imaging: [
                {
                    id: 1,
                    date: '2024-01-15',
                    type: 'Chest X-ray',
                    findings: 'Clear lung fields, normal cardiac silhouette',
                    provider: 'Dr. Radiology',
                    status: 'Completed'
                },
                {
                    id: 2,
                    date: '2024-01-15',
                    type: 'Echocardiogram',
                    findings: 'Ejection fraction 45%, mild wall motion abnormalities',
                    provider: 'Dr. Cardiology',
                    status: 'Completed'
                }
            ],
            procedures: [
                {
                    id: 1,
                    date: '2024-01-15',
                    procedure: 'Cardiac Catheterization',
                    provider: 'Dr. Smith',
                    indication: 'Acute MI',
                    outcome: 'Successful stent placement',
                    status: 'Completed'
                },
                {
                    id: 2,
                    date: '2024-01-05',
                    procedure: 'Laparoscopic Appendectomy',
                    provider: 'Dr. Brown',
                    indication: 'Acute appendicitis',
                    outcome: 'Successful removal',
                    status: 'Completed'
                }
            ]
        };
    }

    /**
     * Load visits
     */
    async loadVisits() {
        const container = document.getElementById('visits-list');
        if (!container) return;

        if (this.records.visits.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No visits found</p>';
            return;
        }

        const visitsHtml = this.records.visits.map(visit => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${visit.type}</div>
                        <div class="record-date">${visit.date}</div>
                        <div class="record-description">
                            <strong>Provider:</strong> ${visit.provider}<br>
                            <strong>Reason:</strong> ${visit.reason}<br>
                            <strong>Diagnosis:</strong> ${visit.diagnosis}<br>
                            <strong>Treatment:</strong> ${visit.treatment}
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('visits', ${visit.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = visitsHtml;
    }

    /**
     * Load diagnoses
     */
    async loadDiagnoses() {
        const container = document.getElementById('diagnoses-list');
        if (!container) return;

        if (this.records.diagnoses.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No diagnoses found</p>';
            return;
        }

        const diagnosesHtml = this.records.diagnoses.map(diagnosis => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${diagnosis.diagnosis}</div>
                        <div class="record-date">${diagnosis.date}</div>
                        <div class="record-description">
                            <strong>Provider:</strong> ${diagnosis.provider}<br>
                            <strong>Status:</strong> <span class="badge bg-${diagnosis.status === 'Active' ? 'danger' : 'success'}">${diagnosis.status}</span><br>
                            <strong>Notes:</strong> ${diagnosis.notes}
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('diagnoses', ${diagnosis.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = diagnosesHtml;
    }

    /**
     * Load medications
     */
    async loadMedications() {
        const container = document.getElementById('medications-list');
        if (!container) return;

        if (this.records.medications.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No medications found</p>';
            return;
        }

        const medicationsHtml = this.records.medications.map(medication => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${medication.name}</div>
                        <div class="record-date">Started: ${medication.startDate}</div>
                        <div class="record-description">
                            <strong>Dosage:</strong> ${medication.dosage}<br>
                            <strong>Frequency:</strong> ${medication.frequency}<br>
                            <strong>Provider:</strong> ${medication.provider}<br>
                            <strong>Status:</strong> <span class="badge bg-${medication.status === 'Active' ? 'success' : 'secondary'}">${medication.status}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('medications', ${medication.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = medicationsHtml;
    }

    /**
     * Load lab results
     */
    async loadLabResults() {
        const container = document.getElementById('lab-results-list');
        if (!container) return;

        if (this.records.labResults.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No lab results found</p>';
            return;
        }

        const labResultsHtml = this.records.labResults.map(result => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${result.test}</div>
                        <div class="record-date">${result.date}</div>
                        <div class="record-description">
                            <strong>Result:</strong> ${result.result}<br>
                            <strong>Reference:</strong> ${result.reference}<br>
                            <strong>Status:</strong> <span class="badge bg-${result.status === 'Normal' ? 'success' : 'warning'}">${result.status}</span><br>
                            <strong>Provider:</strong> ${result.provider}
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('labResults', ${result.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = labResultsHtml;
    }

    /**
     * Load imaging
     */
    async loadImaging() {
        const container = document.getElementById('imaging-list');
        if (!container) return;

        if (this.records.imaging.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No imaging studies found</p>';
            return;
        }

        const imagingHtml = this.records.imaging.map(study => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${study.type}</div>
                        <div class="record-date">${study.date}</div>
                        <div class="record-description">
                            <strong>Provider:</strong> ${study.provider}<br>
                            <strong>Findings:</strong> ${study.findings}<br>
                            <strong>Status:</strong> <span class="badge bg-success">${study.status}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('imaging', ${study.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = imagingHtml;
    }

    /**
     * Load procedures
     */
    async loadProcedures() {
        const container = document.getElementById('procedures-list');
        if (!container) return;

        if (this.records.procedures.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No procedures found</p>';
            return;
        }

        const proceduresHtml = this.records.procedures.map(procedure => `
            <div class="record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="record-type">${procedure.procedure}</div>
                        <div class="record-date">${procedure.date}</div>
                        <div class="record-description">
                            <strong>Provider:</strong> ${procedure.provider}<br>
                            <strong>Indication:</strong> ${procedure.indication}<br>
                            <strong>Outcome:</strong> ${procedure.outcome}<br>
                            <strong>Status:</strong> <span class="badge bg-success">${procedure.status}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="recordsManager.editRecord('procedures', ${procedure.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = proceduresHtml;
    }

    /**
     * Edit record
     */
    editRecord(recordType, recordId) {
        // This would open a modal to edit the record
        if (window.app) {
            window.app.showNotification('Edit record functionality coming soon!', 'info');
        }
    }

    /**
     * Add new record
     */
    addRecord(recordType) {
        // This would open a modal to add a new record
        if (window.app) {
            window.app.showNotification('Add record functionality coming soon!', 'info');
        }
    }

    /**
     * Clear search
     */
    clearSearch() {
        document.getElementById('patient-id').value = '';
        document.getElementById('patient-name').value = '';
        document.getElementById('patient-dob').value = '';
        
        this.currentPatient = null;
        document.getElementById('patient-info-section').style.display = 'none';
        document.getElementById('records-nav-section').style.display = 'none';
        document.getElementById('records-content-section').style.display = 'none';
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search patient button
        const searchBtn = document.getElementById('search-patient');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchPatient();
            });
        }

        // Clear search button
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Add record buttons
        const addButtons = [
            'add-visit', 'add-diagnosis', 'add-medication', 
            'add-lab-result', 'add-imaging', 'add-procedure'
        ];

        addButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const recordType = buttonId.replace('add-', '').replace('-', '');
                button.addEventListener('click', () => {
                    this.addRecord(recordType);
                });
            }
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        // Show loading in search results
        const containers = [
            'visits-list', 'diagnoses-list', 'medications-list',
            'lab-results-list', 'imaging-list', 'procedures-list'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Loading records...</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Loading state is handled by individual load methods
    }

    /**
     * Show error message
     */
    showError(message) {
        if (window.app) {
            window.app.showNotification(message, 'danger');
        }
    }
}

// Make it globally available
window.RecordsManager = RecordsManager;
