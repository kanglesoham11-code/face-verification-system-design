# 🚀 SyncUp Platform - Installation Guide

## 📋 PREREQUISITES

- Node.js 18+ 
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Git

## 🔧 QUICK SETUP

### 1. Clone and Install
```bash
git clone <repository-url>
cd syncup-platform
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Required Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/syncup
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Cloudinary (Free Storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Groq AI (Free AI Services)
GROQ_API_KEY=your-groq-api-key

# Email (Optional - for OTP verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@syncup.app

# Feature Flags
ENABLE_FACE_VERIFICATION=true
ENABLE_AI_ASSISTANT=true
ENABLE_PAYMENTS=false
```

## 🌐 FREE SERVICE SETUP

### Cloudinary (Image Storage)
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account (25GB storage + 25GB bandwidth)
3. Get credentials from Dashboard:
   - Cloud Name
   - API Key  
   - API Secret

### Groq API (AI Services)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Create API key
4. Copy the key to your .env file

### MongoDB Atlas (Database)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster (512MB)
3. Get connection string
4. Add to MONGODB_URI in .env

### Redis (Caching)
**Local Redis:**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

**Cloud Redis (Free options):**
- Redis Labs (30MB free)
- Upstash (10K commands/day free)

## 🏃‍♂️ RUNNING THE APPLICATION

### Development Mode
```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run dev:backend  # Backend only (port 3001)
npm run dev:frontend # Frontend only (port 3000)
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 TESTING

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:e2e
```

### Test Face Verification
1. Open browser to `http://localhost:3000`
2. Register new account
3. Complete face verification
4. Test login with face verification

### Test File Upload
1. Create profile
2. Upload profile image
3. Create post with image
4. Verify images are stored in Cloudinary

### Test AI Features
1. Complete profile
2. Request profile optimization
3. Create post and request content enhancement
4. Check connection recommendations

## 📊 MONITORING

### Health Check
```bash
curl http://localhost:3001/health
```

### Service Status
```bash
# Check face verification status
curl http://localhost:3001/api/v1/auth/verification-status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check AI service status  
curl http://localhost:3001/api/v1/ai/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 TROUBLESHOOTING

### Common Issues

**Face Verification Not Working:**
- Ensure camera permissions are granted
- Check browser console for face-api.js errors
- Verify ENABLE_FACE_VERIFICATION=true in .env

**Images Not Uploading:**
- Check Cloudinary credentials in .env
- Verify CLOUDINARY_CLOUD_NAME is correct
- Check browser network tab for upload errors

**AI Features Not Working:**
- Verify GROQ_API_KEY in .env
- Check ENABLE_AI_ASSISTANT=true
- Monitor API rate limits

**Database Connection Issues:**
- Verify MongoDB is running
- Check MONGODB_URI format
- Ensure network access for Atlas

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev:backend

# Check specific service logs
DEBUG=face-verification npm run dev:backend
DEBUG=storage npm run dev:backend
DEBUG=ai-service npm run dev:backend
```

## 🚀 DEPLOYMENT

### Docker Deployment
```bash
# Build Docker image
docker build -t syncup-platform .

# Run with environment file
docker run --env-file .env -p 3001:3001 syncup-platform
```

### Cloud Deployment
The application is ready for deployment on:
- **Heroku** (Free tier available)
- **Railway** (Free tier available)  
- **Render** (Free tier available)
- **Vercel** (Frontend + Serverless functions)
- **Netlify** (Frontend + Serverless functions)

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Use production database URLs
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/syncup
REDIS_URL=redis://user:pass@host:port

# Strong production secrets
JWT_ACCESS_SECRET=super-strong-production-secret-64-chars-minimum
JWT_REFRESH_SECRET=another-super-strong-production-secret-64-chars

# Production service credentials
CLOUDINARY_CLOUD_NAME=your-prod-cloud-name
CLOUDINARY_API_KEY=your-prod-api-key
CLOUDINARY_API_SECRET=your-prod-api-secret
GROQ_API_KEY=your-prod-groq-key
```

## 📈 SCALING

### Performance Optimization
- Enable Redis caching for frequently accessed data
- Use Cloudinary transformations for image optimization
- Implement database indexing for large datasets
- Add rate limiting for API endpoints

### Monitoring Setup
- Add application performance monitoring (APM)
- Set up error tracking (Sentry)
- Monitor service health endpoints
- Track usage metrics and costs

### Backup Strategy
- Regular MongoDB backups
- Cloudinary asset backup
- Environment configuration backup
- Code repository backup

## 🆘 SUPPORT

### Documentation
- [API Documentation](./API_TESTING_GUIDE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Test Cases](./docs/TEST_CASES.md)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for additional documentation

---

**Ready to build the future of professional networking! 🌟**