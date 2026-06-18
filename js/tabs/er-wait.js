/**
 * ER Wait Time Tab Manager
 * Handles ER wait time display and updates
 */

class ERWaitManager {
    constructor() {
        this.currentLocation = null;
        this.hospitals = [];
        this.waitTimes = [];
        this.updateInterval = null;
    }

    /**
     * Initialize the ER Wait Time tab
     */
    async init() {
        try {
            // Create the enhanced UI
            this.createEnhancedUI();
            
            // Get user location
            await this.getUserLocation();
            
            // Load initial data
            await this.loadWaitTimes();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('ER Wait Time tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ER Wait Time tab:', error);
            this.showError('Failed to load ER wait times. Please try again.');
        }
    }

    /**
     * Create enhanced UI with manual location controls
     */
    createEnhancedUI() {
        const tabContent = document.getElementById('tab-content');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <!-- Enhanced ER Wait Time Interface -->
            <div class="er-wait-container">
                <!-- Header Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <h2 class="mb-1">
                                    <i class="fas fa-clock text-primary me-2"></i>
                                    Emergency Room Wait Times
                                </h2>
                                <p class="text-muted mb-0">Real-time hospital wait times in your area</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary" id="refresh-wait-times" title="Refresh Data">
                                    <i class="fas fa-sync-alt"></i>
                                    <span class="d-none d-md-inline ms-1">Refresh</span>
                                </button>
                                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#locationModal" title="Change Location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span class="d-none d-md-inline ms-1">Location</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Location Controls -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="location-controls card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-map-marker-alt text-success me-2"></i>
                                        <div id="location-info">
                                            <span class="text-muted">Getting location...</span>
                                        </div>
                                    </div>
                                    <div class="location-buttons d-flex gap-2">
                                        <button class="btn btn-outline-success btn-sm" id="refresh-location" title="Refresh Current Location">
                                            <i class="fas fa-crosshairs"></i>
                                            <span class="d-none d-sm-inline ms-1">Current</span>
                                        </button>
                                        <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#locationModal" title="Manual Location">
                                            <i class="fas fa-edit"></i>
                                            <span class="d-none d-sm-inline ms-1">Manual</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="stats-overview row" id="stats-overview">
                            <!-- Stats will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Wait Times Container -->
                <div class="row">
                    <div class="col-12">
                        <div id="wait-times-container">
                            <!-- Wait times will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Location Modal -->
            <div class="modal fade" id="locationModal" tabindex="-1" aria-labelledby="locationModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="locationModalLabel">
                                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                                Set Your Location
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Manual Location Input -->
                                <div class="col-md-6">
                                    <h6 class="fw-semibold mb-3">
                                        <i class="fas fa-keyboard me-2"></i>
                                        Manual Entry
                                    </h6>
                                    <form id="manual-location-form">
                                        <div class="mb-3">
                                            <label for="address-input" class="form-label">Address or City</label>
                                            <input type="text" class="form-control" id="address-input" 
                                                   placeholder="Enter address, city, or ZIP code" 
                                                   value="">
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="city-input" class="form-label">City</label>
                                                    <input type="text" class="form-control" id="city-input" 
                                                           placeholder="City">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="state-input" class="form-label">State</label>
                                                    <input type="text" class="form-control" id="state-input" 
                                                           placeholder="State">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="zip-input" class="form-label">ZIP Code</label>
                                                    <input type="text" class="form-control" id="zip-input" 
                                                           placeholder="ZIP Code">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="radius-select" class="form-label">Search Radius</label>
                                                    <select class="form-select" id="radius-select">
                                                        <option value="10">10 miles</option>
                                                        <option value="25" selected>25 miles</option>
                                                        <option value="50">50 miles</option>
                                                        <option value="100">100 miles</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-grid">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-search me-2"></i>
                                                Search Hospitals
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <!-- Current Location -->
                                <div class="col-md-6">
                                    <h6 class="fw-semibold mb-3">
                                        <i class="fas fa-crosshairs me-2"></i>
                                        Current Location
                                    </h6>
                                    <div class="current-location-info p-3 bg-light rounded">
                                        <div class="d-flex align-items-center mb-3">
                                            <i class="fas fa-map-marker-alt text-success me-2"></i>
                                            <span class="fw-medium">Use GPS Location</span>
                                        </div>
                                        <p class="text-muted small mb-3">
                                            Allow access to your current location for the most accurate results.
                                        </p>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-success" id="use-current-location">
                                                <i class="fas fa-crosshairs me-2"></i>
                                                Use Current Location
                                            </button>
                                            <button class="btn btn-outline-secondary" id="detect-location">
                                                <i class="fas fa-location-arrow me-2"></i>
                                                Detect Location
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Location Status -->
                                    <div class="mt-3">
                                        <div class="alert alert-info" id="location-status" style="display: none;">
                                            <i class="fas fa-info-circle me-2"></i>
                                            <span id="location-status-text">Getting location...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Update Wait Time Modal -->
            <div class="modal fade" id="updateWaitTimeModal" tabindex="-1" aria-labelledby="updateWaitTimeModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="updateWaitTimeModalLabel">
                                <i class="fas fa-clock text-warning me-2"></i>
                                Update Wait Time
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="update-wait-time-form">
                                <input type="hidden" id="update-hospital-id">
                                
                                <div class="mb-3">
                                    <label for="wait-time-minutes" class="form-label">Wait Time (minutes)</label>
                                    <input type="number" class="form-control" id="wait-time-minutes" 
                                           placeholder="Enter wait time in minutes" min="0" max="480" 
                                           style="pointer-events: auto; user-select: auto;" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="severity-level" class="form-label">Severity Level</label>
                                    <select class="form-select" id="severity-level" 
                                            style="pointer-events: auto; user-select: auto;" required>
                                        <option value="low">Low (≤30 minutes)</option>
                                        <option value="medium" selected>Medium (31-60 minutes)</option>
                                        <option value="high">High (61-120 minutes)</option>
                                        <option value="critical">Critical (>120 minutes)</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="additional-notes" class="form-label">Additional Notes (Optional)</label>
                                    <textarea class="form-control" id="additional-notes" rows="3" 
                                              placeholder="Any additional information about current wait times..."
                                              style="pointer-events: auto; user-select: auto;"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submit-wait-time-update">
                                <i class="fas fa-save me-2"></i>
                                Update Wait Time
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get user's current location
     */
    async getUserLocation() {
        try {
            if (window.utils) {
                this.currentLocation = await window.utils.getUserLocation();
                this.updateLocationDisplay();
            } else {
                // Fallback to default location
                this.currentLocation = {
                    lat: 27.9506,
                    lng: -82.4572,
                    city: 'Tampa',
                    state: 'FL'
                };
                this.updateLocationDisplay();
            }
        } catch (error) {
            console.error('Failed to get user location:', error);
            // Use default location
            this.currentLocation = {
                lat: 27.9506,
                lng: -82.4572,
                city: 'Tampa',
                state: 'FL'
            };
            this.updateLocationDisplay();
        }
    }

    /**
     * Update location display
     */
    updateLocationDisplay() {
        const locationInfo = document.getElementById('location-info');
        if (locationInfo && this.currentLocation) {
            const radius = this.currentLocation.radius || 25;
            locationInfo.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex align-items-center">
                        <span class="fw-medium">${this.currentLocation.city}, ${this.currentLocation.state}</span>
                    </div>
                    <div class="d-flex align-items-center text-muted small">
                        <i class="fas fa-crosshairs me-1"></i>
                        <span>${radius} mile radius</span>
                        <span class="mx-2">•</span>
                        <span>${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Load wait times from Django API
     */
    async loadWaitTimes() {
        try {
            if (!this.currentLocation) {
                throw new Error('No location available');
            }

            // Show loading state
            this.showLoading();

            // Test Django API connection first
            const isConnected = await window.djangoAPI.testConnection();
            if (!isConnected) {
                console.warn('Django API not available, using fallback data');
                this.loadMockData();
                this.updateWaitTimesDisplay();
                this.updateStatsDisplay();
                this.hideLoading();
                return;
            }

            // Get wait times from Django API
            const radius = this.currentLocation.radius || 25;
            const response = await window.djangoAPI.getERWaitTimes(
                    this.currentLocation.lat,
                    this.currentLocation.lng,
                radius
                );
                
                this.waitTimes = response.wait_times || [];
                this.hospitals = response.hospitals || [];

            // Update display
            this.updateWaitTimesDisplay();
            this.updateStatsDisplay();

            console.log(`✅ Loaded ${this.hospitals.length} hospitals from Django API`);

        } catch (error) {
            console.error('Failed to load wait times from Django API:', error);
            console.log('Falling back to mock data...');
            this.loadMockData();
            this.updateWaitTimesDisplay();
            this.updateStatsDisplay();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load mock data for development
     */
    loadMockData() {
        this.hospitals = [
            {
                id: 1,
                name: 'Tampa General Hospital',
                address: '1 Tampa General Cir, Tampa, FL 33606',
                distance: 2.3,
                wait_time: 45,
                severity: 'medium'
            },
            {
                id: 2,
                name: 'St. Joseph\'s Hospital',
                address: '3001 W Dr Martin Luther King Jr Blvd, Tampa, FL 33607',
                distance: 4.1,
                wait_time: 30,
                severity: 'low'
            },
            {
                id: 3,
                name: 'AdventHealth Tampa',
                address: '3100 E Fletcher Ave, Tampa, FL 33613',
                distance: 6.7,
                wait_time: 90,
                severity: 'high'
            }
        ];

        this.waitTimes = this.hospitals.map(hospital => ({
            hospital_id: hospital.id,
            wait_time: hospital.wait_time,
            severity: hospital.severity,
            last_updated: new Date().toISOString()
        }));
    }

    /**
     * Update wait times display
     */
    updateWaitTimesDisplay() {
        const container = document.getElementById('wait-times-container');
        if (!container) return;

        if (this.hospitals.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-hospital fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Hospitals Found</h5>
                    <p class="text-muted">No hospitals found in your area. Please try expanding your search radius.</p>
                </div>
            `;
            return;
        }

        const hospitalsHtml = this.hospitals.map((hospital, index) => {
            const waitTimeStatus = this.getWaitTimeStatus(hospital.wait_time);
            const distance = hospital.distance && !isNaN(hospital.distance) ? 
                `${hospital.distance.toFixed(1)} mi` : 
                (this.currentLocation ? 
                    `${this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, hospital.latitude, hospital.longitude).toFixed(1)} mi` : 
                    'Unknown');
            const waitTime = `${hospital.wait_time} min`;
            const performanceScore = hospital.performance_score || 0;
            const performanceGrade = hospital.performance_grade || 'N/A';
            const aiRating = parseFloat(hospital.ai_rating) || 0;

            return `
                <div class="wait-time-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge bg-primary me-2">#${index + 1}</span>
                                <h5 class="hospital-name mb-0">${hospital.name}</h5>
                            </div>
                            <p class="hospital-address mb-2">
                                <i class="fas fa-map-marker-alt me-1"></i>${hospital.address || 'Address not available'}
                            </p>
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="hospital-distance mb-1">
                                <i class="fas fa-route me-1"></i>${distance} away
                            </p>
                                    <p class="hospital-phone mb-0">
                                        <i class="fas fa-phone me-1"></i>${hospital.phone || 'Phone not available'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <div class="performance-info">
                                        <small class="text-muted d-block">
                                            <i class="fas fa-star me-1"></i>AI Rating: ${aiRating.toFixed(1)}/10
                                        </small>
                                        <small class="text-muted d-block">
                                            <i class="fas fa-chart-line me-1"></i>Performance: ${performanceGrade}
                                        </small>
                                        <small class="text-muted d-block">
                                            <i class="fas fa-comments me-1"></i>Reviews: ${hospital.feedback_count || 0}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-center">
                            <div class="wait-time-number ${waitTimeStatus.class}">${waitTime}</div>
                            <div class="wait-time-label">Wait Time</div>
                            <div class="wait-time-status mb-2">
                                <span class="status-badge status-${waitTimeStatus.status}">${waitTimeStatus.label}</span>
                            </div>
                            <div class="capacity-status">
                                <span class="badge bg-${hospital.capacity_status === 'low' ? 'success' : hospital.capacity_status === 'medium' ? 'warning' : 'danger'}">
                                    ${hospital.capacity_status || 'Unknown'} Capacity
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="hospital-actions">
                                <button class="btn btn-primary btn-sm" onclick="erWaitManager.updateWaitTime('${hospital.id}')">
                                    <i class="fas fa-edit me-1"></i>Update Wait Time
                                </button>
                                <button class="btn btn-info btn-sm" onclick="erWaitManager.viewHospitalDetails('${hospital.id}')">
                                    <i class="fas fa-info-circle me-1"></i>Details
                                </button>
                                <button class="btn btn-success btn-sm" onclick="erWaitManager.getDirections('${hospital.id}')">
                                    <i class="fas fa-directions me-1"></i>Directions
                                </button>
                                <button class="btn btn-warning btn-sm" onclick="erWaitManager.viewHospitalPerformance('${hospital.id}')">
                                    <i class="fas fa-chart-bar me-1"></i>Performance
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = hospitalsHtml;
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const statsContainer = document.getElementById('stats-overview');
        if (!statsContainer) return;

        const stats = this.calculateStats();
        
        statsContainer.innerHTML = `
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number text-primary">${stats.totalHospitals}</div>
                    <div class="stat-label">Hospitals</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number text-success">${stats.averageWaitTime}</div>
                    <div class="stat-label">Avg Wait Time</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number text-warning">${stats.shortestWaitTime}</div>
                    <div class="stat-label">Shortest Wait</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-number text-info">${stats.lastUpdated}</div>
                    <div class="stat-label">Last Updated</div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        const totalHospitals = this.hospitals.length;
        const waitTimes = this.hospitals.map(h => h.wait_time).filter(wt => wt !== null);
        const averageWaitTime = waitTimes.length > 0 ? 
            Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
        const shortestWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;
        const lastUpdated = new Date().toLocaleTimeString();

        return {
            totalHospitals,
            averageWaitTime: window.utils ? window.utils.formatWaitTime(averageWaitTime) : `${averageWaitTime} min`,
            shortestWaitTime: window.utils ? window.utils.formatWaitTime(shortestWaitTime) : `${shortestWaitTime} min`,
            lastUpdated
        };
    }

    /**
     * Get wait time status
     */
    getWaitTimeStatus(minutes) {
        if (minutes <= 30) {
            return { status: 'low', class: 'text-success', label: 'Low' };
        } else if (minutes <= 60) {
            return { status: 'medium', class: 'text-warning', label: 'Medium' };
        } else if (minutes <= 120) {
            return { status: 'high', class: 'text-warning', label: 'High' };
        } else {
            return { status: 'critical', class: 'text-danger', label: 'Critical' };
        }
    }

    /**
     * Update wait time for a hospital
     */
    updateWaitTime(hospitalId) {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        if (!hospital) {
            console.error('Hospital not found for ID:', hospitalId);
            return;
        }

        console.log('Updating wait time for hospital:', hospital.name, hospitalId);

        // Wait for modal to be ready, then populate fields
        setTimeout(() => {
            const hospitalIdInput = document.getElementById('update-hospital-id');
            const waitTimeInput = document.getElementById('wait-time-minutes');
            const severityInput = document.getElementById('severity-level');
            const notesInput = document.getElementById('additional-notes');

            console.log('🔍 Modal elements found:', {
                hospitalIdInput: !!hospitalIdInput,
                waitTimeInput: !!waitTimeInput,
                severityInput: !!severityInput,
                notesInput: !!notesInput
            });

            if (hospitalIdInput) {
                hospitalIdInput.value = hospitalId;
                hospitalIdInput.disabled = false;
                console.log('✅ Hospital ID set:', hospitalId);
            }
            
            if (waitTimeInput) {
                waitTimeInput.value = hospital.wait_time || '';
                waitTimeInput.disabled = false;
                waitTimeInput.readOnly = false;
                waitTimeInput.focus();
                console.log('✅ Wait time input set:', hospital.wait_time);
            }
            
            if (severityInput) {
                severityInput.value = hospital.severity || 'medium';
                severityInput.disabled = false;
                console.log('✅ Severity level set:', hospital.severity || 'medium');
            }
            
            if (notesInput) {
                notesInput.value = '';
                notesInput.disabled = false;
                notesInput.readOnly = false;
                console.log('✅ Notes input cleared and enabled');
            }

            console.log('✅ Modal fields populated for:', hospital.name);
        }, 100);

        // Show modal
        const modalElement = document.getElementById('updateWaitTimeModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Remove any existing event listeners to prevent duplicates
        modalElement.removeEventListener('shown.bs.modal', this.handleModalShown);
        
        // Add event listener for when modal is fully shown
        this.handleModalShown = () => {
            console.log('Modal fully shown, re-initializing inputs...');
            
            // Re-enable all inputs
            const waitTimeInput = document.getElementById('wait-time-minutes');
            const severityInput = document.getElementById('severity-level');
            const notesInput = document.getElementById('additional-notes');
            
            if (waitTimeInput) {
                waitTimeInput.disabled = false;
                waitTimeInput.readOnly = false;
                waitTimeInput.style.pointerEvents = 'auto';
                waitTimeInput.style.userSelect = 'auto';
                waitTimeInput.focus();
            }
            
            if (severityInput) {
                severityInput.disabled = false;
                severityInput.style.pointerEvents = 'auto';
                severityInput.style.userSelect = 'auto';
            }
            
            if (notesInput) {
                notesInput.disabled = false;
                notesInput.readOnly = false;
                notesInput.style.pointerEvents = 'auto';
                notesInput.style.userSelect = 'auto';
            }
        };
        
        modalElement.addEventListener('shown.bs.modal', this.handleModalShown);
        
        modal.show();
        console.log('Wait time modal opened for:', hospital.name);
        
        // Add cleanup when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            console.log('Modal hidden, cleaning up...');
            modalElement.removeEventListener('shown.bs.modal', this.handleModalShown);
        });
    }

    /**
     * Submit wait time update via Django API
     */
    async submitWaitTimeUpdate() {
        try {
            console.log('🔄 Starting wait time update process...');
            
            const hospitalId = document.getElementById('update-hospital-id').value;
            const waitTime = parseInt(document.getElementById('wait-time-minutes').value);
            const severity = document.getElementById('severity-level').value;
            const notes = document.getElementById('additional-notes').value;

            console.log('📝 Form data:', { hospitalId, waitTime, severity, notes });

            if (!waitTime || waitTime < 0) {
                throw new Error('Please enter a valid wait time');
            }

            if (!hospitalId) {
                throw new Error('Hospital ID is missing');
            }

            // Test Django API connection
            console.log('🔗 Testing Django API connection...');
            const isConnected = await window.djangoAPI.testConnection();
            console.log('🔗 API connection test result:', isConnected);
            
            if (!isConnected) {
                throw new Error('Unable to connect to hospital database. Please try again later.');
            }

            // Update via Django API
            console.log('📡 Sending update request to Django API...');
            const response = await window.djangoAPI.updateHospitalWaitTime(hospitalId, waitTime, severity, notes);
            
            console.log('✅ Wait time updated via Django API:', response);

            // Update local data
            const hospital = this.hospitals.find(h => h.id == hospitalId);
            if (hospital) {
                hospital.wait_time = waitTime;
                hospital.severity = severity;
                hospital.last_updated = new Date().toISOString();
                
                // Update the wait time in the API client's data
                if (window.djangoAPI && window.djangoAPI.hospitals) {
                    const apiHospital = window.djangoAPI.hospitals.find(h => h.id === hospitalId);
                    if (apiHospital) {
                        apiHospital.wait_time_prediction = waitTime;
                    }
                }
            }

            // Update display
            this.updateWaitTimesDisplay();
            this.updateStatsDisplay();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateWaitTimeModal'));
            modal.hide();

            // Show success message
            if (window.app) {
                window.app.showNotification('Wait time updated successfully in hospital database!', 'success');
            }

        } catch (error) {
            console.error('❌ Failed to update wait time:', error);
            if (window.app) {
                window.app.showNotification(`Failed to update wait time: ${error.message}`, 'danger');
            }
        }
    }

    /**
     * View hospital details
     */
    async viewHospitalDetails(hospitalId) {
        try {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
            if (!hospital) {
                console.error('Hospital not found for ID:', hospitalId);
                return;
            }

            console.log('🏥 Fetching detailed hospital information...');
            
            // Get detailed hospital information from Django API
            const detailedHospital = await window.djangoAPI.getHospitalDetails(hospitalId);
            
            // Show hospital details modal with comprehensive information
            this.showHospitalDetailsModal(detailedHospital);
            
        } catch (error) {
            console.error('Error fetching hospital details:', error);
            // Fallback to navigation to hospital tab
        if (window.app) {
            window.app.navigateToTab('hospital');
            setTimeout(() => {
                if (window.hospitalManager) {
                    window.hospitalManager.showHospitalDetails(hospitalId);
                }
            }, 500);
            }
        }
    }

    /**
     * Show hospital details modal
     */
    showHospitalDetailsModal(hospital) {
        const modalHtml = `
            <div class="modal fade" id="hospitalDetailsModal" tabindex="-1" aria-labelledby="hospitalDetailsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="hospitalDetailsModalLabel">
                                <i class="fas fa-hospital text-primary me-2"></i>
                                ${hospital.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="fw-semibold">Contact Information</h6>
                                    <p><i class="fas fa-map-marker-alt text-danger me-2"></i>${hospital.address}</p>
                                    <p><i class="fas fa-city text-info me-2"></i>${hospital.city}, ${hospital.state} ${hospital.country}</p>
                                    <p><i class="fas fa-phone text-success me-2"></i>${hospital.phone || 'N/A'}</p>
                                    <p><i class="fas fa-envelope text-primary me-2"></i>${hospital.email || 'N/A'}</p>
                                    ${hospital.website ? `<p><i class="fas fa-globe text-warning me-2"></i><a href="${hospital.website}" target="_blank">Visit Website</a></p>` : ''}
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-semibold">Current Status</h6>
                                    <p><i class="fas fa-clock text-warning me-2"></i>Wait Time: <strong>${hospital.wait_time || hospital.wait_time_prediction || 'N/A'} minutes</strong></p>
                                    <p><i class="fas fa-star text-warning me-2"></i>AI Rating: <strong>${hospital.ai_rating ? hospital.ai_rating.toFixed(1) : 'N/A'}/10</strong></p>
                                    <p><i class="fas fa-chart-line text-success me-2"></i>Performance: <strong>${hospital.performance_grade || 'N/A'}</strong></p>
                                    <p><i class="fas fa-users text-info me-2"></i>Capacity: <strong>${hospital.capacity_status || 'Unknown'}</strong></p>
                                </div>
                            </div>
                            
                            ${hospital.specialties && hospital.specialties.length > 0 ? `
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6 class="fw-semibold">Specialties</h6>
                                    <div class="specialties-container">
                                        ${hospital.specialties.map(specialty => 
                                            `<span class="badge bg-secondary me-2 mb-2">${specialty}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${hospital.category_scores && Object.keys(hospital.category_scores).length > 0 ? `
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6 class="fw-semibold">Performance Breakdown</h6>
                                    <div class="performance-breakdown">
                                        ${Object.entries(hospital.category_scores).map(([category, score]) => `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span class="text-capitalize">${category.replace('_', ' ')}:</span>
                                                <span class="badge ${score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-danger'}">${score}/5</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="erWaitManager.getDirections('${hospital.id}')">
                                <i class="fas fa-directions me-1"></i>Get Directions
                            </button>
                            <button type="button" class="btn btn-warning" onclick="erWaitManager.viewHospitalPerformance('${hospital.id}')">
                                <i class="fas fa-chart-bar me-1"></i>View Performance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('hospitalDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('hospitalDetailsModal'));
        modal.show();
    }

    /**
     * View hospital performance data
     */
    async viewHospitalPerformance(hospitalId) {
        try {
            const hospital = this.hospitals.find(h => h.id === hospitalId);
            if (!hospital) {
                throw new Error('Hospital not found');
            }

            // Test Django API connection
            const isConnected = await window.djangoAPI.testConnection();
            if (!isConnected) {
                throw new Error('Unable to connect to hospital database');
            }

            // Get performance data from Django API
            const performanceData = await window.djangoAPI.getHospitalPerformance(hospitalId);
            
            // Show performance modal
            this.showHospitalPerformanceModal(hospital, performanceData);

        } catch (error) {
            console.error('Error viewing hospital performance:', error);
            if (window.app) {
                window.app.showNotification(`Failed to load performance data: ${error.message}`, 'danger');
            }
        }
    }

    /**
     * Show hospital performance modal
     */
    showHospitalPerformanceModal(hospital, performanceData) {
        const modalHtml = `
            <div class="modal fade" id="hospitalPerformanceModal" tabindex="-1" aria-labelledby="hospitalPerformanceModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="hospitalPerformanceModalLabel">
                                <i class="fas fa-chart-bar text-warning me-2"></i>
                                Hospital Performance - ${hospital.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="fw-semibold">Overall Performance</h6>
                                    <div class="performance-score mb-3">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span>Performance Score:</span>
                                            <span class="badge bg-primary fs-6">${hospital.performance_score.toFixed(1)}/10</span>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span>Performance Grade:</span>
                                            <span class="badge bg-success fs-6">${hospital.performance_grade}</span>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span>AI Rating:</span>
                                            <span class="badge bg-info fs-6">${(parseFloat(hospital.ai_rating) || 0).toFixed(1)}/10</span>
                                        </div>
                                    </div>
                                    
                                    <h6 class="fw-semibold">Category Scores</h6>
                                    <div class="category-scores">
                                        ${Object.entries(hospital.category_scores || {}).map(([category, score]) => `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span class="text-capitalize">${category.replace('_', ' ')}:</span>
                                                <span class="badge bg-secondary">${score}/5</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <h6 class="fw-semibold">Hospital Information</h6>
                                    <div class="hospital-info">
                                        <p><strong>Address:</strong> ${hospital.address}</p>
                                        <p><strong>City:</strong> ${hospital.city}, ${hospital.state}</p>
                                        <p><strong>Phone:</strong> ${hospital.phone || 'Not available'}</p>
                                        <p><strong>Website:</strong> ${hospital.website ? `<a href="${hospital.website}" target="_blank">${hospital.website}</a>` : 'Not available'}</p>
                                        <p><strong>Capacity Status:</strong> 
                                            <span class="badge bg-${hospital.capacity_status === 'low' ? 'success' : hospital.capacity_status === 'medium' ? 'warning' : 'danger'}">
                                                ${hospital.capacity_status || 'Unknown'}
                                            </span>
                                        </p>
                                        <p><strong>Total Reviews:</strong> ${hospital.feedback_count || 0}</p>
                                    </div>
                                    
                                    <h6 class="fw-semibold">Specialties</h6>
                                    <div class="specialties">
                                        ${(hospital.specialties || []).map(specialty => 
                                            `<span class="badge bg-light text-dark me-1 mb-1">${specialty}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            ${performanceData && performanceData.trends ? `
                                <div class="row mt-4">
                                    <div class="col-12">
                                        <h6 class="fw-semibold">Performance Trends</h6>
                                        <div class="performance-trends">
                                            <!-- Performance trends would be displayed here -->
                                            <p class="text-muted">Performance trend data available via Django API</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="erWaitManager.viewHospitalDetails('${hospital.id}')">
                                <i class="fas fa-info-circle me-1"></i>View Full Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('hospitalPerformanceModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('hospitalPerformanceModal'));
        modal.show();
    }

    /**
     * Get directions to hospital
     */
    async getDirections(hospitalId) {
        try {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
            if (!hospital) {
                console.error('Hospital not found for ID:', hospitalId);
                return;
            }

            console.log('🗺️ Getting directions to hospital...');
            
            // Get directions URL from Django API
            const directionsData = await window.djangoAPI.getDirections(hospitalId);
            
            if (directionsData && directionsData.directions_url) {
                // Open directions in new tab
                window.open(directionsData.directions_url, '_blank');
                
                if (window.app) {
                    window.app.showNotification(`Directions to ${hospital.name} opened in new tab`, 'success');
                }
            } else {
                // Fallback to local directions tab
        if (window.app) {
            window.app.navigateToTab('directions');
            setTimeout(() => {
                const destinationInput = document.getElementById('destination-input');
                if (destinationInput) {
                    destinationInput.value = hospital.address;
                }
            }, 500);
                }
            }
            
        } catch (error) {
            console.error('Error getting directions:', error);
            
            // Fallback to navigation to directions tab
            const hospital = this.hospitals.find(h => h.id === hospitalId);
            if (hospital && window.app) {
                window.app.navigateToTab('directions');
                setTimeout(() => {
                    const destinationInput = document.getElementById('destination-input');
                    if (destinationInput) {
                        destinationInput.value = hospital.address;
                    }
                }, 500);
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Refresh location button
        const refreshLocationBtn = document.getElementById('refresh-location');
        if (refreshLocationBtn) {
            refreshLocationBtn.addEventListener('click', () => {
                this.getUserLocation().then(() => {
                    this.loadWaitTimes();
                });
            });
        }

        // Refresh wait times button
        const refreshWaitTimesBtn = document.getElementById('refresh-wait-times');
        if (refreshWaitTimesBtn) {
            refreshWaitTimesBtn.addEventListener('click', () => {
                this.loadWaitTimes();
            });
        }

        // Submit wait time update
        const submitBtn = document.getElementById('submit-wait-time-update');
        if (submitBtn) {
            console.log('✅ Submit button found, attaching event listener');
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🖱️ Submit button clicked!');
                this.submitWaitTimeUpdate();
            });
        } else {
            console.error('❌ Submit button not found!');
        }

        // Manual location form
        const manualLocationForm = document.getElementById('manual-location-form');
        if (manualLocationForm) {
            console.log('✅ Manual location form found and event listener attached');
            manualLocationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Manual location form submitted');
                this.handleManualLocation();
            });
        } else {
            console.warn('❌ Manual location form not found');
        }

        // Use current location button
        const useCurrentLocationBtn = document.getElementById('use-current-location');
        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => {
                this.useCurrentLocation();
            });
        }

        // Detect location button
        const detectLocationBtn = document.getElementById('detect-location');
        if (detectLocationBtn) {
            detectLocationBtn.addEventListener('click', () => {
                this.detectLocation();
            });
        }

        // Address input autocomplete
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            console.log('✅ Address input found');
            addressInput.addEventListener('input', this.debounce((e) => {
                this.handleAddressInput(e.target.value);
            }, 300));
        } else {
            console.warn('❌ Address input not found');
        }

        // Test form elements
        const cityInput = document.getElementById('city-input');
        const stateInput = document.getElementById('state-input');
        const zipInput = document.getElementById('zip-input');
        const radiusSelect = document.getElementById('radius-select');
        
        console.log('Form elements check:', {
            addressInput: !!addressInput,
            cityInput: !!cityInput,
            stateInput: !!stateInput,
            zipInput: !!zipInput,
            radiusSelect: !!radiusSelect
        });
    }

    /**
     * Handle manual location input
     */
    async handleManualLocation() {
        try {
            const addressInput = document.getElementById('address-input').value.trim();
            const cityInput = document.getElementById('city-input').value.trim();
            const stateInput = document.getElementById('state-input').value.trim();
            const zipInput = document.getElementById('zip-input').value.trim();
            const radius = document.getElementById('radius-select').value;

            console.log('Manual location input:', { addressInput, cityInput, stateInput, zipInput, radius });

            if (!addressInput && !cityInput && !stateInput && !zipInput) {
                this.showLocationError('Please enter at least one location field.');
                return;
            }

            this.showLocationStatus('Processing location...', 'info');

            // Try to geocode the address
            const location = await this.geocodeAddress({
                address: addressInput,
                city: cityInput,
                state: stateInput,
                zip: zipInput
            });

            console.log('Geocoded location:', location);

            if (location && location.lat && location.lng) {
                this.currentLocation = {
                    ...location,
                    radius: parseInt(radius)
                };
                
                console.log('Updated current location:', this.currentLocation);
                
                this.updateLocationDisplay();
                this.loadWaitTimes();
                this.hideLocationModal();
                this.showLocationSuccess('Location updated successfully!');
            } else {
                this.showLocationError('Could not find the specified location. Please try a different address.');
            }

        } catch (error) {
            console.error('Error handling manual location:', error);
            this.showLocationError(`Failed to process location: ${error.message}`);
        }
    }

    /**
     * Use current GPS location
     */
    async useCurrentLocation() {
        try {
            this.showLocationStatus('Getting current location...', 'info');
            
            const radius = document.getElementById('radius-select').value;
            const location = await this.getCurrentGPSLocation();
            
            if (location) {
                this.currentLocation = {
                    ...location,
                    radius: parseInt(radius)
                };
                this.updateLocationDisplay();
                this.loadWaitTimes();
                this.hideLocationModal();
                this.showLocationSuccess('Current location updated successfully!');
            } else {
                this.showLocationError('Could not get your current location. Please try manual entry.');
            }
        } catch (error) {
            console.error('Error getting current location:', error);
            this.showLocationError('Failed to get current location. Please try manual entry.');
        }
    }

    /**
     * Detect location using browser geolocation
     */
    async detectLocation() {
        try {
            this.showLocationStatus('Detecting location...', 'info');
            
            const location = await this.getCurrentGPSLocation();
            
            if (location) {
                // Populate the form fields
                document.getElementById('address-input').value = `${location.city}, ${location.state}`;
                document.getElementById('city-input').value = location.city || '';
                document.getElementById('state-input').value = location.state || '';
                
                this.showLocationStatus('Location detected successfully!', 'success');
            } else {
                this.showLocationError('Could not detect location. Please try manual entry.');
            }
        } catch (error) {
            console.error('Error detecting location:', error);
            this.showLocationError('Failed to detect location. Please try manual entry.');
        }
    }

    /**
     * Get current GPS location
     */
    async getCurrentGPSLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        
                        // Reverse geocode to get address
                        const address = await this.reverseGeocode(latitude, longitude);
                        
                        resolve({
                            lat: latitude,
                            lng: longitude,
                            city: address.city || 'Unknown City',
                            state: address.state || 'Unknown State',
                            address: address.fullAddress || `${address.city}, ${address.state}`
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    /**
     * Geocode address to coordinates
     */
    async geocodeAddress(addressData) {
        const { address, city, state, zip } = addressData;
        
        console.log('Geocoding address:', addressData);
        
        // Try to use TomTom geocoding API if available
        if (window.djangoAPI && window.djangoAPI.makeRequest) {
            try {
                const response = await window.djangoAPI.makeRequest('/tomtom/geocode/', {
                    method: 'POST',
                    body: JSON.stringify({
                        address: address || `${city}, ${state} ${zip}`.trim(),
                        city: city,
                        state: state,
                        zip: zip
                    })
                });
                
                if (response.status === 'success' && response.data) {
                    return {
                        lat: parseFloat(response.data.latitude),
                        lng: parseFloat(response.data.longitude),
                        city: response.data.city || city || 'Unknown',
                        state: response.data.state || state || 'Unknown',
                        address: response.data.formatted_address || address || `${city}, ${state}`.trim()
                    };
                }
            } catch (error) {
                console.warn('TomTom geocoding failed, using fallback:', error);
            }
        }
        
        // Fallback to mock geocoding with better logic
        let lat, lng, finalCity, finalState;
        
        // Use known coordinates for major cities
        const cityCoordinates = {
            'tampa': { lat: 27.9506, lng: -82.4572 },
            'miami': { lat: 25.7617, lng: -80.1918 },
            'orlando': { lat: 28.5383, lng: -81.3792 },
            'jacksonville': { lat: 30.3322, lng: -81.6557 },
            'tallahassee': { lat: 30.4518, lng: -84.2807 },
            'fort lauderdale': { lat: 26.1224, lng: -80.1373 },
            'st petersburg': { lat: 27.7676, lng: -82.6403 },
            'hialeah': { lat: 25.8576, lng: -80.2781 },
            'port st lucie': { lat: 27.2730, lng: -80.3582 },
            'cape coral': { lat: 26.5629, lng: -81.9495 }
        };
        
        const cityKey = (city || '').toLowerCase().trim();
        if (cityCoordinates[cityKey]) {
            const coords = cityCoordinates[cityKey];
            lat = coords.lat;
            lng = coords.lng;
            finalCity = city || 'Unknown';
            finalState = state || 'FL';
        } else {
            // Default to Tampa area with some variation
            lat = 27.9506 + (Math.random() - 0.5) * 0.2;
            lng = -82.4572 + (Math.random() - 0.5) * 0.2;
            finalCity = city || 'Tampa';
            finalState = state || 'FL';
        }
        
        const mockLocation = {
            lat: lat,
            lng: lng,
            city: finalCity,
            state: finalState,
            address: address || `${finalCity}, ${finalState}`.trim()
        };
        
        console.log('Fallback geocoding result:', mockLocation);
        return mockLocation;
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng) {
        // Mock reverse geocoding - in real implementation, call actual reverse geocoding service
        return {
            city: 'Tampa',
            state: 'FL',
            fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };
    }

    /**
     * Handle address input with autocomplete
     */
    handleAddressInput(value) {
        if (value.length > 2) {
            // In a real implementation, you would call an autocomplete API
            console.log('Address autocomplete for:', value);
        }
    }

    /**
     * Show location status message
     */
    showLocationStatus(message, type = 'info') {
        const statusElement = document.getElementById('location-status');
        const statusText = document.getElementById('location-status-text');
        
        console.log(`Location status: ${type} - ${message}`);
        
        if (statusElement && statusText) {
            statusElement.className = `alert alert-${type}`;
            statusText.textContent = message;
            statusElement.style.display = 'block';
        } else {
            console.warn('Location status elements not found');
        }
    }

    /**
     * Hide location status
     */
    hideLocationStatus() {
        const statusElement = document.getElementById('location-status');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }

    /**
     * Show location error
     */
    showLocationError(message) {
        this.showLocationStatus(message, 'danger');
    }

    /**
     * Show location success
     */
    showLocationSuccess(message) {
        this.showLocationStatus(message, 'success');
        setTimeout(() => {
            this.hideLocationStatus();
        }, 3000);
    }

    /**
     * Hide location modal
     */
    hideLocationModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
        if (modal) {
            modal.hide();
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Debounce function for input handling
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
     * Set up auto-refresh
     */
    setupAutoRefresh() {
        // Refresh every 5 minutes
        this.updateInterval = setInterval(() => {
            this.loadWaitTimes();
        }, 5 * 60 * 1000);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById('wait-times-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Loading wait times...</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Loading state is handled by updateWaitTimesDisplay
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('wait-times-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error</strong>
                    <p class="mb-0 mt-2">${message}</p>
                    <button class="btn btn-danger btn-sm mt-2" onclick="erWaitManager.loadWaitTimes()">
                        <i class="fas fa-refresh me-1"></i>Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Cleanup when tab is closed
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Make it globally available
window.ERWaitManager = ERWaitManager;
