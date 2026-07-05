# SyncUp Platform - Test Cases

## Testing Strategy

This document outlines comprehensive test cases covering functional flows, edge cases, user roles, core business logic, and validations as required by the Devkraft Hackathon evaluation criteria.

## Test Coverage

- **Unit Tests**: Service layer functions, utilities, validators
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Critical user journeys
- **Security Tests**: Authentication, authorization, injection attacks
- **Performance Tests**: Load testing, response times

## P0: Authentication & Verification Tests

### Registration & Email Verification

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-A01 | Register with valid email and password | email: test@example.com, password: Test@123, name: John Doe | 201 Created, userId returned, OTP sent | P0 |
| TC-A02 | Register with existing email | email: existing@example.com | 400 Bad Request, "User already exists" | P0 |
| TC-A03 | Register with invalid email format | email: invalid-email | 422 Validation Error | P0 |
| TC-A04 | Register with weak password (< 8 chars) | password: weak | 422 Validation Error | P0 |
| TC-A05 | Register with valid referral code | referredBy: ABC12345 | 201 Created, referral linked | P0 |
| TC-A06 | Register with invalid referral code | referredBy: INVALID | 400 Bad Request, "Invalid referral code" | P0 |
| TC-A07 | Verify email with correct OTP | otp: 123456 | 200 OK, email verified | P0 |
| TC-A08 | Verify email with incorrect OTP | otp: 000000 | 400 Bad Request, "Invalid OTP" | P0 |
| TC-A09 | Verify email with expired OTP (> 10 min) | otp: expired | 400 Bad Request, "OTP expired" | P0 |
| TC-A10 | Verify already verified email | otp: valid | 200 OK, "Already verified" | P0 |

### Face Verification

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-V01 | Submit live face image | Live webcam capture | 200 OK, face_verified: true, livenessScore > 0.8 | P0 |
| TC-V02 | Submit printed photo | Photo of a photo | 400 Bad Request, "LIVENESS_FAILED" | P0 |
| TC-V03 | Submit phone screen photo | Photo of phone screen | 400 Bad Request, "LIVENESS_FAILED" | P0 |
| TC-V04 | Submit face already registered | Duplicate face | 400 Bad Request, "DUPLICATE_DETECTED" | P0 |
| TC-V05 | Submit image with no face | Blank image | 400 Bad Request, "NO_FACE_DETECTED" | P0 |
| TC-V06 | Submit image with multiple faces | Group photo | 400 Bad Request, "MULTIPLE_FACES" | P0 |
| TC-V07 | Submit low quality image | Blurry/dark image | 400 Bad Request, "QUALITY_LOW" | P0 |
| TC-V08 | Submit face with sunglasses | Face with sunglasses | 400 Bad Request, "FACE_OBSTRUCTED" | P0 |
| TC-V09 | 4th verification attempt within 24h | 4th attempt | 400 Bad Request, "MAX_ATTEMPTS_EXCEEDED", cooldown set | P0 |
| TC-V10 | Verification during cooldown period | Attempt during cooldown | 400 Bad Request, "COOLDOWN_ACTIVE" | P0 |
| TC-V11 | Successful verification resets attempts | Valid face after 2 failed attempts | 200 OK, attempt count reset to 0 | P0 |
| TC-V12 | Face verification without authentication | No JWT token | 401 Unauthorized | P0 |

### Login & Token Management

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-L01 | Login with valid credentials | email, password | 200 OK, accessToken, refreshToken in cookie | P0 |
| TC-L02 | Login with invalid email | wrong@example.com | 401 Unauthorized, "Invalid credentials" | P0 |
| TC-L03 | Login with invalid password | wrong password | 401 Unauthorized, "Invalid credentials" | P0 |
| TC-L04 | Login with deactivated account | inactive user | 401 Unauthorized, "Account deactivated" | P0 |
| TC-L05 | Refresh token with valid refresh token | Valid refresh token | 200 OK, new accessToken, new refreshToken | P0 |
| TC-L06 | Refresh token with expired refresh token | Expired token | 401 Unauthorized, "Invalid token" | P0 |
| TC-L07 | Refresh token with invalid token | Invalid token | 401 Unauthorized | P0 |
| TC-L08 | Logout clears refresh token cookie | Logout request | 200 OK, cookie cleared | P0 |
| TC-L09 | Access protected route without token | No Authorization header | 401 Unauthorized | P0 |
| TC-L10 | Access protected route with expired token | Expired JWT | 401 Unauthorized, "Token expired" | P0 |

