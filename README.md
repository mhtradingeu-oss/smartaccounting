# 🧠 SmartAccounting - German Accounting Compliance System

A comprehensive German accounting solution with GoBD compliance, ELSTER integration, and intelligent analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- NPM 8+
- SQLite database

### Installation
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database and admin user
npm run seed:admin

# Start development servers
npm run dev
```

## 🇩🇪 German Accounting Features

### Core Compliance
- **GoBD Compliance**: Immutable transaction logs, exportable data, timestamp verification
- **GDPR Compliance**: Data anonymization, secure storage, access controls
- **German Tax Support**: UStG, Kleinunternehmerregelung, EStG, KStG, GewStG

### Tax Management
- **ELSTER Integration**: Direct submission of UStVA and annual returns
- **Automated VAT Calculation**: 19% standard, 7% reduced rates
- **Tax Report Generation**: EÜR, Umsatzsteuervoranmeldung, compliance reports
- **Deadline Management**: Automated reminders and tax calendar

### Document Processing
- **OCR with German Support**: Process receipts, invoices, bank statements
- **Secure Archiving**: GoBD-compliant document storage
- **Data Extraction**: Automatic recognition of German invoice formats
- **Integrity Validation**: Cryptographic verification of archived documents

## 🧠 Smart Features

### AI-Enhanced Analytics
- **Revenue Prediction**: Seasonal adjustments and trend analysis
- **Tax Projections**: Income tax, trade tax, social security estimates
- **Anomaly Detection**: Unusual transaction pattern identification
- **Cash Flow Forecasting**: 6-month predictions with confidence intervals

### Compliance Monitoring
- **Real-time Compliance Score**: Automated GoBD, GDPR, tax compliance checking
- **Automated Reporting**: Monthly, quarterly, and annual report generation
- **Risk Assessment**: Transaction anomaly detection and risk scoring

## 🏗️ Architecture

### Backend (Node.js + Express)
```
src/
├── config/          # Database and app configuration
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── services/        # Business logic services
├── middleware/      # Authentication, security, validation
└── utils/           # Helper functions and utilities
```

### Frontend (React + Vite)
```
client/src/
├── components/      # Reusable UI components
├── pages/          # Application pages
├── services/       # API integration
├── context/        # React context providers
└── hooks/          # Custom React hooks
```

### Key Services
- **GoBD Compliance Service**: Immutable logging and data export
- **German Tax Engine**: Tax calculations and compliance checking
- **ELSTER Service**: Official German tax authority integration
- **OCR Service**: Document processing with German text recognition
- **Smart Analytics**: AI-enhanced financial insights

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Accountant, Auditor, Viewer)
- Protected API endpoints
- Session management

### Data Security
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration

### Compliance Security
- Encrypted data storage
- Audit trail logging
- Data anonymization for GDPR
- Secure file upload and processing

## 🌍 Multilingual Support

### Supported Languages
- **German (de)**: Primary language with full business terminology
- **English (en)**: International support
- **Arabic (ar)**: Optional for Middle Eastern users

### Features
- Dynamic language switching
- Localized number and date formats
- Currency formatting (EUR)
- Legal term translations

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user profile
POST /api/auth/refresh       # Refresh JWT token
```

### German Tax Endpoints
```
POST /api/german-tax/ustva/generate    # Generate UStVA report
POST /api/german-tax/ustva/submit      # Submit to ELSTER
POST /api/german-tax/eur/generate      # Generate EÜR report
GET  /api/german-tax/calendar/:year    # Tax deadlines
POST /api/german-tax/export/gobd       # Export GoBD data
```

### OCR Endpoints
```
POST /api/ocr/process                  # Process document with OCR
GET  /api/ocr/search                   # Search archived documents
GET  /api/ocr/validate/:documentId     # Validate document integrity
```

### Analytics Endpoints
```
GET  /api/dashboard/analytics          # Smart analytics dashboard
GET  /api/dashboard/stats             # Basic statistics
```

## 🚀 Deployment

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=5000
DATABASE_URL=sqlite:./database/production.db
JWT_SECRET=your_32_character_secret_key
ELSTER_URL=https://www.elster.de/elsterweb/api
FRONTEND_URL=https://app.mhtrading-eu.com
```

### Build Process
```bash
# Build frontend
cd client && npm run build

# Install production dependencies
npm ci --production

# Start production server
npm start
```

### Health Checks
```bash
# System health check
curl http://localhost:5000/api/health

# Run comprehensive tests
npm run test:production
```

## 🧪 Testing

### Test Commands
```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test

# Integration tests
npm run test:integration

# Production readiness test
node scripts/final_production_readiness_test.js
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Security penetration testing
- Compliance validation tests

## 📋 Compliance Checklist

### GoBD Requirements ✅
- [x] Immutable transaction logging
- [x] Complete audit trail
- [x] Exportable data formats (XML/CSV)
- [x] Document archiving system
- [x] Data integrity validation

### GDPR Requirements ✅
- [x] Data anonymization features
- [x] Secure data storage
- [x] Access control mechanisms
- [x] Data export capabilities
- [x] Consent management

### German Tax Compliance ✅
- [x] VAT calculation (19%/7%)
- [x] ELSTER integration ready
- [x] Tax deadline management
- [x] Kleinunternehmerregelung support
- [x] EÜR and UStVA generation

## 🛠️ Development

### Development Setup
```bash
# Start backend in development mode
npm run dev:backend

# Start frontend in development mode
npm run dev:frontend

# Start both simultaneously
npm run dev
```

### Code Quality
- ESLint configuration
- Prettier formatting
- Husky pre-commit hooks
- Jest testing framework
- Comprehensive logging

## 📞 Support & Maintenance

### Admin Account
- **Email**: gharabli@mhtrading-eu.com
- **Default Password**: admin123
- **Role**: Administrator with full system access

### Logging & Monitoring
- Winston logging system
- Error tracking and alerting
- Performance monitoring
- Security event logging

### Backup & Recovery
- Automated database backups
- Document archive redundancy
- Configuration backup procedures
- Disaster recovery planning

## 🎯 Production Deployment Status

### ✅ Ready for Production
- All core features implemented
- German tax compliance complete
- Security measures in place
- Documentation complete
- Testing comprehensive

### 🚀 Deployment Target
**Domain**: app.mhtrading-eu.com  
**Platform**: Replit Production Environment  
**Database**: SQLite with automatic backups  
**SSL**: Automatic HTTPS encryption  

---

**Built with ❤️ for German accounting compliance**  
*Last updated: December 2024*