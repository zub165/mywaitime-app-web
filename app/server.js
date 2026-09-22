/**
 * Simple HTTP Server for Modular ER Wait Time Frontend
 * Serves static files and handles routing
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API proxy to Django backend
app.use('/api', (req, res) => {
    const fetch = require('node-fetch');
    const backendUrl = 'http://208.109.215.53:3015/api';
    
    fetch(`${backendUrl}${req.path}`, {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            ...req.headers
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    })
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(error => {
        console.error('API proxy error:', error);
        res.status(500).json({ error: 'Failed to connect to backend' });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Modular ER Wait Time Frontend Server running on port ${PORT}`);
    console.log(`🌐 External access: http://208.109.215.53:${PORT}`);
    console.log(`🌐 Local access: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
