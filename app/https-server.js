const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// TomTom API proxy endpoint
app.get('/tomtom/search/2/poiSearch/:query', async (req, res) => {
    try {
        const apiKey = process.env.TOMTOM_API_KEY || 'tK4X8vGzaOmPGAHAqUgypOWJq9qGJqGJ';
        const { lat, lon, radius = 5000, limit = 10 } = req.query;
        const response = await fetch(
            `https://api.tomtom.com/search/2/poiSearch/${req.params.query}.json?key=${apiKey}&lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('TomTom API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from TomTom API' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create self-signed certificate for development
const createSelfSignedCert = () => {
    const { execSync } = require('child_process');
    try {
        // Check if certificates already exist
        if (fs.existsSync('./server.key') && fs.existsSync('./server.crt')) {
            console.log('✅ SSL certificates already exist');
            return;
        }

        console.log('🔐 Creating self-signed SSL certificate...');
        
        // Create private key
        execSync('openssl genrsa -out server.key 2048', { stdio: 'inherit' });
        
        // Create certificate
        execSync('openssl req -new -x509 -key server.key -out server.crt -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
        
        console.log('✅ SSL certificate created successfully');
    } catch (error) {
        console.error('❌ Failed to create SSL certificate:', error.message);
        console.log('💡 Make sure OpenSSL is installed on your system');
        process.exit(1);
    }
};

// Start HTTPS server
const startHttpsServer = () => {
    try {
        // Create certificates if they don't exist
        createSelfSignedCert();
        
        // Read SSL certificates
        const privateKey = fs.readFileSync('./server.key', 'utf8');
        const certificate = fs.readFileSync('./server.crt', 'utf8');
        
        const credentials = {
            key: privateKey,
            cert: certificate
        };
        
        // Create HTTPS server
        const httpsServer = https.createServer(credentials, app);
        
        httpsServer.listen(port, '0.0.0.0', () => {
            console.log(`🔒 HTTPS Server running at https://0.0.0.0:${port}`);
            console.log(`🌐 External access: https://208.109.215.53:${port}`);
            console.log(`🌐 Local access: https://localhost:${port}`);
            console.log(`⚠️  You may see a security warning - click "Advanced" and "Proceed"`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start HTTPS server:', error.message);
        console.log('💡 Falling back to HTTP server...');
        
        // Fallback to HTTP
        app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 HTTP Server running at http://0.0.0.0:${port}`);
            console.log(`🌐 External access: http://208.109.215.53:${port}`);
            console.log(`⚠️  Note: Geolocation will not work over HTTP`);
        });
    }
};

startHttpsServer();
