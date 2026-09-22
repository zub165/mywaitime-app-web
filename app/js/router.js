/**
 * Router for ER Wait Time Application
 * Handles navigation and routing logic
 */

class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            'er-wait': 'ER Wait Time',
            'chat': 'Medical Chat',
            'hospital': 'Find Hospitals',
            'registration': 'Patient Registration',
            'records': 'Medical Records',
            'directions': 'Directions'
        };
    }

    /**
     * Navigate to a specific route
     */
    navigateTo(route) {
        if (this.routes[route]) {
            this.app.navigateToTab(route);
        } else {
            console.error(`Unknown route: ${route}`);
        }
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.app.currentTab;
    }

    /**
     * Get all available routes
     */
    getRoutes() {
        return this.routes;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}
