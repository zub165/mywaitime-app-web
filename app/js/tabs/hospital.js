/**
 * Hospital Tab Manager
 * Handles hospital search, display, and map functionality
 */

class HospitalManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.hospitals = [];
        this.currentLocation = null;
        this.searchRadius = 25;
    }

    /**
     * Initialize the Hospital tab
     */
    async init() {
        try {
            // Initialize map
            this.initializeMap();
            
            // Get user location
            await this.getUserLocation();
            
            // Load initial hospitals
            await this.loadHospitals();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Hospital tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Hospital tab:', error);
            this.showError('Failed to load hospital information. Please try again.');
        }
    }

    /**
     * Initialize the map
     */
    initializeMap() {
        const mapContainer = document.getElementById('hospital-map');
        if (!mapContainer) return;

        // Default to Tampa, FL
        const defaultLat = 27.9506;
        const defaultLng = -82.4572;

        this.map = L.map('hospital-map').setView([defaultLat, defaultLng], 11);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add user location marker
        this.addUserLocationMarker(defaultLat, defaultLng);
    }

    /**
     * Get user's current location
     */
    async getUserLocation() {
        try {
            if (window.utils) {
                this.currentLocation = await window.utils.getUserLocation();
                this.updateLocationDisplay();
                this.updateMapCenter();
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
        const locationInfo = document.getElementById('user-location-info');
        if (locationInfo && this.currentLocation) {
            locationInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-map-marker-alt text-success me-2"></i>
                    <div>
                        <div class="fw-bold">${this.currentLocation.city}, ${this.currentLocation.state}</div>
                        <small class="text-muted">${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}</small>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update map center to user location
     */
    updateMapCenter() {
        if (this.map && this.currentLocation) {
            this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 11);
            this.addUserLocationMarker(this.currentLocation.lat, this.currentLocation.lng);
        }
    }

    /**
     * Add user location marker to map
     */
    addUserLocationMarker(lat, lng) {
        if (!this.map) return;

        // Remove existing user marker
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }

        // Add new user marker
        this.userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: '<i class="fas fa-user-circle fa-2x text-primary"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);

        this.userMarker.bindPopup('<b>Your Location</b>').openPopup();
    }

    /**
     * Load hospitals from API
     */
    async loadHospitals() {
        try {
            if (!this.currentLocation) {
                throw new Error('No location available');
            }

            // Show loading state
            this.showLoading();

            // Get hospitals from Django API
            if (window.djangoAPI) {
                try {
                    const response = await window.djangoAPI.makeRequest('/hospitals/');
                    if (response.status === 'success' && response.data) {
                        this.hospitals = response.data.map(hospital => ({
                            id: hospital.id,
                            name: hospital.name,
                            address: `${hospital.address}, ${hospital.city}, ${hospital.state}`,
                            phone: hospital.phone,
                            type: 'general',
                            distance: this.calculateDistance(
                                this.currentLocation.lat, 
                                this.currentLocation.lng,
                                parseFloat(hospital.latitude),
                                parseFloat(hospital.longitude)
                            ),
                            wait_time: hospital.wait_time_prediction || 30,
                            severity: hospital.capacity_status === 'low' ? 'low' : 'medium',
                            lat: parseFloat(hospital.latitude),
                            lng: parseFloat(hospital.longitude),
                            specialties: hospital.specialties || ['General Medicine', 'Emergency Care'],
                            services: ['Emergency Room', 'ICU', 'Surgery'],
                            ai_rating: hospital.ai_rating,
                            performance_score: hospital.overall_performance_score
                        }));
                    } else {
                        this.loadMockData();
                    }
                } catch (error) {
                    console.error('Failed to fetch hospitals from Django API:', error);
                    this.loadMockData();
                }
            } else {
                // Mock data for development
                this.loadMockData();
            }

            // Update display
            this.updateHospitalList();
            this.updateMapMarkers();
            this.updateHospitalCount();

        } catch (error) {
            console.error('Failed to load hospitals:', error);
            this.showError('Failed to load hospitals. Please try again.');
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
                phone: '(813) 844-7000',
                type: 'general',
                distance: 2.3,
                wait_time: 45,
                severity: 'medium',
                lat: 27.9506,
                lng: -82.4572,
                specialties: ['Emergency Medicine', 'Cardiology', 'Neurology'],
                services: ['Emergency Room', 'ICU', 'Surgery', 'Radiology']
            },
            {
                id: 2,
                name: 'St. Joseph\'s Hospital',
                address: '3001 W Dr Martin Luther King Jr Blvd, Tampa, FL 33607',
                phone: '(813) 870-4000',
                type: 'general',
                distance: 4.1,
                wait_time: 30,
                severity: 'low',
                lat: 27.9606,
                lng: -82.4672,
                specialties: ['Emergency Medicine', 'Orthopedics', 'Pediatrics'],
                services: ['Emergency Room', 'Pediatric ICU', 'Orthopedic Surgery']
            },
            {
                id: 3,
                name: 'AdventHealth Tampa',
                address: '3100 E Fletcher Ave, Tampa, FL 33613',
                phone: '(813) 615-7000',
                type: 'general',
                distance: 6.7,
                wait_time: 90,
                severity: 'high',
                lat: 28.0406,
                lng: -82.3772,
                specialties: ['Emergency Medicine', 'Oncology', 'Cardiology'],
                services: ['Emergency Room', 'Cancer Center', 'Heart Institute']
            }
        ];
    }

    /**
     * Update hospital list display
     */
    updateHospitalList() {
        const container = document.getElementById('hospital-list');
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

        const hospitalsHtml = this.hospitals.map(hospital => {
            const distance = window.utils ? window.utils.formatDistance(hospital.distance) : `${hospital.distance} mi`;
            const waitTime = window.utils ? window.utils.formatWaitTime(hospital.wait_time) : `${hospital.wait_time} min`;
            const waitTimeStatus = this.getWaitTimeStatus(hospital.wait_time);

            return `
                <div class="hospital-card">
                    <div class="hospital-header">
                        <h5 class="hospital-name">${hospital.name}</h5>
                        <p class="hospital-address">
                            <i class="fas fa-map-marker-alt me-1"></i>${hospital.address}
                        </p>
                    </div>
                    <div class="hospital-body">
                        <div class="hospital-info">
                            <div>
                                <span class="badge bg-primary me-2">${hospital.type}</span>
                                <span class="hospital-distance">
                                    <i class="fas fa-route me-1"></i>${distance}
                                </span>
                            </div>
                            <div class="text-end">
                                <div class="wait-time-number ${waitTimeStatus.class}">${waitTime}</div>
                                <small class="text-muted">Wait Time</small>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 class="text-primary">Specialties</h6>
                                <div class="specialties">
                                    ${hospital.specialties ? hospital.specialties.map(s => 
                                        `<span class="badge bg-light text-dark me-1 mb-1">${s}</span>`
                                    ).join('') : '<span class="text-muted">Not specified</span>'}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Services</h6>
                                <div class="services">
                                    ${hospital.services ? hospital.services.map(s => 
                                        `<span class="badge bg-light text-dark me-1 mb-1">${s}</span>`
                                    ).join('') : '<span class="text-muted">Not specified</span>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="hospital-actions">
                            <button class="btn btn-primary btn-sm" onclick="hospitalManager.showHospitalDetails(${hospital.id})">
                                <i class="fas fa-info-circle me-1"></i>Details
                            </button>
                            <button class="btn btn-success btn-sm" onclick="hospitalManager.getDirections(${hospital.id})">
                                <i class="fas fa-directions me-1"></i>Directions
                            </button>
                            <button class="btn btn-info btn-sm" onclick="hospitalManager.callHospital(${hospital.id})">
                                <i class="fas fa-phone me-1"></i>Call
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = hospitalsHtml;
    }

    /**
     * Update map markers
     */
    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add hospital markers
        this.hospitals.forEach(hospital => {
            const marker = L.marker([hospital.lat, hospital.lng], {
                icon: L.divIcon({
                    className: 'hospital-marker',
                    html: '<i class="fas fa-hospital fa-lg text-danger"></i>',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12]
                })
            }).addTo(this.map);

            marker.bindPopup(`
                <div class="hospital-popup">
                    <h6>${hospital.name}</h6>
                    <p class="mb-1">${hospital.address}</p>
                    <p class="mb-1"><strong>Wait Time:</strong> ${window.utils ? window.utils.formatWaitTime(hospital.wait_time) : `${hospital.wait_time} min`}</p>
                    <p class="mb-1"><strong>Distance:</strong> ${window.utils ? window.utils.formatDistance(hospital.distance) : `${hospital.distance} mi`}</p>
                    <div class="mt-2">
                        <button class="btn btn-primary btn-sm" onclick="hospitalManager.showHospitalDetails(${hospital.id})">
                            <i class="fas fa-info-circle me-1"></i>Details
                        </button>
                    </div>
                </div>
            `);

            this.markers.push(marker);
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Update hospital count
     */
    updateHospitalCount() {
        const countElement = document.getElementById('hospital-count');
        if (countElement) {
            countElement.textContent = this.hospitals.length;
        }
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
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
     * Show hospital details modal
     */
    showHospitalDetails(hospitalId) {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        if (!hospital) return;

        // Update modal title
        document.getElementById('modal-hospital-name').textContent = hospital.name;

        // Update modal content
        const content = document.getElementById('hospital-details-content');
        if (content) {
            const distance = window.utils ? window.utils.formatDistance(hospital.distance) : `${hospital.distance} mi`;
            const waitTime = window.utils ? window.utils.formatWaitTime(hospital.wait_time) : `${hospital.wait_time} min`;

            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary">Contact Information</h6>
                        <p><i class="fas fa-map-marker-alt me-2"></i>${hospital.address}</p>
                        <p><i class="fas fa-phone me-2"></i>${hospital.phone}</p>
                        <p><i class="fas fa-route me-2"></i>${distance} away</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary">Current Status</h6>
                        <p><i class="fas fa-clock me-2"></i>Wait Time: <strong>${waitTime}</strong></p>
                        <p><i class="fas fa-hospital me-2"></i>Type: <strong>${hospital.type}</strong></p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6 class="text-primary">Specialties</h6>
                        <div class="specialties">
                            ${hospital.specialties ? hospital.specialties.map(s => 
                                `<span class="badge bg-primary me-1 mb-1">${s}</span>`
                            ).join('') : '<span class="text-muted">Not specified</span>'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary">Services</h6>
                        <div class="services">
                            ${hospital.services ? hospital.services.map(s => 
                                `<span class="badge bg-info me-1 mb-1">${s}</span>`
                            ).join('') : '<span class="text-muted">Not specified</span>'}
                        </div>
                    </div>
                </div>
            `;
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('hospitalDetailsModal'));
        modal.show();
    }

    /**
     * Get directions to hospital
     */
    getDirections(hospitalId) {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        if (!hospital) return;

        // Navigate to directions tab
        if (window.app) {
            window.app.navigateToTab('directions');
            // Set destination after navigation
            setTimeout(() => {
                const destinationInput = document.getElementById('destination-input');
                if (destinationInput) {
                    destinationInput.value = hospital.address;
                }
            }, 500);
        }
    }

    /**
     * Call hospital
     */
    callHospital(hospitalId) {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        if (!hospital || !hospital.phone) return;

        window.open(`tel:${hospital.phone}`, '_self');
    }

    /**
     * Search hospitals
     */
    async searchHospitals() {
        const searchQuery = document.getElementById('hospital-search').value;
        const hospitalType = document.getElementById('hospital-type').value;
        const radius = parseInt(document.getElementById('search-radius').value);

        this.searchRadius = radius;

        try {
            // Show loading state
            this.showLoading();

            // Perform search
            if (window.apiClient) {
                const response = await window.apiClient.searchHospitals(
                    searchQuery,
                    this.currentLocation.lat,
                    this.currentLocation.lng,
                    radius
                );
                
                this.hospitals = response.hospitals || [];
            } else {
                // Filter mock data
                this.filterMockData(searchQuery, hospitalType);
            }

            // Update display
            this.updateHospitalList();
            this.updateMapMarkers();
            this.updateHospitalCount();

        } catch (error) {
            console.error('Failed to search hospitals:', error);
            this.showError('Failed to search hospitals. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Filter mock data based on search criteria
     */
    filterMockData(searchQuery, hospitalType) {
        let filtered = [...this.hospitals];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(hospital => 
                hospital.name.toLowerCase().includes(query) ||
                hospital.address.toLowerCase().includes(query) ||
                (hospital.specialties && hospital.specialties.some(s => s.toLowerCase().includes(query)))
            );
        }

        if (hospitalType) {
            filtered = filtered.filter(hospital => hospital.type === hospitalType);
        }

        this.hospitals = filtered;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search button
        const searchBtn = document.getElementById('search-hospitals');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchHospitals();
            });
        }

        // Get location button
        const getLocationBtn = document.getElementById('get-location');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => {
                this.getUserLocation().then(() => {
                    this.loadHospitals();
                });
            });
        }

        // Center map button
        const centerMapBtn = document.getElementById('center-map');
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => {
                this.updateMapCenter();
            });
        }

        // Search input enter key
        const searchInput = document.getElementById('hospital-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchHospitals();
                }
            });
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById('hospital-list');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Loading hospitals...</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Loading state is handled by updateHospitalList
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('hospital-list');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error</strong>
                    <p class="mb-0 mt-2">${message}</p>
                    <button class="btn btn-danger btn-sm mt-2" onclick="hospitalManager.loadHospitals()">
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
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
    }
}

// Make it globally available
window.HospitalManager = HospitalManager;
