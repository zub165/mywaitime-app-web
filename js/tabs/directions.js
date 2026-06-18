/**
 * Directions Tab Manager
 * Handles directions and routing functionality
 */

class DirectionsManager {
    constructor() {
        this.map = null;
        this.route = null;
        this.currentLocation = null;
        this.directions = null;
    }

    /**
     * Initialize the Directions tab
     */
    async init() {
        try {
            // Initialize map
            this.initializeMap();
            
            // Get user location
            await this.getUserLocation();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Directions tab initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Directions tab:', error);
            this.showError('Failed to initialize directions. Please try again.');
        }
    }

    /**
     * Initialize the map
     */
    initializeMap() {
        const mapContainer = document.getElementById('directions-map');
        if (!mapContainer) return;

        // Default to Tampa, FL
        const defaultLat = 27.9506;
        const defaultLng = -82.4572;

        this.map = L.map('directions-map').setView([defaultLat, defaultLng], 11);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    /**
     * Get user's current location
     */
    async getUserLocation() {
        try {
            if (window.utils) {
                this.currentLocation = await window.utils.getUserLocation();
                this.updateOriginInput();
            } else {
                // Fallback to default location
                this.currentLocation = {
                    lat: 27.9506,
                    lng: -82.4572,
                    city: 'Tampa',
                    state: 'FL'
                };
                this.updateOriginInput();
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
            this.updateOriginInput();
        }
    }

    /**
     * Update origin input with current location
     */
    updateOriginInput() {
        const originInput = document.getElementById('origin-input');
        if (originInput && this.currentLocation) {
            originInput.value = `${this.currentLocation.city}, ${this.currentLocation.state}`;
        }
    }

    /**
     * Get directions
     */
    async getDirections() {
        const origin = document.getElementById('origin-input').value.trim();
        const destination = document.getElementById('destination-input').value.trim();
        const travelMode = document.getElementById('travel-mode').value;

        if (!origin || !destination) {
            this.showError('Please enter both origin and destination.');
            return;
        }

        try {
            this.showLoading();

            // Get directions from Django API
            if (window.djangoAPI) {
                const response = await window.djangoAPI.makeRequest('/directions/', {
                    method: 'GET',
                    params: {
                        origin: origin,
                        destination: destination,
                        travel_mode: travelMode
                    }
                });
                this.directions = response.directions || response.routes;
            } else {
                // Mock directions
                this.directions = this.generateMockDirections(origin, destination, travelMode);
            }

            // Display directions
            this.displayDirections();
            this.displayRouteOnMap();

        } catch (error) {
            console.error('Failed to get directions:', error);
            this.showError('Failed to get directions. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Generate mock directions
     */
    generateMockDirections(origin, destination, travelMode) {
        return {
            distance: '12.5 miles',
            duration: '25 minutes',
            steps: [
                {
                    instruction: 'Head north on Main St',
                    distance: '0.5 mi',
                    duration: '2 min'
                },
                {
                    instruction: 'Turn right onto Highway 60',
                    distance: '8.2 mi',
                    duration: '15 min'
                },
                {
                    instruction: 'Take exit 15 toward Hospital District',
                    distance: '0.3 mi',
                    duration: '1 min'
                },
                {
                    instruction: 'Turn left onto Medical Center Dr',
                    distance: '1.2 mi',
                    duration: '3 min'
                },
                {
                    instruction: 'Turn right onto Hospital Way',
                    distance: '0.3 mi',
                    duration: '1 min'
                },
                {
                    instruction: 'Arrive at destination',
                    distance: '0.0 mi',
                    duration: '0 min'
                }
            ]
        };
    }

    /**
     * Display directions
     */
    displayDirections() {
        if (!this.directions) return;

        // Show directions results
        document.getElementById('directions-results').style.display = 'block';
        document.getElementById('no-directions-message').style.display = 'none';

        // Update route info
        this.updateRouteInfo();

        // Update turn-by-turn directions
        this.updateTurnByTurnDirections();
    }

    /**
     * Update route information
     */
    updateRouteInfo() {
        const routeInfo = document.getElementById('route-info');
        if (routeInfo && this.directions) {
            routeInfo.innerHTML = `
                <div class="row text-center">
                    <div class="col-6">
                        <div class="h4 text-primary">${this.directions.distance}</div>
                        <div class="text-muted">Distance</div>
                    </div>
                    <div class="col-6">
                        <div class="h4 text-success">${this.directions.duration}</div>
                        <div class="text-muted">Duration</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update turn-by-turn directions
     */
    updateTurnByTurnDirections() {
        const container = document.getElementById('turn-by-turn-directions');
        if (!container || !this.directions) return;

        const stepsHtml = this.directions.steps.map((step, index) => `
            <div class="direction-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <div class="step-instruction">${step.instruction}</div>
                    <div class="step-distance">${step.distance} • ${step.duration}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = stepsHtml;
    }

    /**
     * Display route on map
     */
    displayRouteOnMap() {
        if (!this.map || !this.directions) return;

        // Clear existing route
        if (this.route) {
            this.map.removeLayer(this.route);
        }

        // Mock route coordinates (in real implementation, these would come from the API)
        const routeCoordinates = [
            [27.9506, -82.4572], // Origin
            [27.9606, -82.4572],
            [27.9706, -82.4472],
            [27.9806, -82.4372],
            [27.9906, -82.4272],
            [28.0006, -82.4172]  // Destination
        ];

        // Add route to map
        this.route = L.polyline(routeCoordinates, {
            color: '#007bff',
            weight: 4,
            opacity: 0.7
        }).addTo(this.map);

        // Add markers for origin and destination
        const originMarker = L.marker(routeCoordinates[0], {
            icon: L.divIcon({
                className: 'origin-marker',
                html: '<i class="fas fa-map-marker-alt fa-2x text-success"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(this.map);

        const destinationMarker = L.marker(routeCoordinates[routeCoordinates.length - 1], {
            icon: L.divIcon({
                className: 'destination-marker',
                html: '<i class="fas fa-flag-checkered fa-2x text-danger"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(this.map);

        // Fit map to show entire route
        this.map.fitBounds(this.route.getBounds().pad(0.1));

        // Add popups
        originMarker.bindPopup('<b>Origin</b><br>Your starting location');
        destinationMarker.bindPopup('<b>Destination</b><br>Your destination');
    }

    /**
     * Handle quick hospital directions
     */
    handleQuickHospitalDirections(hospitalName) {
        const destinations = {
            'tampa-general': '1 Tampa General Cir, Tampa, FL 33606',
            'st-josephs': '3001 W Dr Martin Luther King Jr Blvd, Tampa, FL 33607',
            'adventhealth': '3100 E Fletcher Ave, Tampa, FL 33613'
        };

        const destination = destinations[hospitalName];
        if (destination) {
            document.getElementById('destination-input').value = destination;
            this.getDirections();
        }
    }

    /**
     * Use current location for origin
     */
    useCurrentLocation() {
        if (this.currentLocation) {
            document.getElementById('origin-input').value = `${this.currentLocation.city}, ${this.currentLocation.state}`;
        } else {
            this.getUserLocation();
        }
    }

    /**
     * Clear directions
     */
    clearDirections() {
        document.getElementById('origin-input').value = '';
        document.getElementById('destination-input').value = '';
        document.getElementById('travel-mode').value = 'driving';
        
        document.getElementById('directions-results').style.display = 'none';
        document.getElementById('no-directions-message').style.display = 'none';
        
        if (this.route) {
            this.map.removeLayer(this.route);
            this.route = null;
        }
    }

    /**
     * Center route map
     */
    centerRouteMap() {
        if (this.map && this.route) {
            this.map.fitBounds(this.route.getBounds().pad(0.1));
        } else if (this.map) {
            this.map.setView([27.9506, -82.4572], 11);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Get directions button
        const getDirectionsBtn = document.getElementById('get-directions');
        if (getDirectionsBtn) {
            getDirectionsBtn.addEventListener('click', () => {
                this.getDirections();
            });
        }

        // Clear directions button
        const clearBtn = document.getElementById('clear-directions');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearDirections();
            });
        }

        // Use current location button
        const useCurrentLocationBtn = document.getElementById('use-current-location');
        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => {
                this.useCurrentLocation();
            });
        }

        // Center route map button
        const centerMapBtn = document.getElementById('center-route-map');
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => {
                this.centerRouteMap();
            });
        }

        // Quick hospital direction buttons
        document.querySelectorAll('[data-hospital]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hospitalName = e.currentTarget.getAttribute('data-hospital');
                this.handleQuickHospitalDirections(hospitalName);
            });
        });

        // Enter key on inputs
        const inputs = ['origin-input', 'destination-input'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.getDirections();
                    }
                });
            }
        });
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
        const getDirectionsBtn = document.getElementById('get-directions');
        if (getDirectionsBtn) {
            getDirectionsBtn.disabled = true;
            getDirectionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Getting Directions...';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const getDirectionsBtn = document.getElementById('get-directions');
        if (getDirectionsBtn) {
            getDirectionsBtn.disabled = false;
            getDirectionsBtn.innerHTML = '<i class="fas fa-directions me-1"></i>Get Directions';
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
     * Cleanup when tab is closed
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.route = null;
    }
}

// Make it globally available
window.DirectionsManager = DirectionsManager;
