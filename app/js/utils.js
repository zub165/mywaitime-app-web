/**
 * Utility Functions for ER Wait Time Application
 * Common helper functions used across the application
 */

class Utils {
    constructor() {
        this.geocoder = null;
        this.map = null;
    }

    /**
     * Format time in minutes to human readable format
     */
    formatWaitTime(minutes) {
        if (minutes === null || minutes === undefined) {
            return 'Unknown';
        }

        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours}h`;
            } else {
                return `${hours}h ${remainingMinutes}m`;
            }
        }
    }

    /**
     * Get wait time status based on minutes
     */
    getWaitTimeStatus(minutes) {
        if (minutes === null || minutes === undefined) {
            return { status: 'unknown', class: 'secondary', label: 'Unknown' };
        }

        if (minutes <= 30) {
            return { status: 'low', class: 'success', label: 'Low' };
        } else if (minutes <= 60) {
            return { status: 'medium', class: 'warning', label: 'Medium' };
        } else if (minutes <= 120) {
            return { status: 'high', class: 'warning', label: 'High' };
        } else {
            return { status: 'critical', class: 'danger', label: 'Critical' };
        }
    }

    /**
     * Format distance in miles
     */
    formatDistance(miles) {
        if (miles === null || miles === undefined) {
            return 'Unknown';
        }

        if (miles < 1) {
            return `${Math.round(miles * 5280)} ft`;
        } else {
            return `${miles.toFixed(1)} mi`;
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
     * Get user's current location
     */
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
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
     * Format phone number
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        
        return phone;
    }

    /**
     * Format date
     */
    formatDate(date, options = {}) {
        if (!date) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', formatOptions);
        } catch (error) {
            console.error('Date formatting error:', error);
            return date.toString();
        }
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        if (amount === null || amount === undefined) return '';
        
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return `$${amount}`;
        }
    }

    /**
     * Debounce function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validate phone number
     */
    validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10;
    }

    /**
     * Sanitize HTML
     */
    sanitizeHtml(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Show loading state
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    /**
     * Scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get query parameters from URL
     */
    getQueryParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    }

    /**
     * Set query parameters in URL
     */
    setQueryParams(params) {
        const url = new URL(window.location);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        
        window.history.replaceState({}, '', url);
    }

    /**
     * Local storage helpers
     */
    storage = {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
                return false;
            }
        },
        
        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
                return false;
            }
        }
    };

    /**
     * Session storage helpers
     */
    session = {
        set: (key, value) => {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Failed to save to sessionStorage:', error);
                return false;
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to read from sessionStorage:', error);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Failed to remove from sessionStorage:', error);
                return false;
            }
        },
        
        clear: () => {
            try {
                sessionStorage.clear();
                return true;
            } catch (error) {
                console.error('Failed to clear sessionStorage:', error);
                return false;
            }
        }
    };

    /**
     * Error handling
     */
    handleError(error, context = '') {
        console.error(`Error${context ? ` in ${context}` : ''}:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        return {
            error: true,
            message: message,
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Retry function with exponential backoff
     */
    async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const waitTime = delay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
