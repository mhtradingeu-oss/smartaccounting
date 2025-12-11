require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { errorHandler } = require('./utils/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Base API prefix
const API_PREFIX = process.env.API_BASE_URL || '/api/v1';

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes registration
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Health check
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    env: process.env.NODE_ENV || 'development',
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
