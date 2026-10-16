/**
 * Django API Client for ER Wait Time Application
 * Handles all API communications with the Django backend
 */

class DjangoAPIClient {
    constructor() {
        const host = (typeof location !== 'undefined' && location.hostname) || '';
        const productionApi = host.includes('mywaitime.com') || host.includes('mywaittime.com') || host.includes('github.io');
        // Local: Node :3002 proxies /api → Django. Production (GitHub Pages): absolute API host.
        this.baseURL = productionApi ? 'https://api.mywaitime.com/api' : '/api';
        this.timeout = 10000; // 10 seconds
    }

    /** Normalize facility type string from API (aligns with Flutter hospital.dart tiers). */
    normalizeFacilityType(raw) {
        const t = String(raw || 'other').toLowerCase().replace(/[\s_-]+/g, '');
        if (t.includes('emergency') || t === 'er' || t === 'emergencyroom') return 'emergency_room';
        if (t.includes('urgent')) return 'urgent_care';
        if (t.includes('walkin') || t.includes('walkinclinic')) return 'walk_in_clinic';
        if (t === 'hospital' || t === 'general' || t.includes('medicalcenter')) return 'hospital';
        if (t.includes('specialty') || t.includes('specialist')) return 'specialty';
        if (t.includes('nonemergency') || t.includes('nonurgent')) return 'non_emergency';
        if (t.includes('clinic')) return 'clinic';
        return t || 'other';
    }

    facilitySortRank(rawType) {
        const type = this.normalizeFacilityType(rawType);
        const ranks = {
            emergency_room: 1,
            hospital: 2,
            urgent_care: 3,
            walk_in_clinic: 4,
            clinic: 5,
            specialty: 6,
            other: 7,
            non_emergency: 99,
        };
        return ranks[type] ?? 7;
    }

    displayAsOpen(hospital) {
        if (hospital == null) return false;
        if (hospital.is_open === false || hospital.is_open === 0) return false;
        const rank = hospital.facility_sort_rank ?? this.facilitySortRank(hospital.facility_type);
        if (rank === 1) return true;
        if (hospital.is_open === true || hospital.is_open === 1) return true;
        if (hospital.is_open === undefined || hospital.is_open === null) {
            return rank <= 3;
        }
        return Boolean(hospital.is_open);
    }

    effectiveWaitMinutes(hospital) {
        const erTime = hospital.er_time_minutes ?? hospital.er_time_total;
        if (erTime != null && !isNaN(erTime)) return Number(erTime);
        const predicted = hospital.wait_time_prediction ?? hospital.predicted_wait;
        if (predicted != null && !isNaN(predicted)) return Number(predicted);
        const wt = hospital.wait_time ?? hospital.wait_time_minutes;
        if (wt != null && !isNaN(wt)) return Number(wt);
        return 999;
    }

    _distanceScoreKm(km) {
        if (km == null || isNaN(km) || km <= 0) return 0.5;
        if (km <= 5) return 1;
        if (km <= 15) return 0.7;
        if (km <= 30) return 0.4;
        return 0.2;
    }

    smartScoreEmergency(hospital) {
        const km = hospital.distance_km ?? (hospital.distance != null ? hospital.distance * 1.60934 : null);
        const distPart = this._distanceScoreKm(km) * 30;
        const wait = this.effectiveWaitMinutes(hospital);
        const waitPart = Math.max(0, 40 - Math.min(wait, 120) / 3);
        const rating = parseFloat(hospital.ai_rating) || 0;
        const ratingPart = (rating / 10) * 20;
        let bonus = 0;
        const rank = hospital.facility_sort_rank ?? this.facilitySortRank(hospital.facility_type);
        if (rank === 1) bonus += 30;
        else if (rank === 3) bonus += 15;
        else if (rank === 2) bonus += 8;
        else if (rank >= 99) bonus -= 50;
        return distPart + waitPart + ratingPart + bonus;
    }

    smartScoreMap(hospital) {
        const km = hospital.distance_km ?? (hospital.distance != null ? hospital.distance * 1.60934 : null);
        const distPart = this._distanceScoreKm(km) * 40;
        const wait = this.effectiveWaitMinutes(hospital);
        const waitPart = Math.max(0, 30 - Math.min(wait, 120) / 4);
        const rating = parseFloat(hospital.ai_rating) || 0;
        const ratingPart = (rating / 10) * 20;
        const openPart = this.displayAsOpen(hospital) ? 10 : 0;
        return distPart + waitPart + ratingPart + openPart;
    }