### Verification Status & Access Control

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-AC01 | Get verification status (email only) | Authenticated user | email: true, face: false, identity: false | P0 |
| TC-AC02 | Get verification status (email + face) | Face verified user | email: true, face: true, canPost: true | P0 |
| TC-AC03 | Access post creation without face verification | Email verified only | 403 Forbidden, "Face verification required" | P0 |
| TC-AC04 | Access event creation without identity verification | Face verified only | 403 Forbidden, "Identity verification required" | P0 |
| TC-AC05 | Access investment flow without identity verification | Face verified only | 403 Forbidden, "Identity verification required" | P0 |
| TC-AC06 | Browse public content without verification | No verification | 200 OK, public content visible | P0 |

## P1: Promotion & Payment Tests

### Campaign Creation

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-P01 | Create sponsored post campaign | Valid targeting, budget: 1000 | 201 Created, campaign active | P1 |
| TC-P02 | Create campaign with insufficient balance | budget > wallet balance | 400 Bad Request, "Insufficient balance" | P1 |
| TC-P03 | Create campaign without face verification | Unverified user | 403 Forbidden | P1 |
| TC-P04 | Create campaign with invalid targeting | Empty audience | 422 Validation Error | P1 |
| TC-P05 | Campaign auto-pauses when budget exhausted | spend >= budget | Campaign status: paused | P1 |
| TC-P06 | Get campaign analytics | Campaign ID | 200 OK, impressions, clicks, CTR, spend | P1 |
| TC-P07 | Pause active campaign | Campaign ID | 200 OK, status: paused | P1 |
| TC-P08 | Resume paused campaign | Campaign ID | 200 OK, status: active | P1 |

### Ad Wallet & Coupons

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-W01 | Top up ad wallet | amount: 1000 | 200 OK, balance increased, payment processed | P1 |
| TC-W02 | Apply valid coupon code | code: BONUS100 | 200 OK, bonus balance added | P1 |
| TC-W03 | Apply expired coupon | Expired coupon code | 400 Bad Request, "COUPON_EXPIRED" | P1 |
| TC-W04 | Apply already used coupon | Used coupon code | 400 Bad Request, "COUPON_ALREADY_USED" | P1 |
| TC-W05 | Bonus balance expires after validity period | Expired bonus | Bonus balance: 0 | P1 |
| TC-W06 | Campaign uses real balance before bonus | Mixed balance | Real balance deducted first | P1 |
| TC-W07 | Get wallet transaction history | User ID | 200 OK, list of transactions | P1 |

## P2-P5: Core Platform Tests

### Profile & Networking

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-PR01 | Get public profile | userId | 200 OK, profile data | P2 |
| TC-PR02 | Update own profile | Valid profile data | 200 OK, profile updated | P2 |
| TC-PR03 | Update profile increases completion score | Add experience | profileComplete increases | P2 |
| TC-PR04 | Send connection request | targetUserId | 201 Created, request sent | P2 |
| TC-PR05 | Accept connection request | requestId | 200 OK, connection established | P2 |
| TC-PR06 | Decline connection request | requestId | 200 OK, request declined | P2 |
| TC-PR07 | Get personalized feed | Authenticated user | 200 OK, posts from connections + sponsored | P2 |
| TC-PR08 | Sponsored content appears every 5th item | Feed request | Sponsored posts at positions 5, 10, 15... | P2 |

### Job Posting (Experienced Only)

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-J01 | Post job with minExperience >= 1 | minExperience: 2 | 201 Created, job posted | P5 |
| TC-J02 | Post job with minExperience = 0 | minExperience: 0 | 422 Validation Error, "Freshers not allowed" | P5 |
| TC-J03 | Post job without company verification | Unverified company | 403 Forbidden, "Company verification required" | P5 |
| TC-J04 | Apply for job with face verification | Valid application | 201 Created, application submitted | P5 |
| TC-J05 | Apply for job without face verification | Unverified user | 403 Forbidden | P5 |
| TC-J06 | Get AI match score for job | Job ID, user profile | 200 OK, matchScore: 0-100 | P5 |

### Business Opportunities

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-O01 | Create investment opportunity | Verified company owner | 201 Created, opportunity listed | P3 |
| TC-O02 | Non-owner attempts to create opportunity | Non-owner user | 403 Forbidden, "Company owner only" | P3 |
| TC-O03 | Investor expresses interest | Verified investor | 200 OK, interest recorded | P3 |
| TC-O04 | Unverified user attempts investment flow | No identity verification | 403 Forbidden | P3 |

### B2B Service Exchange

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-B01 | Create service profile | Verified company | 201 Created, service listed | P4 |
| TC-B02 | Post project requirement | Client company | 201 Created, project posted | P4 |
| TC-B03 | Submit proposal for project | Service provider | 201 Created, proposal submitted | P4 |
| TC-B04 | Client approves milestone | Milestone ID | 200 OK, payment released from escrow | P4 |
| TC-B05 | Rate service provider after completion | Rating 1-5 | 200 OK, rating recorded | P4 |

## P6: Event Tests

