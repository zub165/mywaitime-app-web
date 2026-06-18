/**
 * Simple Proxy Server for Domain Routing
 * Routes mywaitime.com to port 3002 and api.mywaitime.com to port 3015
 */

const http = require('http');
const httpProxy = require('http-proxy');

// Create proxy servers
const proxy = httpProxy.createProxyServer({});

// Main server on port 80
const server = http.createServer((req, res) => {
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
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    res.end('Proxy error: ' + err.message);
});

const PORT = 80;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log(`mywaitime.com -> localhost:3002`);
    console.log(`api.mywaitime.com -> localhost:3015`);
});

server.on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`Permission denied to run on port ${PORT}. Try running with sudo.`);
    } else {
        console.error('Server error:', err);
    }
});
