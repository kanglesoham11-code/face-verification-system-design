# SyncUp Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you get the SyncUp platform running locally for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** ([Download](https://redis.io/download) or use [Redis Cloud](https://redis.com/try-free/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional (for full features)
- **AWS Account** (for face verification with Rekognition)
- **Google Cloud Account** (for file storage)
- **Stripe Account** (for payments, test mode)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd syncup-platform

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

The `.env` file is already created with development defaults. Update the following:

### Required for Basic Functionality

```bash
# Database (if using MongoDB Atlas, update this)
MONGODB_URI=mongodb://localhost:27017/syncup

# Redis (if using Redis Cloud, update this)
REDIS_URL=redis://localhost:6379

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=your-unique-access-secret-here
JWT_REFRESH_SECRET=your-unique-refresh-secret-here
```

### Required for Face Verification (P0 Feature)

```bash
# AWS Rekognition
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REKOGNITION_COLLECTION_ID=syncup-faces
```

**How to get AWS credentials:**
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Create an IAM user with Rekognition permissions
3. Generate access keys
4. Copy keys to `.env`

### Optional (for development)

```bash
# Email (will log to console if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Payments (test mode)
STRIPE_SECRET_KEY=sk_test_your-stripe-key

# AI (for P7 features)
ANTHROPIC_API_KEY=your-anthropic-key
```

## Step 3: Start MongoDB and Redis

### Option A: Local Installation

```bash
# Start MongoDB (in a new terminal)
mongod

# Start Redis (in another new terminal)
redis-server
```

### Option B: Docker

```bash
# Start MongoDB
docker run -d -p 27017:27017 --name syncup-mongo mongo:latest

# Start Redis
docker run -d -p 6379:6379 --name syncup-redis redis:latest
```

### Option C: Cloud Services

- **MongoDB Atlas**: Use the connection string from your cluster
- **Redis Cloud**: Use the connection string from your instance

## Step 4: Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev:backend
```

You should see:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
✅ Database indexes created successfully

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 SyncUp Platform Server                          ║
║                                                       ║
║   Environment: development                           ║
║   Port: 3001                                         ║
║   URL: http://localhost:3001                         ║
║                                                       ║
║   Status: ✅ Running                                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Step 5: Test the API

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-04-18T...",
  "environment": "development"
}
```

### Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "message": "Registration successful. Please verify your email with the OTP sent."
  }
}
```

Check your console for the OTP (since email is not configured, it will be logged).

### Verify Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "otp": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "individual",
      "verificationStatus": {
        "email": true,
        "face": false,
        "identity": false
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Step 6: Test Face Verification (Optional)

Face verification requires AWS Rekognition. If configured:

```bash
# Upload a face image
curl -X POST http://localhost:3001/api/v1/auth/verify-face \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/photo.jpg"
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Common Issues & Solutions

### Issue: MongoDB connection failed

**Solution:**
- Ensure MongoDB is running: `mongod` or check Docker container
- Verify connection string in `.env`
- Check if port 27017 is available

### Issue: Redis connection failed

**Solution:**
- Ensure Redis is running: `redis-server` or check Docker container
- Verify connection string in `.env`
- Check if port 6379 is available

### Issue: AWS Rekognition errors

**Solution:**
- Verify AWS credentials in `.env`
- Ensure IAM user has Rekognition permissions
- Check AWS region is correct
- For development, you can skip face verification

### Issue: Port 3001 already in use

**Solution:**
```bash
# Change port in .env
PORT=3002

# Or kill the process using port 3001
# On Linux/Mac:
lsof -ti:3001 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Development Workflow

### 1. Start Development Servers

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (when implemented)
npm run dev:frontend

# Or run both together
npm run dev
```

### 2. Make Changes

- Backend code is in `backend/src/`
- Changes auto-reload with `tsx watch`

### 3. Run Tests

```bash
# After making changes
npm test
```

### 4. Check Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/verify-email` | Verify email with OTP |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/verify-face` | Submit face for verification |
| GET | `/auth/verification-status` | Get verification status |

### Request Headers

For protected endpoints:
```
Authorization: Bearer <access_token>
```

### Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Next Steps

1. **Explore the API**: Try all authentication endpoints
2. **Read the Documentation**: Check `docs/` folder for detailed info
3. **Run Tests**: Ensure everything works with `npm test`
4. **Implement Features**: Follow the PRD priorities (P0 → P1 → P2...)
5. **Build Frontend**: Start with Remix.js setup

## Useful Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests

# Code Quality
npm run lint             # Lint code
npm run format           # Format code

# Build
npm run build            # Build for production
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Production
npm start                # Start production server
```

## Getting Help

- **Documentation**: Check `docs/` folder
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Test Cases**: See `docs/TEST_CASES.md`
- **Assumptions**: See `docs/ASSUMPTIONS.md`
- **Implementation Status**: See `IMPLEMENTATION_STATUS.md`

## Project Structure

```
syncup-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   ├── utils/          # Helpers
│   │   └── server.ts       # Main server
│   └── tsconfig.json
├── frontend/               # Remix.js (to be implemented)
├── tests/                  # Test files
├── docs/                   # Documentation
├── .env                    # Environment variables
├── package.json
└── README.md
```

---

**Happy Coding! 🚀**

For questions or issues, refer to the documentation or check the implementation status.
