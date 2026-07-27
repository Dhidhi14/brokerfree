# BrokerFree — Deployment Guide

BrokerFree is deployed as a three-service stack on free tiers.

## Architecture

```
┌─────────────────────┐     HTTPS      ┌──────────────────────────┐
│  Vercel (Frontend)  │ ─────────────► │  Render (Backend API)    │
│  Vite / React       │                │  Node.js / Express       │
│  brokerfree-azure   │                │  + Socket.io             │
│  .vercel.app        │                │  brokerfree-t8qd         │
└─────────────────────┘                │  .onrender.com           │
                                       └────────────┬─────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────────┐
                                       │  MongoDB Atlas (M0)      │
                                       │  Shared DB (local + prod)│
                                       └──────────────────────────┘
```

| Service | Platform | URL |
| --- | --- | --- |
| Frontend | Vercel | https://brokerfree-azure.vercel.app |
| Backend API | Render | https://brokerfree-t8qd.onrender.com |
| Database | MongoDB Atlas | Cluster URI (not public) |

Media (Cloudinary) and payments (Razorpay test mode) remain third-party SaaS — no self-hosting required.

---

## Environment Variables

### Render (Backend)

Set these in the Render dashboard → Environment.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | Render usually injects this; app must listen on `process.env.PORT` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Access-token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | Yes | e.g. `15m` |
| `JWT_REFRESH_EXPIRES` | Yes | e.g. `7d` |
| `CLIENT_URL` | Yes | Live frontend origin — `https://brokerfree-azure.vercel.app` (CORS + cookies) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Yes | Razorpay **test** key id |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay **test** key secret |
| `ANTHROPIC_API_KEY` | No | Optional — for a future real Vision integration |
| `REDIS_URL` | No | Optional — Redis for caching / BullMQ |

Validated at startup by `server/src/config/env.ts` (Zod).

### Vercel (Frontend)

Set these in the Vercel project → Settings → Environment Variables.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend API base — `https://brokerfree-t8qd.onrender.com/api` |

Must be available at **build time** (Vite inlines `import.meta.env.VITE_*`).

### MongoDB Atlas

| Setting | Value |
| --- | --- |
| Network Access | Allow `0.0.0.0/0` so Render’s dynamic IPs can connect |
| Database User | App user with read/write on the BrokerFree database |

---

## Deployment Steps

### 1. MongoDB Atlas

1. Create (or reuse) an M0 free cluster.
2. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere). Required because Render outbound IPs are not fixed on free tier.
3. Copy the connection string into `MONGO_URI` on Render.

### 2. Backend — Render Web Service

1. Connect the GitHub repo to Render.
2. Create a **Web Service** with:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |

3. Add all required environment variables (see table above).
4. Set `CLIENT_URL` to the Vercel frontend URL.
5. Deploy. Confirm `GET /health` returns `200`.

### 3. Frontend — Vercel

1. Import the same GitHub repo into Vercel.
2. Project settings:

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

3. Set `VITE_API_URL=https://brokerfree-t8qd.onrender.com/api`.
4. Deploy. Open the production URL and verify login + data against Atlas.

---

## Known Gotchas

### `NODE_ENV=production` skips `devDependencies`

Render (and npm) treat `NODE_ENV=production` as a signal to skip `devDependencies` during `npm install`. TypeScript builds need packages like `@types/express`, `@types/pdfkit`, `typescript`, and `tsc-alias`, which live in `devDependencies`.

**Symptom:** Build fails with dozens of “Could not find a declaration file…” / missing type errors.

**Fix:** Use an explicit build command that still installs dev deps:

```bash
npm install --include=dev && npm run build
```

### MongoDB Atlas Network Access

If Atlas only allows your home IP, Render cannot connect. Allow `0.0.0.0/0` for free-tier hosting (or pin Render static IPs on a paid plan).

### CORS / cookies

`CLIENT_URL` on the backend must exactly match the live Vercel origin (scheme + host, no trailing slash mismatch). Otherwise browser requests fail CORS and refresh cookies may not attach.

### Vite env at build time

Changing `VITE_API_URL` on Vercel requires a **redeploy** — it is baked into the client bundle at build time.

---

## Free-Tier Limitations

| Limitation | Impact |
| --- | --- |
| **Render spin-down** | Free web services sleep after inactivity. The next request can take **~30–60 seconds** while the dyno wakes. |
| **Cold start UX** | First login / API call after idle may hang briefly — expected, not a bug. |
| **Razorpay** | Test mode only; no real money movement. |
| **Atlas M0** | Shared cluster; fine for demos, not production traffic. |

Health check after wake:

```bash
curl https://brokerfree-t8qd.onrender.com/health
```

---

## Local vs Production

| Concern | Local | Production |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | `https://brokerfree-azure.vercel.app` |
| API | `http://localhost:5000` | `https://brokerfree-t8qd.onrender.com` |
| `CLIENT_URL` | `http://localhost:5173` | Vercel URL |
| `VITE_API_URL` | `http://localhost:5000/api` | `https://brokerfree-t8qd.onrender.com/api` |
| Database | Same Atlas cluster (or local Mongo) | Atlas |

See also: root [`README.md`](../README.md) Getting Started section for local setup.
