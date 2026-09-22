/**
 * API Client for ER Wait Time Application
 * Handles all communication with the Django backend
 */

class APIClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'https://api.mywaitime.com/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ER Wait Time API Methods

    /**
     * Get ER wait times for nearby hospitals
     */
    async getERWaitTimes(lat, lng, radius = 25) {
        return this.get('/er-wait-times/', {
            lat: lat,
            lng: lng,
            radius: radius
        });
    }

    /**
     * Update ER wait time for a hospital
     */
    async updateERWaitTime(hospitalId, waitTime, severity) {
        return this.post('/er-wait-times/update/', {
            hospital_id: hospitalId,
            wait_time: waitTime,
            severity: severity
        });
    }

    // Hospital API Methods

    /**
     * Search for hospitals
     */
    async searchHospitals(query, lat = null, lng = null, radius = 25) {
        const params = { query, radius };
        if (lat && lng) {
            params.lat = lat;
            params.lng = lng;
        }
        return this.get('/hospitals/search/', params);
    }

    /**
     * Get hospital details
     */
    async getHospitalDetails(hospitalId) {
        return this.get(`/hospitals/${hospitalId}/`);
    }

    /**
     * Get nearby hospitals
     */
    async getNearbyHospitals(lat, lng, radius = 25) {
        return this.get('/hospitals/nearby/', {
            lat: lat,
            lng: lng,
            radius: radius
        });
    }

    // Chat API Methods

    /**
     * Send chat message
     */
    async sendChatMessage(message, userId = null) {
        return this.post('/chat/send/', {
            message: message,
            user_id: userId
        });
    }

    /**
     * Get chat history
     */
    async getChatHistory(userId = null, limit = 50) {
        return this.get('/chat/history/', {
            user_id: userId,
            limit: limit
        });
    }

    // Registration API Methods

    /**
     * Submit patient registration
     */
    async submitRegistration(registrationData) {
        return this.post('/registration/submit/', registrationData);
    }

    /**
     * Get registration status
     */
    async getRegistrationStatus(registrationId) {
        return this.get(`/registration/${registrationId}/status/`);
    }

    /**
     * Update registration
     */
    async updateRegistration(registrationId, updateData) {
        return this.put(`/registration/${registrationId}/`, updateData);
    }

    // Records API Methods

    /**
     * Get patient records
     */
    async getPatientRecords(patientId) {
        return this.get(`/records/patient/${patientId}/`);
    }

    /**
     * Get medical records
     */
    async getMedicalRecords(patientId, recordType = null) {
        const params = {};
        if (recordType) {
            params.type = recordType;
        }
        return this.get(`/records/medical/${patientId}/`, params);
    }

    /**
     * Add medical record
     */
    async addMedicalRecord(patientId, recordData) {
        return this.post(`/records/medical/${patientId}/`, recordData);
    }

    // Directions API Methods

    /**
     * Get directions between two points
     */
    async getDirections(origin, destination, mode = 'driving') {
        return this.get('/directions/', {
            origin: origin,
            destination: destination,
            mode: mode
        });
    }

    /**
     * Get hospital directions
     */
    async getHospitalDirections(hospitalId, userLocation) {
        return this.get(`/directions/hospital/${hospitalId}/`, {
            lat: userLocation.lat,
            lng: userLocation.lng
        });
    }

    // User API Methods

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        return this.get(`/users/${userId}/`);
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, profileData) {
        return this.put(`/users/${userId}/`, profileData);
    }

    /**
     * Create user account
     */
    async createUser(userData) {
        return this.post('/users/create/', userData);
    }

    // Utility Methods

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            const response = await this.get('/health/');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    /**
     * Get API version
     */
    async getVersion() {
        return this.get('/version/');
    }

    /**
     * Handle API errors
     */
    handleError(error, context = '') {
        console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message.includes('Failed to fetch')) {
            message = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('HTTP 404')) {
            message = 'The requested resource was not found.';
        } else if (error.message.includes('HTTP 500')) {
            message = 'Server error. Please try again later.';
        } else if (error.message.includes('HTTP 401')) {
            message = 'Authentication required. Please log in.';
        } else if (error.message.includes('HTTP 403')) {
            message = 'Access denied. You do not have permission to perform this action.';
        }
        
        return {
            error: true,
            message: message,
            details: error.message
        };
    }

    /**
     * Set authentication token
     */
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Clear authentication token
     */
    clearAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