    compareEmergencyCareOrder(a, b) {
        const openA = this.displayAsOpen(a) ? 0 : 1;
        const openB = this.displayAsOpen(b) ? 0 : 1;
        if (openA !== openB) return openA - openB;

        const tierA = a.facility_sort_rank ?? this.facilitySortRank(a.facility_type);
        const tierB = b.facility_sort_rank ?? this.facilitySortRank(b.facility_type);
        if (tierA !== tierB) return tierA - tierB;

        const waitA = this.effectiveWaitMinutes(a);
        const waitB = this.effectiveWaitMinutes(b);
        if (waitA !== waitB) return waitA - waitB;

        const distA = a.distance ?? 9999;
        const distB = b.distance ?? 9999;
        if (distA !== distB) return distA - distB;

        return this.smartScoreEmergency(b) - this.smartScoreEmergency(a);
    }

    compareNearbySmart(a, b, facilityFilterActive = false) {
        const openA = this.displayAsOpen(a) ? 0 : 1;
        const openB = this.displayAsOpen(b) ? 0 : 1;
        if (openA !== openB) return openA - openB;

        if (!facilityFilterActive) {
            const tierA = a.facility_sort_rank ?? this.facilitySortRank(a.facility_type);
            const tierB = b.facility_sort_rank ?? this.facilitySortRank(b.facility_type);
            if (tierA !== tierB) return tierA - tierB;
        }

        const scoreA = this.smartScoreMap(a);
        const scoreB = this.smartScoreMap(b);
        if (scoreA !== scoreB) return scoreB - scoreA;

        const waitA = this.effectiveWaitMinutes(a);
        const waitB = this.effectiveWaitMinutes(b);
        if (waitA !== waitB) return waitA - waitB;

        return (a.distance ?? 9999) - (b.distance ?? 9999);
    }

    compareNearbyNearest(a, b, facilityFilterActive = false) {
        const openA = this.displayAsOpen(a) ? 0 : 1;
        const openB = this.displayAsOpen(b) ? 0 : 1;
        if (openA !== openB) return openA - openB;
        if (!facilityFilterActive) {
            const tierA = a.facility_sort_rank ?? this.facilitySortRank(a.facility_type);
            const tierB = b.facility_sort_rank ?? this.facilitySortRank(b.facility_type);
            if (tierA !== tierB) return tierA - tierB;
        }
        return (a.distance ?? 9999) - (b.distance ?? 9999);
    }

    compareNearbyMinWait(a, b, facilityFilterActive = false) {
        const openA = this.displayAsOpen(a) ? 0 : 1;
        const openB = this.displayAsOpen(b) ? 0 : 1;
        if (openA !== openB) return openA - openB;
        if (!facilityFilterActive) {
            const tierA = a.facility_sort_rank ?? this.facilitySortRank(a.facility_type);
            const tierB = b.facility_sort_rank ?? this.facilitySortRank(b.facility_type);
            if (tierA !== tierB) return tierA - tierB;
        }
        const waitA = this.effectiveWaitMinutes(a);
        const waitB = this.effectiveWaitMinutes(b);
        if (waitA !== waitB) return waitA - waitB;
        return (a.distance ?? 9999) - (b.distance ?? 9999);
    }

    sortEmergencyCare(hospitals) {
        const list = (hospitals || []).filter(h => {
            const rank = h.facility_sort_rank ?? this.facilitySortRank(h.facility_type);
            return rank < 99;
        });
        return [...list].sort((a, b) => this.compareEmergencyCareOrder(a, b));
    }

