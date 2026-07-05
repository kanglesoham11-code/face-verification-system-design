<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=220&section=header&text=HIREX&fontSize=90&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Face%20Verification%20System%20Design&descSize=22&descAlignY=55&descAlign=50" width="100%"/>

<br/>

<!-- Animated Typing Effect -->
<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Outfit&weight=700&size=28&duration=3000&pause=1000&color=667EEA&center=true&vCenter=true&multiline=true&repeat=true&width=800&height=80&lines=Professional+Networking+Platform;AI-Powered+Face+Verification;Razorpay+Event+Management;LinkedIn-Style+Architecture" alt="Typing SVG" /></a>

<br/><br/>

<!-- Badges -->
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4.26-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-2962FF?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<br/>

<!-- Social Badges -->
[![Stars](https://img.shields.io/github/stars/kanglesoham11-code/HIREX?style=for-the-badge&color=F59E0B&logo=github)](https://github.com/kanglesoham11-code/HIREX)
[![Forks](https://img.shields.io/github/forks/kanglesoham11-code/HIREX?style=for-the-badge&color=10B981&logo=github)](https://github.com/kanglesoham11-code/HIREX)
[![Issues](https://img.shields.io/github/issues/kanglesoham11-code/HIREX?style=for-the-badge&color=EF4444&logo=github)](https://github.com/kanglesoham11-code/HIREX/issues)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge)](LICENSE)

</div>

---

<div align="center">
  <h3>🏢 Face Verification System Design</h3>
  <p><em>A full-stack enterprise architecture mirroring a LinkedIn-style professional network, heavily focused on integrating a robust AI-powered face verification system. Includes document-based ownership verification, deep facial recognition, real-time networking, and Razorpay-integrated event management.</em></p>
</div>

---

## ✨ Feature Highlights

<table>
<tr>
<td width="50%">

### 🔐 AI Face Verification
- Real-time webcam face capture & liveness detection
- DeepFace-powered facial recognition engine
- Secure identity binding on login & registration
- Anti-spoofing protection layer

</td>
<td width="50%">

### 🏢 Company Ownership Verification
- Upload official documents (GST, CIN, PAN, UDYAM)
- OCR-powered text extraction from certificates
- Cross-verification against government database entries
- Automated approval/rejection pipeline

</td>
</tr>
<tr>
<td width="50%">

### 💼 LinkedIn-Style Job Board
- Verified owners post jobs gated by document approval
- Any user can browse, search, and apply with cover letters
- Applicant dashboard with shortlist/reject workflows
- Real-time notification feed on owner's dashboard

</td>
<td width="50%">

### 🎪 Events with Razorpay Payments
- Create free or paid events with ticket pricing
- Early bird discounts with countdown deadlines
- Razorpay PCI-DSS compliant checkout integration
- Refund policy engine (Full / Partial / None)

</td>
</tr>
<tr>
<td width="50%">

### 🤝 Professional Network
- Discover all registered users platform-wide
- Send / Accept / Reject connection requests
- LinkedIn-style Connected / Received / Sent tabs
- Per-user authentication tokens for accurate routing

</td>
<td width="50%">

### 📰 Social Feed
- Post text, images, and videos to the feed
- Base64 media handling with 100MB upload support
- Like, comment, and engage with professional content
- Media-rich post rendering with inline video players

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         HIREX PLATFORM                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  React 18    │  │  Fastify 4   │  │  Python FastAPI        │  │
│  │  + Vite      │  │  REST API    │  │  Face AI Server        │  │
│  │  + Zustand   │  │  + WebSocket │  │  + DeepFace            │  │
│  │  Port: 3000  │  │  Port: 3001  │  │  Port: 8000            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘  │
│         │                 │                      │                │
│         └────────┬────────┘                      │                │
│                  │                               │                │
│         ┌────────▼────────┐             ┌────────▼────────┐      │
│         │   localStorage  │             │  Document OCR   │      │
│         │   (Demo Mode)   │             │  Verification   │      │
│         └────────┬────────┘             └────────┬────────┘      │
│                  │                               │                │
│         ┌────────▼────────────────────────────────▼────────┐      │
│         │              Razorpay Payment Gateway             │      │
│         │         PCI-DSS Compliant • INR Payments          │      │
│         └──────────────────────────────────────────────────┘      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---:|:---:|
| **Frontend** | ![React](https://img.shields.io/badge/-React_18-61DAFB?logo=react&logoColor=black&style=flat-square) ![Vite](https://img.shields.io/badge/-Vite_5-646CFF?logo=vite&logoColor=white&style=flat-square) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square) | SPA with HMR, type-safe components |
| **State** | ![Zustand](https://img.shields.io/badge/-Zustand-000?logo=react&logoColor=white&style=flat-square) ![LocalStorage](https://img.shields.io/badge/-LocalStorage-F7DF1E?logo=javascript&logoColor=black&style=flat-square) | Global auth state + persistent data |
| **Backend** | ![Fastify](https://img.shields.io/badge/-Fastify_4-000?logo=fastify&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat-square) | High-performance REST API |
| **AI / ML** | ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&style=flat-square) ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square) | Face verification, document OCR |
| **Payments** | ![Razorpay](https://img.shields.io/badge/-Razorpay-2962FF?logo=razorpay&logoColor=white&style=flat-square) | PCI-DSS compliant payment gateway |
| **Styling** | ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white&style=flat-square) ![Lucide](https://img.shields.io/badge/-Lucide_Icons-F56565?style=flat-square) | Custom design system, 200+ icons |

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.10
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone https://github.com/kanglesoham11-code/HIREX.git
cd HIREX

# Install backend + root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install Python dependencies (for Face AI)
pip install fastapi uvicorn deepface opencv-python pydantic python-multipart
```

### 2. Configure Environment

```bash
# Copy the template and fill in your keys
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `.env` with your credentials:
```env
MONGODB_URI=your-mongodb-uri
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

Edit `frontend/.env`:
```env
VITE_RAZORPAY_KEY_ID=your-razorpay-key
```

### 3. Launch All Servers

```bash
# Terminal 1: Start Node.js backend + React frontend
npm run dev

# Terminal 2: Start Python Face AI server
cd files && python -m uvicorn main:app --reload --port 8000
```

### 4. Open in Browser

```
🌐 Frontend:  http://localhost:3000
⚡ Backend:   http://localhost:3001
🤖 Face AI:   http://localhost:8000
```

---

## 📂 Project Structure

```
HIREX/
├── 📁 backend/
│   └── 📁 src/
│       ├── 📁 middleware/      # Auth, rate limiting, CORS
│       ├── 📁 routes/          # API route handlers
│       ├── 📁 services/        # Business logic layer
│       ├── 📁 config/          # Database & app configuration
│       └── 📄 server.ts        # Fastify server entry point
│
├── 📁 frontend/
│   └── 📁 src/
│       ├── 📁 components/      # Layout, Navbar, FaceVerification
│       ├── 📁 pages/           # All application pages
│       │   ├── 📄 DashboardPage.tsx     # Notifications + overview
│       │   ├── 📄 FeedPage.tsx          # Social feed with media
│       │   ├── 📄 ConnectionsPage.tsx   # Professional network
│       │   ├── 📄 JobsPage.tsx          # Job board + applications
│       │   ├── 📄 EventsPage.tsx        # Events + Razorpay
│       │   ├── 📄 CompanyClaimPage.tsx   # Document verification
│       │   └── 📁 auth/                 # Face verification flow
│       ├── 📁 store/           # Zustand auth store
│       └── 📁 lib/             # API client, utilities
│
├── 📁 files/
│   ├── 📄 main.py              # FastAPI face verification server
│   ├── 📄 companies_db.json    # Company registry database
│   └── 📄 faces.json           # Registered face data
│
├── 📄 .env.example             # Environment template (safe)
├── 📄 package.json             # Root monorepo config
└── 📄 README.md                # You are here! 📍
```

---

## 🔄 Core User Flows

### 🔐 Registration & Verification
```mermaid
graph LR
    A[Sign Up] --> B[Face Capture]
    B --> C[Liveness Check]
    C --> D[Face Stored]
    D --> E[Dashboard Access]
    E --> F{Login Next Time}
    F --> G[Face Re-Verify]
    G --> H[Identity Confirmed ✅]
```

### 🏢 Company Ownership Claim
```mermaid
graph LR
    A[Upload Docs] --> B[OCR Extraction]
    B --> C[Auto-fill Fields]
    C --> D[Cross-verify DB]
    D --> E{Match?}
    E -->|Yes| F[✅ Verified Owner]
    E -->|No| G[❌ Rejected]
    F --> H[Unlock Job Posting]
```

### 💳 Event Payment Flow
```mermaid
graph LR
    A[Browse Events] --> B[Click Register]
    B --> C{Free or Paid?}
    C -->|Free| D[Instant Ticket 🎟️]
    C -->|Paid| E[Razorpay Checkout]
    E --> F[Payment Success]
    F --> G[Ticket + Payment ID]
    G --> H[Creator Dashboard Updated]
```

---

## 🎯 Key Pages

| Page | Route | Description |
|:---|:---|:---|
| **Dashboard** | `/dashboard` | Welcome hub with notifications for job apps & event payments |
| **Feed** | `/feed` | Social feed with text, image, video posting |
| **Network** | `/connections` | Discover, connect, manage professional relationships |
| **Jobs** | `/jobs` | Browse listings, apply, or post jobs (verified owners) |
| **Events** | `/events` | Create/attend events with free or Razorpay-paid tickets |
| **Company Claim** | `/company-claim` | Upload & verify business documents for ownership |
| **Profile** | `/profile` | View and manage your professional profile |
| **Settings** | `/settings` | Account and platform preferences |

---

## 🔒 Security Features

- 🧠 **AI Face Verification** — DeepFace anti-spoofing for every login
- 📄 **Document OCR Validation** — Cross-reference uploaded certificates with database
- 🔑 **Per-user JWT Tokens** — Unique encoded tokens prevent identity confusion
- 💳 **PCI-DSS Payments** — Razorpay handles all card data; nothing stored locally
- 🛡️ **Rate Limiting** — Fastify-powered request throttling
- 🚫 **No Keys in Code** — All secrets in `.env` files (gitignored)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=120&section=footer" width="100%"/>

<br/>

**Built with ❤️ by [Soham Kangle](https://github.com/kanglesoham11-code)**

<br/>

<a href="https://github.com/kanglesoham11-code/HIREX"><img src="https://img.shields.io/badge/⭐_Star_this_repo-F59E0B?style=for-the-badge&logo=github&logoColor=white" /></a>

</div>
