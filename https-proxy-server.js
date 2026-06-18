/**
 * HTTPS Proxy Server for Domain Routing
 * Routes mywaitime.com to port 3002 and api.mywaitime.com to port 3015
 * Supports both HTTP and HTTPS
 */

const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

// Create proxy servers
const proxy = httpProxy.createProxyServer({});

// SSL Certificate paths (we'll create self-signed for now)
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt'))
};

// Request handler
const handleRequest = (req, res) => {
    const host = req.headers.host;
    
    console.log(`Request to: ${host}${req.url}`);
    
    // Route based on subdomain
    if (host.includes('api.mywaitime.com')) {
        // Route to Django API on port 3015
        console.log('Routing to Django API (port 3015)');
        proxy.web(req, res, {
            target: 'http://localhost:3015',
            changeOrigin: true
        });
    } else if (host.includes('mywaitime.com')) {
        // Route to ER Wait Time app on port 3002
        console.log('Routing to ER Wait Time (port 3002)');
        proxy.web(req, res, {
            target: 'http://localhost:3002',
            changeOrigin: true
        });
    } else {
        // Default to ER Wait Time app
        console.log('Default routing to ER Wait Time (port 3002)');
        proxy.web(req, res, {
            target: 'http://localhost:3002',
            changeOrigin: true
        });
    }
};

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    res.end('Proxy error: ' + err.message);
});

// Create servers
const httpServer = http.createServer(handleRequest);
const httpsServer = https.createServer(sslOptions, handleRequest);

const HTTP_PORT = 80;
const HTTPS_PORT = 443;

// Start HTTP server
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`HTTP Proxy server running on port ${HTTP_PORT}`);
    console.log(`mywaitime.com -> localhost:3002`);
    console.log(`api.mywaitime.com -> localhost:3015`);
});

// Start HTTPS server
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`HTTPS Proxy server running on port ${HTTPS_PORT}`);
    console.log(`https://mywaitime.com -> localhost:3002`);
    console.log(`https://api.mywaitime.com -> localhost:3015`);
});

// Error handling
httpServer.on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Permission denied to run on port ${HTTP_PORT}. Try running with sudo.`);
    } else {
        console.error('HTTP Server error:', err);
    }
});

httpsServer.on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Permission denied to run on port ${HTTPS_PORT}. Try running with sudo.`);
    } else {
        console.error('HTTPS Server error:', err);
    }
});