    sortNearbyList(hospitals, mode = 'smart', facilityFilterActive = false) {
        const list = [...(hospitals || [])];
        const cmp = {
            smart: (a, b) => this.compareNearbySmart(a, b, facilityFilterActive),
            nearest: (a, b) => this.compareNearbyNearest(a, b, facilityFilterActive),
            minwait: (a, b) => this.compareNearbyMinWait(a, b, facilityFilterActive),
            name: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
        }[mode] || ((a, b) => this.compareNearbySmart(a, b, facilityFilterActive));
        return list.sort(cmp);
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
    async getHospitalsByLocation(latitude, longitude, radius = 25, sort = 'smart') {
        try {
            const sortQ = sort ? `&sort=${encodeURIComponent(sort)}` : '';
            // Try search endpoint with common param variations
            const queries = [
                `/hospitals/search/?lat=${latitude}&lon=${longitude}&radius_miles=${radius}${sortQ}`,
                `/hospitals/search/?lat=${latitude}&lon=${longitude}&radius=${radius * 1609.34}${sortQ}`,
                `/hospitals/search/?lat=${latitude}&lng=${longitude}&radius_miles=${radius}${sortQ}`,
                `/hospitals/search/?latitude=${latitude}&longitude=${longitude}&radius=${radius}${sortQ}`,
            ];

            for (const q of queries) {
                try {
                    const resp = await this.makeRequest(q);
                    if (resp && resp.status === 'success' && Array.isArray(resp.data) && resp.data.length > 0) {
                        return this.formatHospitalData(resp.data);
                    }
                } catch (e) {
                    // Try next variation
                    console.warn('Hospital search variant failed:', q, e.message);
                }
            }

            // Fallback: fetch all and filter client-side by distance
            console.warn('Search returned no hospitals. Falling back to /hospitals/ + client-side filtering');
            const allResp = await this.makeRequest('/hospitals/');
            const allHospitals = (allResp && allResp.status === 'success') ? allResp.data : [];
            const formatted = this.formatHospitalData(allHospitals);

            // Filter by radius in miles
            const filtered = formatted.filter(h => {
                if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') return false;
                const dist = this.calculateDistance(latitude, longitude, h.latitude, h.longitude);
                return dist <= radius;
            });
            return filtered;
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
        return hospitals.map(hospital => {
            const facilityType = hospital.hospital_type || hospital.facility_type || hospital.type;
            const facilitySortRank = this.facilitySortRank(facilityType);
            return {
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
                facility_type: facilityType,
                facility_sort_rank: facilitySortRank,
                is_open: hospital.is_open,
                wait_time: parseInt(hospital.wait_time_prediction, 10) || 20,
                wait_time_prediction: hospital.wait_time_prediction,
                er_time_minutes: hospital.er_time_minutes ?? hospital.er_time_total,
                severity: this.determineSeverity(hospital.wait_time_prediction || 20),
                specialties: hospital.specialties || [],
                ai_rating: parseFloat(hospital.ai_rating) || 0,
                performance_score: parseFloat(hospital.overall_performance_score) || 0,
                performance_grade: hospital.performance_grade || 'N/A',
                capacity_status: hospital.capacity_status || 'unknown',
                distance: null,
                distance_km: null,
                last_updated: hospital.updated_at,
                feedback_count: hospital.total_feedback_count || 0,
                category_scores: hospital.category_scores || {},
            };
        });
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
    addDistancesToHospitals(hospitals, userLat, userLon, options = {}) {
        const { preserveOrder = false } = options;
        const withDistance = hospitals.map(hospital => {
            const distance = this.calculateDistance(userLat, userLon, hospital.latitude, hospital.longitude);
            return {
                ...hospital,
                distance,
                distance_km: distance * 1.60934,
            };
        });
        if (preserveOrder) {
            return withDistance;
        }
        return withDistance.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Search hospitals (preserves backend order when sort is set; re-ranks in UI if needed).
     */
    async searchHospitals(query, lat, lon, radiusMiles = 25, facilityType = null, sort = 'smart') {
        const params = new URLSearchParams({
            q: query || '',
            radius_miles: String(radiusMiles),
            sort: sort || 'smart',
        });
        if (lat != null && lon != null) {
            params.set('lat', String(lat));
            params.set('lon', String(lon));
        }
        if (facilityType) {
            params.set('type', facilityType);
        }
        const resp = await this.makeRequest(`/hospitals/search/?${params.toString()}`);
        if (resp && resp.status === 'success' && Array.isArray(resp.data)) {
            return this.formatHospitalData(resp.data);
        }
        return [];
    }

    /**
     * Get ER wait times for location (main method for ER Wait Time tab)
     */
    async getERWaitTimes(latitude, longitude, radius = 25) {
        try {
            console.log(`🔍 Getting ER wait times for location: ${latitude}, ${longitude} (${radius} miles)`);
            
            const hospitals = await this.getHospitalsByLocation(latitude, longitude, radius, 'tiers');
            const hospitalsWithDistance = this.addDistancesToHospitals(hospitals, latitude, longitude, { preserveOrder: true });
            const sorted = this.sortEmergencyCare(hospitalsWithDistance);
            
            // Create wait times array
            const waitTimes = sorted.map(hospital => ({
                hospital_id: hospital.id,
                wait_time: hospital.wait_time,
                severity: hospital.severity,
                last_updated: hospital.last_updated,
                distance: hospital.distance
            }));

            return {
                hospitals: sorted,
                wait_times: waitTimes,
                total_count: sorted.length,
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
