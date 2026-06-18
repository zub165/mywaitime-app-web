/**
 * API Proxy Server for MyWaitTime
 * Handles only API requests to Django backend
 */

const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');

// Create proxy server
const proxy = httpProxy.createProxyServer({});

// SSL Configuration - Use Let's Encrypt certificates
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/api.mywaitime.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.mywaitime.com/fullchain.pem')
};

// Security headers
const securityHeaders = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// HTTPS server for API only
const httpsServer = https.createServer(sslOptions, (req, res) => {
    console.log(`API Request: ${req.method} ${req.url}`);
    
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Route to Django API on port 3015
    proxy.web(req, res, {
        target: 'http://localhost:3015',
        changeOrigin: true
    });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end('API Proxy error: ' + err.message);
    }
});

const HTTPS_PORT = 443;

// Start HTTPS server for API
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🚀 API Proxy Server running on port ${HTTPS_PORT}`);
    console.log(`🔗 https://api.mywaitime.com -> localhost:3015`);
    console.log(`✅ API backend ready for GitHub Pages frontend!`);
});

// Error handling
httpsServer.on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Permission denied to run on port ${HTTPS_PORT}. Try running with sudo.`);
    } else {
        console.error('HTTPS Server error:', err);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpsServer.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    httpsServer.close(() => {
        process.exit(0);
    });
});
