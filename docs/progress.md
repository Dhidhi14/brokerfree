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


## Day 6 - [25-07-2026]

### Built (Property Module Backend)
- ✅ Property model with geospatial 2dsphere index
- ✅ Create/list/search/nearby/my-properties/update/delete endpoints
- ✅ Photo upload to Cloudinary
- ✅ Owner verification gate (only KYC-verified owners can list)
- ✅ Admin approval workflow (pending → live/inactive), mirrors KYC review
- ✅ Audit log entries for property approve/reject

### Bugs Fixed
1. GET /:id always 404'd for owner previewing own pending property —
   route had zero auth middleware, req.user always undefined. Fixed
   with a new optionalAuthenticate middleware.
2. Express 5 broke req.query mutation (now read-only). Validated
   query data now goes to req.validatedQuery instead.

### Tested (full lifecycle)
- ✅ Create property → pending-verification
- ✅ Admin approves → live → appears in public + geospatial search
- ✅ Admin rejects → inactive + reason stored
- ✅ Re-review blocked with 400

### Pending
- Owner KYC still needs a real (non-manual) end-to-end test for
  owner@brokerfree.com — tracked, will do before final demo

### Next: Day 6-7 continued — Frontend (listing wizard, search page, detail page, admin property review UI)

## Day 6-7 - [25-07-2026] Property Module Frontend

### Built (Property Module Frontend)
- ✅ Property API module + types (property.api.ts, property.types.ts)
- ✅ Property card component (photo, title, rent, bed/bath/area chips)
- ✅ Property listing wizard — 4 steps (basics, location, pricing, photos)
- ✅ My Properties page (owner) with status badges
- ✅ Public search/browse page with filters, sort, pagination
- ✅ Property detail page (gallery, owner info, status banners)
- ✅ Admin property verifications page (mirrors KYC review UI)
- ✅ Property approval workflow wired end-to-end in the UI
- ✅ Navbar + dashboard updates for all three roles

### Bugs Fixed
1. Wizard crashed (blank white screen) on Location step — a FormLabel
   was used outside its required FormField context (shadcn/react-hook-form
   pattern violation).
2. Numeric inputs (rent, deposit, maintenance, etc.) couldn't be cleared/
   edited normally — display was derived directly from the numeric form
   value on every render instead of holding a separate local "typing"
   state, so edits got overwritten mid-keystroke. Fixed by keeping local
   string state while focused, syncing to the form only on change, and
   syncing back from the form only when not focused.
3. Required numeric fields silently substituted hardcoded fallback values
   (e.g. rent → 15000) when left empty instead of showing a validation
   error — a UX/data-integrity risk. Removed all silent fallbacks for
   required fields; they now properly show "X is required" on submit.
4. Login appeared to fully reload the page instead of showing an error
   toast. Root cause: the axios response interceptor treated every 401
   (including a wrong-password login attempt) as an expired session,
   tried to refresh, failed, and force-redirected with
   window.location.href. Fixed by excluding auth endpoints
   (login/register/refresh) from the auto-refresh-and-redirect logic.
5. Admin login intermittently failed with "Invalid email or password"
   despite correct-looking credentials — traced to an actual password/
   hash mismatch (confirmed via direct bcrypt.compare testing) rather
   than a UI bug. Fixed by resetting the password through the model's
   normal password field + .save() so the pre-validate hashing hook
   re-ran correctly.

### Tested (Full Flow in Browser)
- ✅ Guest browses live properties on /properties
- ✅ Verified owner completes the 4-step wizard → property created
  as pending-verification
- ✅ Admin reviews pending property, views documents, approves
- ✅ Approved property appears in public search and geospatial "near me"

### Pending
- Owner KYC still needs a real (non-manual) end-to-end test for
  owner@brokerfree.com — tracked, will do before final demo



## Day 8-9 - [25-07-2026] AI Video Verification