### Event Creation & Trust Scoring

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-E01 | Create free event | Verified organizer | 201 Created, event listed | P6 |
| TC-E02 | Create paid event | Verified organizer, ticket price | 201 Created, escrow configured | P6 |
| TC-E03 | Create event without verification | Unverified user | 403 Forbidden | P6 |
| TC-E04 | Event trust score calculation | New organizer, 7 days notice | trustScore: 60-70 | P6 |
| TC-E05 | Event trust score with history | Organizer with 5 successful events | trustScore: 90+ | P6 |
| TC-E06 | Low trust score shows warning | trustScore < 60 | Warning badge displayed | P6 |

### Event Registration & Escrow

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-EP01 | Register for free event | Event ID | 200 OK, QR ticket generated | P6 |
| TC-EP02 | Register for paid event | Event ID, payment | 200 OK, payment in escrow, QR ticket | P6 |
| TC-EP03 | Organizer cancels event 72h+ before | Event ID | Refunds processed, full amount | P6 |
| TC-EP04 | Organizer cancels event < 72h before | Event ID | 50% refund processed | P6 |
| TC-EP05 | Attendee cancels < 24h before | Registration ID | No refund | P6 |
| TC-EP06 | 30%+ attendees report non-occurrence | Multiple reports | Funds held, admin notified | P6 |
| TC-EP07 | Funds released 24h after successful event | Event completed | Payment to organizer | P6 |
| TC-EP08 | Organizer with 2 disputed events creates new event | Event creation | Flagged for manual review | P6 |

## P9: Referral & Rewards Tests

### Referral System

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-R01 | New user registers with referral code | Valid referral code | Referral pending until face verification | P9 |
| TC-R02 | Referee completes face verification | Face verified | Referral credited to referrer | P9 |
| TC-R03 | Self-referral attempt (same device/IP) | Same device | Fraud flag raised, referral not credited | P9 |
| TC-R04 | User reaches 10 verified referrals | 10th referral verified | Milestone achieved, badge awarded | P9 |
| TC-R05 | User reaches 100 verified referrals | 100th referral verified | ₹2000 ad credit + gift reward | P9 |
| TC-R06 | Get referral leaderboard | Request | Top 10 referrers with counts | P9 |
| TC-R07 | Referral chain tracking (2 levels) | Indirect referral | Direct + 10% indirect reward | P9 |

## Security Tests

### Authentication Security

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-S01 | SQL injection in login | email: "' OR '1'='1" | 401 Unauthorized, no injection | P0 |
| TC-S02 | XSS in profile bio | bio: "<script>alert('xss')</script>" | Content sanitized, script removed | P0 |
| TC-S03 | CSRF attack on state parameter | Invalid OAuth state | 400 Bad Request, state mismatch | P0 |
| TC-S04 | Rate limit exceeded | 101 requests in 1 minute | 429 Too Many Requests | P0 |
| TC-S05 | JWT token tampering | Modified JWT payload | 401 Unauthorized, invalid signature | P0 |
| TC-S06 | Refresh token reuse after rotation | Old refresh token | 401 Unauthorized, token invalidated | P0 |

### Authorization Security

| ID | Test Case | Input | Expected Output | Priority |
|----|-----------|-------|-----------------|----------|
| TC-S07 | Access admin endpoint as regular user | Regular user token | 403 Forbidden | P0 |
| TC-S08 | Modify another user's profile | Different userId | 403 Forbidden | P0 |
| TC-S09 | Delete another user's post | Different authorId | 403 Forbidden | P0 |
| TC-S10 | Access company admin features without role | Individual user | 403 Forbidden | P0 |

## Performance Tests

### Response Time

| ID | Test Case | Target | Priority |
|----|-----------|--------|----------|
| TC-PF01 | API endpoint response time (P95) | < 200ms | P0 |
| TC-PF02 | Face verification end-to-end | < 5 seconds | P0 |
| TC-PF03 | Feed loading time | < 500ms | P2 |
| TC-PF04 | Search results | < 300ms | P2 |

### Load Testing

| ID | Test Case | Target | Priority |
|----|-----------|--------|----------|
| TC-PF05 | Concurrent users | 1000 users | P0 |
| TC-PF06 | Feed API throughput | 1000 req/sec | P2 |
| TC-PF07 | Face verification concurrent | 50 concurrent | P0 |

## Running Tests

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Security Tests
```bash
npm run test:security
```

### Load Tests
```bash
npm run test:load
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Environment Setup

### Prerequisites
- MongoDB test database
- Redis test instance
- AWS Rekognition test account
- Stripe test mode

### Environment Variables
```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/syncup_test
REDIS_URL=redis://localhost:6379/1
```

## Continuous Integration

Tests run automatically on:
- Every commit (unit tests)
- Pull requests (unit + integration)
- Pre-deployment (full suite)

---

**Last Updated**: April 2025  
**Version**: 1.0  
**Total Test Cases**: 100+
