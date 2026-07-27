# BrokerFree

**Trust-first rentals for India — verified owners, escrow-protected deposits, AI-checked listings. No brokers.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Mode-072654?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com/)

---

## The Problem

Indian renters routinely lose tens of thousands of rupees to broker commissions, fake listings, and stolen security deposits. Mainstream portals still tolerate middlemen, while “broker-free” alternatives often ship weak identity checks and little deposit protection. Discrimination by bachelor status, religion, or food habits is common — and almost never accountable.

## The Solution

**BrokerFree** is a verified rental platform built for Indian metros. Only KYC-verified owners can list; video tours are analyzed before a trust badge goes live; security deposits are held in Razorpay escrow until move-out is documented; and both parties leave public ratings after the lease. The goal is a complete, demoable trust stack — search → apply → agree → pay → move-in → move-out — without a broker in the loop.

---

## Key Features

| Feature | What it does | Real vs mocked |
| --- | --- | --- |
| **Aadhaar / PAN owner KYC** | Owners upload ID docs; admins approve before listing | **Document upload & storage: real** (Cloudinary). **DigiLocker / government ID check: mocked** with a swappable verification interface (demo trap: Aadhaar ending in `0000` is rejected) |
| **AI video tour verification** | Extracts frames from the tour video, scores amenity match, flags mismatches | **ffmpeg frame extraction + Cloudinary: real**. **Vision / LLM analysis: mocked** behind a swappable interface (deterministic trap amenities for demos) |
| **Escrow-protected deposits** | Tenant pays deposit + first month; funds held until release / refund / dispute | **Razorpay Checkout, HMAC verification, refunds, webhooks: real** (test mode only — no live money) |
| **Digital rent agreements** | PDF generated from accepted application; both parties e-sign | **PDF generation (pdfkit) + Cloudinary storage: real**. **Legal e-sign / DigiSign provider: mocked** (in-app confirm-to-sign state machine) |
| **Move-in / move-out photo lock** | Room-by-room photo sets; comparison report at lease end | **Photo upload: real**. **Damage comparison AI: mocked** with a swappable interface (deterministic “kitchen” trap for demos) |
| **Real-time chat** | Tenant ↔ owner messaging with typing indicators | **Fully real** — Socket.io + REST history, JWT on handshake |
| **Bi-directional ratings** | Tenant rates owner and owner rates tenant after lease | **Fully real** — aggregates update on the User model |

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form + Zod, React Router, Axios, Socket.io-client, Lucide |
| **Backend** | Node.js, Express, TypeScript, MongoDB / Mongoose, Socket.io, JWT (access + refresh cookies), Zod, Winston, Multer, BullMQ / Redis (optional) |
| **Third-party** | Cloudinary (media), Razorpay (escrow, test mode), ffmpeg / ffprobe (video frames), pdfkit (agreements) |
| **Testing** | Jest, ts-jest, mongodb-memory-server, Supertest |

---

## Architecture

The backend follows a strict layered pattern:

```
routes → middleware (auth, validate) → controllers → services → models
```

- **Routes** — mount endpoints and attach middleware only  
- **Controllers** — HTTP `req` / `res` only; no business logic  
- **Services** — all domain logic; return data or throw `AppError`  
- **Models** — Mongoose schemas, indexes, and virtuals  

API responses use a consistent envelope: `{ success, data?, error?, meta? }`.

**Role-based access** uses three roles:

| Role | Capabilities |
| --- | --- |
| **tenant** | Search, apply, chat, sign agreements, pay escrow, photo lock, rate owners |
| **owner** | KYC, list properties (after verification), review applications, chat, sign, receive escrow release, rate tenants |
| **admin** | Approve / reject owner KYC and listings, manage escrow disputes / releases, view platform analytics |

---

## Screenshots

> *[Add screenshots here]*

Suggested captures for a strong GitHub first impression:

1. **Home page** — brand + verified listings hero  
2. **Property detail with AI verification** — gallery, AI-Verified badge, match score  
3. **Escrow-protected deposit** — Razorpay Checkout / “Deposit Protected” state on agreement  
4. **Admin dashboard** — live stats + quick actions (KYC, properties, escrow)  
5. **Chat** — real-time tenant ↔ owner thread with typing indicator  

Place images under something like `docs/screenshots/` and link them here, e.g.:

```markdown
![Home page](docs/screenshots/home.png)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended) and npm  
- **MongoDB** — local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster  
- **Cloudinary** account (media uploads)  
- **Razorpay** test-mode keys (payments / escrow)  
- **ffmpeg** is bundled via `ffmpeg-static` / `ffprobe-static` for video frame extraction — no system install required for the happy path  

Optional: Redis (caching / BullMQ), Anthropic API key (when swapping in real Claude Vision).

### Clone and install

```bash
git clone https://github.com/<your-username>/BrokerFree.git
cd BrokerFree

