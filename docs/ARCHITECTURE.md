# SyncUp Platform - Architecture Documentation

## System Overview

SyncUp is built as a modular, scalable platform with clear separation of concerns. The architecture follows modern best practices for security, performance, and maintainability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│                    (Remix.js - SSR/React)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────┴──────────────────────────────────────┐
│                      API Gateway Layer                       │
│              (Fastify - Rate Limiting, Auth)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   Auth &     │ │ Business │ │  External  │
│ Verification │ │  Logic   │ │  Services  │
│   Engine     │ │ Services │ │            │
└───────┬──────┘ └────┬─────┘ └─────┬──────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   MongoDB    │ │  Redis   │ │    GCS     │
│  (Primary)   │ │ (Cache)  │ │ (Storage)  │
└──────────────┘ └──────────┘ └────────────┘
```

## Technology Stack

### Frontend
- **Remix.js**: Server-side rendering, SEO optimization, fast routing
- **React**: Component-based UI
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling (to be added)

### Backend
- **Fastify**: High-performance Node.js framework
- **TypeScript**: Type-safe server code
- **Zod**: Runtime validation
- **JWT**: Stateless authentication

### Databases
- **MongoDB**: Primary data store
  - Flexible schema for rapid development
  - Horizontal scaling capability
  - Atlas Search for full-text search
- **Redis**: Caching and session management
  - Rate limiting
  - OTP storage
  - Real-time leaderboards

### External Services
- **AWS Rekognition**: Face verification and liveness detection
- **Google Cloud Storage**: File storage for uploads
- **Stripe/Razorpay**: Payment processing
- **OpenAI/Anthropic**: AI assistance features
- **Nodemailer**: Email delivery

## Core Modules

### 1. Auth & Verification Engine (P0 - HIGHEST PRIORITY)

**Responsibilities:**
- User registration and login
- Email verification with OTP
- Face verification with liveness detection
- Duplicate face prevention
- Identity claim verification
- Company ownership verification

**Key Components:**
- `AuthService`: Handles registration, login, token management
- `FaceVerificationService`: AWS Rekognition integration
- `EmailService`: Transactional emails
- JWT middleware for route protection

**Security Features:**
- Bcrypt password hashing (cost factor 12)
- JWT access tokens (15-min expiry)
- Refresh tokens (30-day expiry, HTTP-only cookies)
- Face embeddings stored as SHA-256 hashes only
- Rate limiting on verification endpoints
- Cooldown period after failed attempts

### 2. Promotion Engine (P1 - VERY HIGH PRIORITY)

**Responsibilities:**
- Sponsored posts, events, profiles
- Audience targeting
- Ad wallet management
- Campaign analytics
- Coupon system

**Key Features:**
- Real-time impression tracking
- CTR calculation
- Budget management
- Bonus credit system with expiry

### 3. Profile & Content Engine (P2)

**Responsibilities:**
- User profiles
- Company pages
- Professional feed
- Connection system
- Content engagement

### 4. Opportunity Engine (P3)

**Responsibilities:**
- Investment opportunities
- Partnership discovery
- Direct investor-founder communication
- Trust verification checkpoints

### 5. B2B Collaboration Engine (P4)

**Responsibilities:**
- Service profiles
- Project bidding
- Milestone-based contracts
- Escrow management
- Ratings and reviews

### 6. Job Posting Engine (P5)

**Responsibilities:**
- Experienced professional jobs only (min 1 year)
- AI-driven applicant matching
- Application workflow
- Hiring pipeline management

### 7. Event Engine (P6)

**Responsibilities:**
- Event creation and discovery
- Trust scoring
- Ticket sales with escrow
- Attendance tracking
- Post-event reviews

### 8. AI Assistance Engine (P7)

**Responsibilities:**
- Profile optimization suggestions
- Content enhancement
- Connection recommendations
- Opportunity matching
- Campaign optimization

### 9. Growth & Rewards Engine (P9)

**Responsibilities:**
- Referral code generation
- Milestone tracking
- Leaderboard management
- Fraud detection
- Reward fulfillment

## Data Flow

### Face Verification Flow
```
1. User uploads face image
   ↓
