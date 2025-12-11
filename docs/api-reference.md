
# SmartAccounting API Reference

## Authentication

### POST /api/auth/login
**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "companyId": 1
  }
}
```

**Status Codes**:
- 200: Success
- 401: Invalid credentials
- 429: Too many attempts

### POST /api/auth/register
**Description**: Register new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "accountant",
  "companyId": 1
}
```

## Invoice Management

### GET /api/invoices
**Description**: Retrieve invoices with pagination and filtering

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (draft, sent, paid, overdue)
- `dateFrom`: Start date (YYYY-MM-DD)
- `dateTo`: End date (YYYY-MM-DD)

**Headers Required**:
- `Authorization: Bearer <jwt-token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

### POST /api/invoices
**Description**: Create new invoice

**Request Body**:
```json
{
  "customerId": 1,
  "items": [
    {
      "description": "Service A",
      "quantity": 1,
      "price": 100.00,
      "vatRate": 19
    }
  ],
  "dueDate": "2024-02-15",
  "notes": "Payment terms: 30 days"
}
```

### POST /api/invoices/upload
**Description**: Upload invoice document for OCR processing

**Content-Type**: multipart/form-data

**Form Data**:
- `file`: Invoice file (PDF, JPG, PNG)
- `type`: Document type (invoice, receipt, bill)

**Response**:
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-here",
    "extractedData": {
      "amount": 150.00,
      "date": "2024-01-15",
      "vendor": "Supplier Name",
      "items": [...]
    }
  }
}
```

## Tax Reports

### GET /api/taxReports
**Description**: Get tax reports for specified period

**Query Parameters**:
- `year`: Tax year (required)
- `quarter`: Quarter (1-4, optional)
- `type`: Report type (vat, income, trade)

### POST /api/taxReports/submit
**Description**: Submit tax report to ELSTER

**Request Body**:
```json
{
  "reportId": 1,
  "certificatePath": "/path/to/certificate.p12",
  "certificatePassword": "cert-password"
}
```

## German Tax Compliance

### POST /api/compliance/validate
**Description**: Validate transaction against German tax rules

**Request Body**:
```json
{
  "transaction": {
    "amount": 1000.00,
    "type": "expense",
    "category": "office_supplies",
    "date": "2024-01-15"
  }
}
```

### GET /api/compliance/requirements
**Description**: Get current German tax requirements and rates

## Company Management

### GET /api/companies
**Description**: Get companies accessible to current user

### POST /api/companies
**Description**: Create new company (admin only)

**Request Body**:
```json
{
  "name": "Company Name",
  "taxId": "DE123456789",
  "address": {
    "street": "Main St 123",
    "city": "Berlin",
    "zipCode": "10115",
    "country": "Germany"
  },
  "industry": "consulting"
}
```

## User Management

### GET /api/users
**Description**: Get users (admin/manager only)

### PUT /api/users/:id
**Description**: Update user information

### DELETE /api/users/:id
**Description**: Delete user (admin only)

## System Endpoints

### GET /api/health
**Description**: System health check

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "elster": "available",
    "email": "available"
  }
}
```

### GET /api/status
**Description**: Detailed system status

## Error Responses

All endpoints may return these error formats:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Upload endpoints**: 20 requests per hour per IP
- **General API**: 100 requests per 15 minutes per IP

## Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## Webhook Endpoints

### POST /webhooks/stripe
**Description**: Handle Stripe payment webhooks

### POST /webhooks/elster
**Description**: Handle ELSTER submission status updates
