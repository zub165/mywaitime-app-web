/**
 * Django API Client for ER Wait Time Application
 * Handles all API communications with the Django backend
 */

class DjangoAPIClient {
    constructor() {
        this.baseURL = 'https://api.mywaitime.com/api';
        this.timeout = 10000; // 10 seconds
    }

    /**
     * Make HTTP request to Django API
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: this.timeout,
            ...options
        };

        try {
            console.log(`🔄 API Request: ${config.method} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response: ${url}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${url}`, error);
            throw error;
        }
    }

    /**
     * Get hospitals by location
     */
    async getHospitalsByLocation(latitude, longitude, radius = 25) {
        try {
            const response = await this.makeRequest(
                `/hospitals/search/?lat=${latitude}&lon=${longitude}&radius=${radius * 1609.34}` // Convert miles to meters
            );
            
            if (response.status === 'success') {
                return this.formatHospitalData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch hospitals');
            }
        } catch (error) {
            console.error('Error fetching hospitals by location:', error);
            throw error;
        }
    }

    /**
     * Get all hospitals
     */
    async getAllHospitals() {
        try {
            const response = await this.makeRequest('/hospitals/');
            
            if (response.status === 'success') {
                return this.formatHospitalData(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch hospitals');
            }
        } catch (error) {
            console.error('Error fetching all hospitals:', error);
            throw error;
        }
    }

    /**
     * Get hospital details by ID
     */
    async getHospitalDetails(hospitalId) {
        try {
            const response = await this.makeRequest(`/hospitals/${hospitalId}/`);
            
            if (response.status === 'success') {
                return this.formatHospitalData([response.data])[0];
            } else {
                throw new Error(response.message || 'Hospital not found');
            }
        } catch (error) {
            console.error('Error fetching hospital details:', error);
            throw error;
        }
    }

    /**
     * Update hospital wait time
     */
    async updateHospitalWaitTime(hospitalId, waitTime, severity = 'medium', notes = '') {
        try {
            const response = await this.makeRequest(`/hospitals/${hospitalId}/update-wait-time/`, {
                method: 'PUT',
                body: JSON.stringify({
                    wait_time_prediction: waitTime,
                    severity: severity,
                    notes: notes
                })
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update wait time');
            }
        } catch (error) {
            console.error('Error updating hospital wait time:', error);
            throw error;
        }
    }

    /**
     * Get smart wait time prediction for hospital
     */
    async getSmartWaitTime(hospitalId) {
        try {
            const response = await this.makeRequest(`/hospitals/${hospitalId}/smart-wait-time/`);
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to get smart wait time');
            }
        } catch (error) {
            console.error('Error getting smart wait time:', error);
            throw error;
        }
    }

    /**
     * Submit feedback for hospital
     */
    async submitHospitalFeedback(hospitalId, feedbackData) {
        try {
            const response = await this.makeRequest('/feedback/submit/', {
                method: 'POST',
                body: JSON.stringify({
                    hospital_id: hospitalId,
                    ...feedbackData
                })
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    }

    /**
     * Get hospital performance data
     */
    async getHospitalPerformance(hospitalId) {
        try {
            const response = await this.makeRequest(`/hospitals/${hospitalId}/performance/`);
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to get hospital performance');
            }
        } catch (error) {
            console.error('Error getting hospital performance:', error);
            throw error;
        }
    }

    /**
     * Get top performing hospitals
     */
    async getTopPerformingHospitals() {
        try {
            const response = await this.makeRequest('/hospitals/top-performing/');
            
            if (response.status === 'success') {
                return this.formatHospitalData(response.data);
            } else {
                throw new Error(response.message || 'Failed to get top performing hospitals');
            }
        } catch (error) {
            console.error('Error getting top performing hospitals:', error);
            throw error;
        }
    }

    /**
     * Update ER capacity
     */
    async updateERCapacity(hospitalId, capacityData) {
        try {
            const response = await this.makeRequest(`/hospitals/${hospitalId}/er-capacity/`, {
                method: 'PUT',
                body: JSON.stringify(capacityData)
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update ER capacity');
            }
        } catch (error) {
            console.error('Error updating ER capacity:', error);
            throw error;
        }
    }

    /**
     * Get hospital statistics
     */
    async getHospitalStats() {
        try {
            const response = await this.makeRequest('/hospitals/stats/');
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to get hospital statistics');
            }
        } catch (error) {
            console.error('Error getting hospital stats:', error);
            throw error;
        }
    }

    /**
     * Format hospital data for frontend consumption
     */
    formatHospitalData(hospitals) {
        return hospitals.map(hospital => ({
            id: hospital.id,
            name: hospital.name,
            address: hospital.address,
            city: hospital.city,
            state: hospital.state,
            country: hospital.country,
            phone: hospital.phone,
            email: hospital.email,
            website: hospital.website,
            latitude: parseFloat(hospital.latitude),
            longitude: parseFloat(hospital.longitude),
            wait_time: parseInt(hospital.wait_time_prediction) || 20,
            severity: this.determineSeverity(hospital.wait_time_prediction || 20),
            specialties: hospital.specialties || [],
            ai_rating: parseFloat(hospital.ai_rating) || 0,
            performance_score: parseFloat(hospital.overall_performance_score) || 0,
            performance_grade: hospital.performance_grade || 'N/A',
            capacity_status: hospital.capacity_status || 'unknown',
            distance: null, // Will be calculated by frontend
            last_updated: hospital.updated_at,
            feedback_count: hospital.total_feedback_count || 0,
            category_scores: hospital.category_scores || {}
        }));
    }

    /**
     * Determine wait time severity based on minutes
     */
    determineSeverity(minutes) {
        if (minutes <= 30) return 'low';
        if (minutes <= 60) return 'medium';
        if (minutes <= 120) return 'high';
        return 'critical';
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
     * Add distance to hospitals based on user location
     */
    addDistancesToHospitals(hospitals, userLat, userLon) {
        return hospitals.map(hospital => {
            const distance = this.calculateDistance(userLat, userLon, hospital.latitude, hospital.longitude);
            console.log(`Distance for ${hospital.name}: ${distance.toFixed(2)} miles`);
            return {
                ...hospital,
                distance: distance
            };
        }).sort((a, b) => a.distance - b.distance); // Sort by distance
    }

    /**
     * Get ER wait times for location (main method for ER Wait Time tab)
     */
    async getERWaitTimes(latitude, longitude, radius = 25) {
        try {
            console.log(`🔍 Getting ER wait times for location: ${latitude}, ${longitude} (${radius} miles)`);
            
            // Get hospitals by location
            const hospitals = await this.getHospitalsByLocation(latitude, longitude, radius);
            
            // Add distances to hospitals
            const hospitalsWithDistance = this.addDistancesToHospitals(hospitals, latitude, longitude);
            
            // Create wait times array
            const waitTimes = hospitalsWithDistance.map(hospital => ({
                hospital_id: hospital.id,
                wait_time: hospital.wait_time,
                severity: hospital.severity,
                last_updated: hospital.last_updated,
                distance: hospital.distance
            }));

            return {
                hospitals: hospitalsWithDistance,
                wait_times: waitTimes,
                total_count: hospitalsWithDistance.length,
                search_location: {
                    latitude,
                    longitude,
                    radius
                }
            };
        } catch (error) {
            console.error('Error getting ER wait times:', error);
            throw error;
        }
    }

    /**
     * Get directions to hospital
     */
    async getDirections(hospitalId) {
        try {
            const response = await this.makeRequest(`/directions/?hospital_id=${hospitalId}`);
            
            if (response.status === 'success') {
                return response;
            } else {
                throw new Error(response.message || 'Failed to get directions');
            }
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await this.makeRequest('/hospitals/stats/');
            return response.status === 'success';
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }

    // ==================== PATIENT AND MEDICAL RECORDS METHODS ====================

    /**
     * Search for patients
     */
    async searchPatients(searchCriteria) {
        try {
            const params = new URLSearchParams();
            
            if (searchCriteria.patientId) params.append('patient_id', searchCriteria.patientId);
            if (searchCriteria.patientName) params.append('patient_name', searchCriteria.patientName);
            if (searchCriteria.dateOfBirth) params.append('patient_dob', searchCriteria.dateOfBirth);
            
            const response = await this.makeRequest(`/patients/search/?${params.toString()}`);
            
            if (response.status === 'success') {
                return {
                    patients: response.patients || [],
                    total_found: response.total_found || 0
                };
            } else {
                throw new Error(response.message || 'Failed to search patients');
            }
        } catch (error) {
            console.error('Error searching patients:', error);
            throw error;
        }
    }

    /**
     * Get patient details by ID
     */
    async getPatientDetails(patientId) {
        try {
            const response = await this.makeRequest(`/patients/${patientId}/`);
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Patient not found');
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
            throw error;
        }
    }

    /**
     * Get patient medical records
     */
    async getPatientRecords(patientId) {
        try {
            const response = await this.makeRequest(`/patients/${patientId}/records/`);
            
            if (response.status === 'success') {
                return {
                    patient: response.patient,
                    records: response.records
                };
            } else {
                throw new Error(response.message || 'Failed to fetch patient records');
            }
        } catch (error) {
            console.error('Error fetching patient records:', error);
            throw error;
        }
    }

    /**
     * Create a new patient
     */
    async createPatient(patientData) {
        try {
            const response = await this.makeRequest('/patients/', {
                method: 'POST',
                body: JSON.stringify(patientData)
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create patient');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    }

    /**
     * Update patient information
     */
    async updatePatient(patientId, patientData) {
        try {
            const response = await this.makeRequest(`/patients/${patientId}/`, {
                method: 'PUT',
                body: JSON.stringify(patientData)
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update patient');
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }

    /**
     * Create a new medical record
     */
    async createMedicalRecord(recordData) {
        try {
            const response = await this.makeRequest('/medical-records/', {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to create medical record');
            }
        } catch (error) {
            console.error('Error creating medical record:', error);
            throw error;
        }
    }

    /**
     * Update medical record
     */
    async updateMedicalRecord(recordId, recordData) {
        try {
            const response = await this.makeRequest(`/medical-records/${recordId}/`, {
                method: 'PUT',
                body: JSON.stringify(recordData)
            });
            
            if (response.status === 'success') {
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update medical record');
            }
        } catch (error) {
            console.error('Error updating medical record:', error);
            throw error;
        }
    }

    /**
     * Format patient data for frontend consumption
     */
    formatPatientData(patients) {
        return patients.map(patient => ({
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            bloodType: patient.blood_type,
            allergies: patient.allergies || [],
            emergencyContact: patient.emergency_contact || {},
            healthRiskScore: patient.health_risk_score || 0,
            recommendedSpecialists: patient.recommended_specialists || [],
            healthTrends: patient.health_trends || {},
            createdAt: patient.created_at,
            updatedAt: patient.updated_at
        }));
    }
}

// Make it globally available
window.DjangoAPIClient = DjangoAPIClient;

// Create global instance
window.djangoAPI = new DjangoAPIClient();