2. Backend receives image buffer
   ↓
3. Check cooldown and attempt count
   ↓
4. AWS Rekognition: Detect faces
   ↓
5. Quality and liveness checks
   ↓
6. Search for duplicate in collection
   ↓
7. Index face if unique
   ↓
8. Hash embedding (SHA-256)
   ↓
9. Store hash in isolated Face collection
   ↓
10. Update user verification status
```

### Authentication Flow
```
1. User registers with email/password
   ↓
2. Generate unique referral code
   ↓
3. Hash password with bcrypt
   ↓
4. Send OTP via email
   ↓
5. User verifies OTP
   ↓
6. Mark email as verified
   ↓
7. User logs in
   ↓
8. Generate access + refresh tokens
   ↓
9. Return access token, set refresh in HTTP-only cookie
```

## Database Schema

### Collections

#### users
- Core user data
- Verification status
- Referral information
- Profile completion score

#### faces (ISOLATED)
- Face embedding hashes only
- Liveness scores
- Duplicate flags
- Never contains raw images

#### profiles
- Professional information
- Experience and education
- Skills and endorsements
- Social links

#### companies
- Company information
- Verification status
- Ownership claims

#### posts
- User and company content
- Sponsored post configuration
- Engagement metrics

#### events
- Event details
- Trust scores
- Ticket information
- Escrow status

#### promotions
- Campaign configuration
- Targeting parameters
- Budget and spend tracking
- Analytics data

#### referrals
- Referral relationships
- Verification status
- Reward tracking

## Security Architecture

### Authentication
- JWT-based stateless authentication
- Access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry, HTTP-only cookies
- Token rotation on refresh

### Authorization
- Role-based access control (RBAC)
- Verification-level gating
- Middleware-based route protection

### Data Protection
- Passwords: Bcrypt (cost 12)
- Face data: SHA-256 hashed embeddings only
- PII: MongoDB field-level encryption
- Files: Signed URLs with expiry

### API Security
- Rate limiting (100 req/min per user)
- Input validation with Zod
- XSS prevention with DOMPurify
- CORS whitelist
- Helmet.js security headers
- HTTPS enforced

### Face Verification Security
- Liveness detection prevents spoofing
- Duplicate detection prevents multi-accounting
- Cooldown after failed attempts
- Isolated face collection
- GDPR-compliant deletion

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- MongoDB sharding capability
- Redis cluster for cache
- Cloud Run auto-scaling

### Performance Optimization
- Database indexing strategy
- Redis caching layer
- CDN for static assets
- Image optimization
- Lazy loading

### Monitoring
- Google Cloud Monitoring
- Sentry error tracking
- Performance metrics
- Audit logs

## Deployment Architecture

### Development
```
Local MongoDB + Redis
↓
Fastify (localhost:3001)
↓
Remix (localhost:3000)
```

### Production
```
MongoDB Atlas (managed)
↓
Redis Cloud (managed)
↓
Google Cloud Run (containerized)
↓
Cloud CDN
↓
Cloud Load Balancer
```

## Future Enhancements

1. **Real-time Messaging**: WebSocket-based chat
2. **Mobile Apps**: React Native applications
3. **Advanced Analytics**: ML-based insights
4. **Video Verification**: Enhanced liveness detection
5. **Blockchain Integration**: Immutable verification records
6. **Multi-language Support**: i18n implementation

## Module Dependencies

```
Auth Engine (P0)
  ↓
  ├─→ Profile Engine (P2)
  ├─→ Promotion Engine (P1)
  ├─→ Event Engine (P6)
  ├─→ Opportunity Engine (P3)
  └─→ Growth Engine (P9)

Verification Engine (P0)
  ↓
  ├─→ All user-facing features
  └─→ Trust scoring system
```

## API Versioning Strategy

- Current: `/api/v1/*`
- Breaking changes require new version
- Deprecated versions supported for 6 months
- Version in URL path for clarity

---

**Last Updated**: April 2025  
**Version**: 1.0