cd server
npm install

cd ../client
npm install
```

### Environment variables

Copy the example files and fill in values. **Never commit real secrets.**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### Server (`server/.env`)

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Access-token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Frontend origin for CORS / cookies (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay **test** key id |
| `RAZORPAY_KEY_SECRET` | Razorpay **test** key secret |
| `ANTHROPIC_API_KEY` | Optional — for a future real Vision integration |
| `REDIS_URL` | Optional — Redis URL for caching / jobs |

See `server/.env.example` for the template. The Zod env loader in `server/src/config/env.ts` validates required variables at startup.

#### Client (`client/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

See `client/.env.example`.

### Run development servers

Use two terminals:

```bash
# Terminal 1 — API + Socket.io
cd server
npm run dev
```

```bash
# Terminal 2 — Vite frontend
cd client
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)  
- API health: [http://localhost:5000/health](http://localhost:5000/health)  

### Run tests

```bash
cd server
npm test
```

---

## API Documentation

Mounted in `server/src/app.ts`:

| Route group | Description |
| --- | --- |
| `GET /health` | Liveness / uptime check |
| `/api/auth` | Register, login, OTP, refresh, me, role, profile, password |
| `/api/admin` | Admin stats and platform oversight |
| `/api/kyc` | Owner KYC submit, status, pending queue, admin review |
| `/api/properties` | CRUD, search, geospatial nearby, media, admin approve / reject, video verification |
| `/api/applications` | Apply, list (tenant / owner), accept / reject, withdraw |
| `/api/chat` | Conversations, paginated messages, mark as read (realtime via Socket.io) |
| `/api/agreements` | Create PDF agreement, list, get, dual e-sign flow |
| `/api/escrow` | Razorpay order, payment verify, webhook, release / refund / dispute |
| `/api/photo-lock` | Move-in / move-out photo sets and comparison report |
| `/api/reviews` | Create review, list by user, review-status checks |

A Postman collection lives under `postman/` / `.postman/` for manual exploration.

---

## Project Structure

```
BrokerFree/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api/            # Axios modules + TanStack Query hooks
│       ├── components/     # UI + feature components (shadcn/ui)
│       ├── constants/      # Indian cities, amenities, etc.
│       ├── hooks/
│       ├── lib/            # cn(), socket helpers
│       ├── pages/          # Route-level screens by role
│       ├── store/          # Zustand (auth, UI)
│       ├── types/
│       ├── App.tsx
│       └── routes.tsx
├── server/                 # Express + TypeScript API
│   └── src/
│       ├── config/         # env, db, Cloudinary, Razorpay
│       ├── controllers/
│       ├── middleware/     # auth, validate, errors, uploads
│       ├── models/
│       ├── routes/
│       ├── services/       # Business logic + mock adapters
│       ├── socket/         # Socket.io auth + events
│       ├── tests/          # Jest suites
│       ├── utils/
│       ├── validators/     # Zod schemas
│       ├── app.ts
│       └── server.ts
├── docs/                   # PRD, schemas, progress log
├── postman/                # API collection
└── shared/                 # Shared constants / types (if used)
```

---

## Testing

Backend automated tests: **13 Jest tests across 4 suites**, using an in-memory MongoDB (`mongodb-memory-server`) — no external DB required.

| Suite | Coverage |
| --- | --- |
| `auth.test.ts` | Password hashing, login success / failure, JWT payload, duplicate email |
| `escrow.test.ts` | Valid / invalid HMAC-SHA256 checkout signatures; non-tenant order rejection |
| `property.test.ts` | KYC gate before listing; create → `pending-verification`; ownership on update / delete |
| `application.test.ts` | Partial unique index — duplicate pending blocked; re-apply after reject allowed |

```bash
cd server && npm test
# 13/13 passing
```

---

## Live Demo

🔗 **Live Demo:** https://brokerfree-azure.vercel.app  
🔧 **Backend API:** https://brokerfree-t8qd.onrender.com  

> **Note:** Hosted on free tiers (Render + Vercel). The backend may take 30–60 seconds to wake up on the first request after inactivity.

Deployment details: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## Author

**[Your Name]**  
Portfolio project — MERN rental platform focused on verification, escrow, and trust UX for the Indian market.

| | |
| --- | --- |
| **LinkedIn** | `[Your LinkedIn URL]` |
| **GitHub** | `[Your GitHub profile URL]` |
| **Email** | `[your.email@example.com]` |  

---

## License

ISC (see `server/package.json`). Update this section if you publish under a different license.

---

*Built as a full-stack portfolio piece: real payments in Razorpay test mode, real media pipelines, and honest mock adapters where government / AI APIs would otherwise block a free-tier demo.*
