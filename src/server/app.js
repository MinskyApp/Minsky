// Express App - Servidor Web
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('../utils/logger');

const streamRoutes = require('./routes/stream');
const obsRoutes   = require('./routes/obs');
const authRoutes  = require('./routes/auth');
const statusRoutes = require('./routes/status');

const app = express();

// Seguridad
app.use(helmet({
  contentSecurityPolicy: false, // desactivado para el dashboard
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas peticiones, intenta en un momento' },
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Archivos estaticos
app.use(express.static(path.join(__dirname, '../../public')));

// Rutas
app.use('/api/stream', streamRoutes);
app.use('/api/obs',    obsRoutes);
app.use('/api/status', statusRoutes);
app.use('/auth',       authRoutes);

// Dashboard fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('API Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