### Built (Backend)
- ✅ ffmpeg-based frame extraction (6 frames per video)
- ✅ Video + frame upload to Cloudinary
- ✅ Mock AI analysis service (swappable interface, same pattern as
  KYC mock) — deterministic trap amenities (pool/garden/home theatre)
  for demoable mismatch detection
- ✅ Async processing (processing → completed/failed), polled by client
- ✅ Property model: videoVerification sub-document with results,
  overallMatchScore, flaggedIssues

### Built (Frontend)
- ✅ Video uploader component
- ✅ Verification status component (processing spinner, results card,
  frame lightbox)
- ✅ AI-Verified public trust badge on property detail page
- ✅ My Properties: Add/View Video Tour per property

### Bugs Fixed
1. Missing ffprobe binary — ffmpeg-static only bundles ffmpeg, not
   ffprobe; fluent-ffmpeg needs both. Installed ffprobe-static and
   wired setFfprobePath separately.

### Tested (Full Flow)
- ✅ Real video → real frame extraction → Cloudinary storage →
  mock analysis → 86% match score with 2 correctly flagged mismatches
- ✅ Public AI-Verified badge displays correctly
- ✅ Owner results view shows amenities, confidence, frame gallery



## Day 10 - [25-07-2026] Rental Applications

### Built (Backend)
- ✅ Application model with partial unique index ({property, tenant}
  scoped to pending/accepted only, allowing re-apply after reject/withdraw)
- ✅ Apply, view (tenant/owner), respond (accept/reject), withdraw
- ✅ Denormalized owner field for efficient owner-side queries

### Built (Frontend)
- ✅ Apply dialog on property detail (disabled if already applied)
- ✅ My Applications page (tenant) with withdraw
- ✅ Received Applications page (owner) with filters + accept/reject

### Tested (Full Flow)
- ✅ Tenant applies → owner sees it in received list → accepts
- ✅ Status badges and owner response display correctly on both sides


## Day 11 - [25-07-2026] Chat Backend (Socket.io)

### Built (Backend)
- ✅ Conversation model (unique trio index: property + tenant + owner)
- ✅ Message model with pagination-friendly indexes
- ✅ Chat service: get/create conversation, list, paginated messages,
  send, mark as read, participant verification
- ✅ REST endpoints at /api/chat (conversations, messages, read)
- ✅ Socket.io server attached to the HTTP server, JWT auth via
  handshake.auth.token
- ✅ Socket rooms: user:{userId} and conversation:{id}
- ✅ Socket events: join-conversation, send-message, typing → new-message,
  typing, joined-conversation, error

### Tested (REST via Postman)
- ✅ Tenant creates conversation with owner for a property
- ✅ Tenant sends message → owner sees it in conversations list with
  correct unreadCount and lastMessage
- ✅ Owner fetches paginated messages for the conversation


## Day 11 - [25-07-2026] Chat Frontend (Socket.io Client)

### Built (Frontend)
- ✅ Socket.io client with SocketProvider (reconnects on token change)
- ✅ Chat API module + types + TanStack Query hooks
- ✅ Conversations list page with unread badges
- ✅ Chat thread page: message history (REST), live messages (socket),
  typing indicator, mark-as-read
- ✅ "Message Owner" / "Message Tenant" entry points from property
  detail and applications pages
- ✅ Navbar Messages link with unread count

### Tested (Real-Time, Two Sessions)
- ✅ Tenant and owner exchange messages live via Socket.io, no refresh needed
- ✅ Unread badges update correctly
- ✅ Typing indicator works

### Fixed
- apply-dialog.tsx type errors: z.coerce.number() caused an input/output
  type mismatch with useForm<T>'s generic. Switched to z.number() since
  the input field already provides a number via valueAsNumber.

### Next: Day 12 - Rent Agreement PDF

## Day 12 - [25-07-2026] Rent Agreement PDF (Backend)

### Built (Backend)
- ✅ Agreement model (one per application, terms snapshot from property)
- ✅ PDF generation service (pdfkit) — property address, party details,
  terms, boilerplate clauses, signature lines
