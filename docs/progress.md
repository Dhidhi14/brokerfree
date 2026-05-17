# BrokerFree Progress Log

## Day 1 - [15-05-2026]
- ✅ Project foundation (docs, .cursorrules)
- ✅ Server skeleton with Express + TypeScript
- ✅ MongoDB connection working
- ✅ Health endpoint returns 200
- ✅ Error handling middleware working
- ✅ Winston logger writing to logs/
- ✅ Pushed to GitHub


## Day 2 - [16-05-2026] Authentication backend

### Built (Backend Authentication)
- ✅ User Mongoose model with bcrypt password hashing (10 rounds)
- ✅ Zod validators for register, login, OTP endpoints
- ✅ JWT utilities: access token (15min) + refresh token (7d)
- ✅ Password utilities (hashPassword + comparePassword)
- ✅ OTP service (in-memory Map, logged via Winston)
- ✅ Auth service with full business logic
- ✅ Auth controller with HTTP-only refresh cookies
- ✅ Middleware: authenticate, authorize, validate
- ✅ Express type extension for req.user

### Tested (All 7 Postman Tests + Health = 8 Total)
- ✅ Test 1: POST /api/auth/register → 201 Created
- ✅ Test 2: POST /api/auth/login → 200 OK with accessToken
- ✅ Test 3: GET /api/auth/me (with token) → 200 OK
- ✅ Test 4: POST /api/auth/send-otp → 200 OK (OTP in server logs)
- ✅ Test 5: POST /api/auth/verify-otp → 200 OK
- ✅ Test 6: POST /api/auth/login (wrong password) → 401 INVALID_CREDENTIALS
- ✅ Test 7: GET /api/auth/me (no token) → 401 UNAUTHORIZED

### Tools Used
- Postman Desktop App (synced via git in /postman folder)
- MongoDB Atlas (free M0 cluster)
- Cursor AI (with Agent mode for code generation)

### Issues Solved
- TypeScript `ignoreDeprecations` warning in tsconfig.json
- Located accessToken in long response (was off-screen, needed scroll)




## On Day 2 only  - [16-05-2026]  Frontend Foundation

### Built (Frontend Foundation)
- ✅ React + Vite + TypeScript project
- ✅ Tailwind CSS with indigo-violet theme
- ✅ shadcn/ui + 12 components (button, input, card, form, etc.)
- ✅ Path alias @/ working
- ✅ Axios client with interceptors (token attach + auto-refresh)
- ✅ Auth API module
- ✅ Zustand auth store with localStorage persistence
- ✅ Utility functions + Indian constants
- ✅ React Router with ProtectedRoute
- ✅ 8 placeholder pages
- ✅ Production build passes (npm run build ✓)

### Issues Fixed
- tsconfig ignoreDeprecations TS6 warning
- shadcn installed in literal "@" folder → moved to src/components/ui
- baseUrl deprecation → removed (paths works without it)




## Day 3 - [17-05-2026]

### Built (Authentication UI)
- ✅ Auth layout, OTP input component, navbar
- ✅ Register 3-step wizard (account → OTP → role)
- ✅ Login with role-based redirect
- ✅ Tenant + Owner dashboards
- ✅ PATCH /api/auth/role endpoint

### Bugs Fixed
1. Missing client/.env → 404 on registration
2. GuestRoute skipped OTP step → wizard authenticates mid-flow,
   guard redirected before Step 2 rendered

### Verified
- ✅ Registered "Mayan" (owner) — full flow
- ✅ MongoDB confirms isPhoneVerified: true, role: owner




## On Day 3 only - [17-05-2026]

### Built (Owner KYC System)

#### Backend
- ✅ Cloudinary config + upload middleware (multer, 5MB, jpg/png/pdf)
- ✅ Cloudinary service (uploadDocument, deleteDocument → brokerfree/kyc folder)
- ✅ Mock KYC verification service (simulates DigiLocker — rejects Aadhaar ending 0000)
- ✅ KYC service (submit, status, list pending, review + rollback on failure)
- ✅ KYC routes at /api/kyc (submit, status, pending, review)
- ✅ Sensitive data masking — only aadhaarLast4 / panLast4 stored, never full numbers
- ✅ Audit log model — every admin approve/reject recorded with performedBy + targetUser

#### Frontend
- ✅ KYC API module (submitKyc, getKycStatus, getPendingKyc, reviewKyc)
- ✅ Document uploader component (drag-and-drop, preview, validation, remove)
- ✅ KYC status badge (gray/amber/green/red by status)
- ✅ Owner KYC page — status-driven UI (form / pending / verified / rejected)
- ✅ Admin verifications page (pending list, document dialog, approve/reject)
- ✅ Owner dashboard updated with KYC status section + "Complete Verification" CTA
- ✅ Navbar updated (Admin link for admins, Verification link for owners)
- ✅ New routes: /owner/kyc, /admin, /admin/verifications

### Bugs Fixed
1. **MIME-type file rejection** — multer filtered real images because Postman sends
   application/octet-stream. Fixed by checking file extension OR mimetype (not just mimetype).

2. **Stale JWT after role change** — freshly-registered owners got 403 on KYC submit
   because the token issued at Step 1 still carried role: "tenant". The PATCH /role
   endpoint now re-issues a fresh token with the updated role, and the frontend stores it.
   Lesson: the JWT is the source of truth for role — updating the DB alone is not enough.

### Tested (Full Flow in Browser)
- ✅ Fresh owner registers → submits KYC immediately (no re-login needed after fix)
- ✅ Documents upload to Cloudinary (real URLs returned)
- ✅ Admin logs in → sees pending owner → views documents → approves
- ✅ Owner sees green "verified" state after approval
- ✅ MongoDB confirms: isAadhaarVerified: true, ownerVerificationStatus: "verified"

### Next: Day 6 - Property Module (CRUD, photo uploads, geospatial search, listing wizard)