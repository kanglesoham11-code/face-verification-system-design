# SyncUp Platform - API Testing Guide

## Quick Test Flow

This guide shows you how to test all implemented features end-to-end.

---

## Prerequisites

```bash
# Start the server
npm run dev:backend

# Server should be running on http://localhost:3001
```

---

## 1. Authentication Flow

### Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@syncup.app",
    "password": "Demo@12345",
    "name": "Demo User"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "message": "Registration successful. Please verify your email with the OTP sent."
  }
}
```

**Note:** Check your console for the OTP (it will be logged since email is not configured).

### Verify Email

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "otp": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@syncup.app",
    "password": "Demo@12345"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "demo@syncup.app",
      "name": "Demo User",
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

**Save the accessToken for subsequent requests!**

### Get Verification Status

```bash
curl -X GET http://localhost:3001/api/v1/auth/verification-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. Face Verification (P0)

### Verify Face

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-face \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/photo.jpg"
```

**Note:** Requires AWS Rekognition credentials in `.env`

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "livenessScore": 0.95,
    "faceConfidence": 99.8,
    "isDuplicate": false
  }
}
```

**Response (Liveness Failed):**
```json
{
  "success": false,
  "error": {
    "code": "LIVENESS_FAILED",
    "message": "Liveness check failed. Please ensure you are using a live camera feed"
  }
}
```

**Response (Duplicate Detected):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_DETECTED",
    "message": "This face is already registered with another account"
  }
}
```

---

## 3. Ad Wallet Management (P1)

### Get Wallet Balance

```bash
curl -X GET http://localhost:3001/api/v1/ad-wallet/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "realBalance": 0,
    "bonusBalance": 0,
    "totalBalance": 0
  }
}
```

### Top Up Wallet

```bash
curl -X POST http://localhost:3001/api/v1/ad-wallet/topup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "paymentId": "pay_test_123456",
    "paymentMethod": "stripe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "realBalance": 10000,
    "bonusBalance": 5000,
    "totalBalance": 15000,
    "message": "Wallet topped up successfully"
  }
}
```

**Note:** ₹10,000 top-up gets 50% bonus = ₹5,000 bonus (total ₹15,000)

### Top Up with Maximum Bonus

```bash
curl -X POST http://localhost:3001/api/v1/ad-wallet/topup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60000,
    "paymentId": "pay_test_789",
    "paymentMethod": "stripe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "realBalance": 60000,
    "bonusBalance": 60000,
    "totalBalance": 120000,
    "message": "Wallet topped up successfully"
  }
}
```

**Note:** ₹60,000 top-up gets 100% bonus = ₹60,000 bonus (total ₹120,000)

### Apply Coupon Code

```bash
curl -X POST http://localhost:3001/api/v1/ad-wallet/apply-coupon \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "WELCOME100"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "realBalance": 10000,
    "bonusBalance": 5100,
    "totalBalance": 15100,
    "message": "Coupon applied successfully"
  }
}
```

**Available Coupons:**
- `WELCOME100` - ₹100 bonus (no minimum spend)
- `BONUS50` - 50% bonus on balance (min ₹1000 spend)
- `FIRSTTIME` - ₹500 bonus (no minimum spend)

### Get Transaction History

```bash
curl -X GET http://localhost:3001/api/v1/ad-wallet/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "credit",
      "amount": 10000,
      "balanceType": "real",
      "description": "Wallet top-up via stripe",
      "referenceId": "pay_test_123456",
      "timestamp": "2025-04-18T10:30:00.000Z"
    },
    {
      "type": "bonus_credit",
      "amount": 5000,
      "balanceType": "bonus",
      "description": "50% bonus on ₹10000 top-up (valid for 3 months)",
      "referenceId": "pay_test_123456",
      "timestamp": "2025-04-18T10:30:00.000Z"
    }
  ]
}
```

---

## 4. Promotion Campaigns (P1)

### Create a Campaign

```bash
curl -X POST http://localhost:3001/api/v1/promotions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post",
    "targetAudience": {
      "industries": ["Technology", "Finance"],
      "roles": ["Software Engineer", "Product Manager"],
      "locations": ["Bangalore", "Mumbai"],
      "experienceLevels": ["5-10 years", "10+ years"]
    },
    "budget": 5000,
    "dailyBudget": 500,
    "startDate": "2025-04-18T00:00:00.000Z",
    "endDate": "2025-04-28T23:59:59.000Z",
    "metadata": {
      "title": "Hiring Senior Engineers",
      "description": "Join our amazing team!",
      "callToAction": "Apply Now"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "ownerId": "507f1f77bcf86cd799439011",
    "type": "post",
    "status": "active",
    "budget": 5000,
    "spent": 0,
    "impressions": 0,
    "clicks": 0,
    "ctr": 0,
    "targetAudience": {
      "industries": ["Technology", "Finance"],
      "roles": ["Software Engineer", "Product Manager"],
      "locations": ["Bangalore", "Mumbai"]
    }
  }
}
```

### Get User's Campaigns

```bash
curl -X GET http://localhost:3001/api/v1/promotions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Campaign Analytics