- ✅ PDF uploaded to Cloudinary (raw resource type, agreements folder)
- ✅ Agreement service: create (idempotent), get, list mine, sign
- ✅ Signing state machine: draft → pending-signatures → executed
  (once both tenant and owner sign)
- ✅ REST endpoints at /api/agreements

### Tested (Full Flow via Postman)
- ✅ Created agreement from an accepted application — real PDF
  generated and opens correctly from Cloudinary
- ✅ Tenant signs → tenantSignedAt set
- ✅ Owner signs → ownerSignedAt set, status → executed

### Built (Frontend)
- ✅ Agreement API module + types + TanStack Query hooks
- ✅ Agreement status badge (draft / pending-signatures / executed)
- ✅ My Agreements list page + Agreement detail page
- ✅ Detail: terms summary, View/Download PDF, dual signature status,
  confirm-to-sign dialog, executed celebration banner
- ✅ "Agreement" CTA on accepted applications (tenant + owner) —
  idempotent create then navigate
- ✅ Routes `/agreements`, `/agreements/:id` + Navbar link

### Next: Day 13

## Day 12 - [25-07-2026] Rent Agreement Frontend

### Built (Frontend)
- ✅ Agreement API module, types, TanStack Query hooks
- ✅ Agreement status badge (draft/pending-signatures/executed)
- ✅ My Agreements list page
- ✅ Agreement detail page: lease terms summary, PDF link, digital
  signature panel with confirm dialog, executed celebration banner
- ✅ "Agreement" CTA on accepted applications (tenant + owner sides),
  idempotent create-or-get flow
- ✅ Navbar "Agreements" link

### Tested (Browser, Both Roles)
- ✅ Executed agreement displays correctly for both tenant and owner
- ✅ Terms, PDF link, and both signature timestamps render correctly

### Next: Day 13-14 - Escrow (Razorpay)

## Day 13-14 - [25-07-2026] Escrow (Razorpay)

### Built (Backend)
- ✅ Razorpay order creation, HMAC-SHA256 signature verification
  (timing-safe), webhook handler as defensive backup
- ✅ Escrow state machine: pending → held → released/refunded/disputed
- ✅ Status history log + audit log entries for admin actions
- ✅ Real Razorpay refund API integration (test mode)

### Built (Frontend)
- ✅ Razorpay Checkout integration (script load, order → pay → verify)
- ✅ Escrow section on agreement detail: pay/protected/dispute/terminal states
- ✅ Deposits page (tenant/owner), Admin Escrow Management page

### Tested (Real Razorpay Test-Mode Payment, Full Flow)
- ✅ Real payment completed via Razorpay Checkout (domestic test card)
- ✅ Signature verified → status "held" → "Deposit Protected" UI
- ✅ Admin releases to owner → status "released", removed from queue
- ⚠️ Refund path: code verified correct via direct Razorpay API
  inspection (payment confirmed "captured", amount/paise conversion
  exact) — blocked only by Razorpay test-account balance limits for
  refunds, a known sandbox constraint, not an application bug

### Next: Day 15-16 - Photo Lock (move-in/move-out photo verification)

## Day 15-16 - [26-07-2026] Photo Lock (Backend)

### Built (Backend)
- ✅ PhotoLock model — move-in and move-out photo sets, one per agreement
- ✅ Mock photo comparison service (swappable interface, same pattern
  as KYC/video verification) — deterministic "kitchen" trap area for
  demoable flagged findings
- ✅ Move-in must be submitted before move-out is allowed
- ✅ Auto-triggered comparison on move-out submission
- ✅ REST endpoints at /api/photo-lock

### Tested (Full Flow via Postman)
- ✅ Move-in photos submitted (living-room, kitchen) → real Cloudinary URLs
- ✅ Move-out photos submitted → comparison auto-ran
- ✅ Kitchen correctly flagged as "minor" change, living-room clean
- ✅ overallCondition: "fair"

### Next: Day 15-16 continued - Photo Lock frontend
