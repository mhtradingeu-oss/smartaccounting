require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { errorHandler } = require('./utils/errorHandler');
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const apiPrefix = process.env.API_BASE_URL || '/api';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/invoices`, invoiceRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

app.get(`${apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use(errorHandler);

module.exports = app;