```bash
curl -X GET http://localhost:3001/api/v1/promotions/507f1f77bcf86cd799439012/analytics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "507f1f77bcf86cd799439012",
    "status": "active",
    "budget": 5000,
    "spent": 1250,
    "remaining": 3750,
    "impressions": 2500,
    "clicks": 75,
    "ctr": 3.0,
    "costPerImpression": 0.5,
    "costPerClick": 16.67,
    "estimatedReach": 45000,
    "daysRemaining": 8
  }
}
```

### Pause a Campaign

```bash
curl -X PATCH http://localhost:3001/api/v1/promotions/507f1f77bcf86cd799439012/pause \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Resume a Campaign

```bash
curl -X PATCH http://localhost:3001/api/v1/promotions/507f1f77bcf86cd799439012/resume \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Sponsored Content (Feed Injection)

```bash
curl -X GET "http://localhost:3001/api/v1/promotions/feed?industry=Technology&role=Software%20Engineer&location=Bangalore" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "post",
      "metadata": {
        "title": "Hiring Senior Engineers",
        "description": "Join our amazing team!",
        "callToAction": "Apply Now"
      },
      "targetAudience": {
        "industries": ["Technology"],
        "roles": ["Software Engineer"]
      }
    }
  ]
}
```

### Record Impression (Internal Use)

```bash
curl -X POST http://localhost:3001/api/v1/promotions/507f1f77bcf86cd799439012/impression \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Record Click (Internal Use)

```bash
curl -X POST http://localhost:3001/api/v1/promotions/507f1f77bcf86cd799439012/click \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 5. Error Scenarios

### Insufficient Balance

```bash
curl -X POST http://localhost:3001/api/v1/promotions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post",
    "targetAudience": {},
    "budget": 1000000,
    "startDate": "2025-04-18T00:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "CAMPAIGN_CREATION_FAILED",
    "message": "Insufficient balance. Required: ₹1000000, Available: ₹15000"
  }
}
```

### Invalid Coupon

```bash
curl -X POST http://localhost:3001/api/v1/ad-wallet/apply-coupon \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "INVALID123"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "COUPON_FAILED",
    "message": "Invalid coupon code"
  }
}
```

### Unauthorized Access

```bash
curl -X GET http://localhost:3001/api/v1/ad-wallet/balance
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authorization header"
  }
}
```

---

## 6. Complete Test Flow

Here's a complete flow to test all features:

```bash
# 1. Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345","name":"Test User"}'

# 2. Verify email (use OTP from console)
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","otp":"123456"}'

# 3. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345"}'

# Save the accessToken!

# 4. Top up wallet
curl -X POST http://localhost:3001/api/v1/ad-wallet/topup \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"paymentId":"pay_123","paymentMethod":"stripe"}'

# 5. Apply coupon
curl -X POST http://localhost:3001/api/v1/ad-wallet/apply-coupon \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"couponCode":"WELCOME100"}'

# 6. Check balance
curl -X GET http://localhost:3001/api/v1/ad-wallet/balance \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 7. Create campaign
curl -X POST http://localhost:3001/api/v1/promotions \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"post","targetAudience":{"industries":["Technology"]},"budget":1000,"startDate":"2025-04-18T00:00:00.000Z"}'

# 8. Get campaign analytics
curl -X GET http://localhost:3001/api/v1/promotions/CAMPAIGN_ID/analytics \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Bonus Tiers

| Top-up Amount | Bonus % | Bonus Amount | Total Balance |
|---------------|---------|--------------|---------------|
| ₹1,000 - ₹4,999 | 0% | ₹0 | Same as top-up |
| ₹5,000 - ₹9,999 | 25% | ₹1,250 - ₹2,499 | 1.25x |
| ₹10,000 - ₹29,999 | 50% | ₹5,000 - ₹14,999 | 1.5x |
| ₹30,000 - ₹59,999 | 75% | ₹22,500 - ₹44,999 | 1.75x |
| ₹60,000+ | 100% | Equal to top-up | 2x |

---

## Tips

1. **Save your access token** - You'll need it for all authenticated requests
2. **Check console for OTPs** - Email service logs to console in development
3. **Face verification requires AWS** - Configure AWS Rekognition credentials
4. **Bonus expires in 3 months** - Bonus balance has expiry date
5. **Campaigns auto-pause** - When budget is exhausted

---

**Happy Testing! 🚀**
