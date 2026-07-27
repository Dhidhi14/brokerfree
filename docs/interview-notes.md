# BrokerFree — Interview Notes & Talking Points

> A curated record of architectural decisions, trade-offs, and 
> debugging stories from building BrokerFree end to end. Each entry 
> has a ready-to-use spoken "soundbite" for interviews.

---

## The 30-Second Pitch

> "BrokerFree is a full-stack rental platform for India that tackles 
> three real problems: broker exploitation, fake listings, and 
> security-deposit theft. Owners verify their identity before 
> listing, deposits are held in escrow instead of paid directly to 
> landlords, an AI layer analyses property tour videos against 
> claimed amenities, and move-in/move-out photos protect both sides 
> in disputes. Built on the MERN stack with TypeScript end to end, 
> real Cloudinary storage, real Razorpay payments, and Socket.io 
> real-time chat — deployed live on Render and Vercel."

---

## 1. Architecture & Design Decisions

### Dual-Token JWT Authentication
15-minute access token (response body) + 7-day refresh token 
(HTTP-only cookie). Short expiry limits theft damage; HTTP-only 
cookie blocks XSS. An Axios interceptor refreshes transparently.
**Soundbite:** "I used a dual-token approach — the short access 
token limits exposure if it leaks, and the refresh token can't be 
read by JavaScript since it's HTTP-only, protecting against XSS."

### Role Selection After Account Creation
Registration wizard creates the account in Step 1 (default role) 
but the user picks tenant/owner in Step 3. Built a dedicated 
PATCH /auth/role endpoint rather than delaying account creation 
until the end, so the user could be authenticated early enough for 
OTP verification to use a real token.
**Soundbite:** "The role is chosen after the account exists, so I 
built a dedicated endpoint for it rather than holding the password 
in browser state across the whole wizard."

### Layered Backend Architecture
Routes → Controllers (HTTP only) → Services (business logic) → 
Models (Mongoose only), with Zod Validators at the boundary. Keeps 
logic reusable and testable independent of HTTP.

### Consistent API Response Envelope
Every endpoint returns `{ success, data }` or 
`{ success, error: { code, message } }`. Frontend handles all 
responses uniformly; machine-readable error codes let the UI react 
precisely instead of string-matching messages.

### Bcrypt via Mongoose Pre-Save Hook
Passwords hash automatically on save (10 rounds); the hash is 
stripped from toJSON so it can never leak in a response, even if a 
query forgets to exclude it.

### Geospatial Search with MongoDB 2dsphere
Properties use a 2dsphere index and $geoNear aggregation for 
radius-based "near me" search — a native MongoDB capability that 
would need extra tooling in a relational database.

### Feature Gating Enforced at the Service Layer
Property creation requires KYC verification, checked in the 
service layer (not just hidden in the UI) — so the rule can't be 
bypassed by calling the API directly.

### Role-Based Routing Architecture
Separate route + component pairs per role (/admin, /owner, /tenant), 
each gated by a ProtectedRoute checking `allowedRoles`. Login 
redirects based on the role returned from the backend. The backend 
independently re-checks role on every API call, so frontend state 
manipulation alone can't grant access.

### Partial Unique Indexes for "Current State" Constraints
Needed "one active application per tenant per property" while still 
allowing re-application after rejection. A plain unique index on 
{property, tenant} would permanently block re-application, since old 
rejected documents still match. Solved with a partial unique index 
scoped to only pending/accepted statuses.
**Soundbite:** "Uniqueness constraints often need to be scoped to 
current/active state, not the raw field combination, when soft-state 
transitions are involved."

### Targeted Test Coverage Over Blanket Coverage
13 Jest tests (mongodb-memory-server, real in-memory MongoDB, not 
mocks) targeting the highest-risk logic: password hashing, JWT 
payload correctness, HMAC signature verification for payments 
(valid AND tampered), KYC-gated permissions, and partial-index 
re-apply behavior — not chasing 100% coverage of trivial code.

---

## 2. Mocked Features — Honest Framing

Two features are deliberately mocked, built with the same 
swappable-interface pattern so a real integration would only change 
the service file, not the surrounding architecture:

- **DigiLocker/Aadhaar verification (KYC):** mocked because real 
  government API access requires licensing. Deterministic — Aadhaar 
  numbers ending in '0000' fail, so both approval and rejection can 
  be demoed.
- **AI Video Verification analysis:** mocked because a vision-model 
  API requires a paid account. The pipeline around it is fully real 
  — ffmpeg frame extraction, Cloudinary storage of real frames, 
  async processing. Certain "trap" amenities (pool, garden) are 
  deterministically flagged as mismatches for a realistic demo.
- **Photo Lock comparison:** same mock pattern, with a "kitchen" 
  trap area always showing a minor flagged change.

**Soundbite:** "I mocked the AI judgment steps using the same 
swappable-interface pattern throughout — real infrastructure (file 
handling, storage, async processing), simulated final analysis, 
because paid API access wasn't available during development. In 
production, only the analysis service would change."

---

## 3. Debugging Stories (Strongest Interview Material)

### The 404 from a Missing .env
Registration failed with 404. Browser Network tab showed the 
request hit the frontend's own port instead of the backend — 
VITE_API_URL was undefined because client/.env was missing, so 
Axios fell back to a relative URL. Fixed by creating .env and 
restarting Vite (which only reads .env at startup).
**Lesson:** the Network tab's actual Request URL points straight to 
API bugs.

### GuestRoute Skipped the OTP Step (Race Condition)
Registration silently skipped phone verification. Root cause: the 
wizard authenticates the user mid-flow (Step 1 issues a token), but 
/register was wrapped in a GuestRoute that redirects logged-in users 
away — so it fired before Step 2 (OTP) could render. Both pieces of 
code were individually correct; the bug was their interaction.
**Lesson:** verify actual data state (checked isPhoneVerified in the 
DB), not just that the UI looks right.

### Stale JWT After a Role Change
A freshly-registered owner got 403 on KYC submit despite the 
database correctly showing role: owner. The token was issued in 
Step 1 with the default role and never refreshed after Step 3's role 
update. Fixed by having the role-update endpoint re-issue a token, 
mirroring login.
**Lesson:** JWTs are stateless snapshots — updating the database 
alone is invisible to middleware that reads the role from the token.

### MIME-Type File Upload Rejection
KYC document uploads failed with INVALID_FILE_TYPE for genuinely 
valid images. Cause: Postman/FormData sends application/octet-stream 
for some files, which a strict MIME-only filter rejected. Fixed by 
accepting files if EITHER the MIME type OR the file extension 
matches.

### shadcn Installed Components Into a Literal "@" Folder
The shadcn CLI read the root tsconfig.json (which lacked the path 
alias) instead of tsconfig.app.json, so it treated "@" as a literal 
folder name. Fixed by adding the path mapping to both tsconfig files.
**Lesson:** path aliases must be consistent across every config file 
a tool reads — not just the bundler's.

### Optional vs. Strict vs. No Auth Middleware
A property detail page always 404'd for an owner previewing their 
own unpublished listing, even with a valid token — because the route 
had ZERO auth middleware attached, so req.user was always undefined 
regardless of what was sent. Fixed with a new optionalAuthenticate 
middleware: parses a token if present, never rejects if absent.
**Lesson:** "public" isn't one thing — there's fully anonymous, 
optional-identity, and required-identity, and picking the wrong tier 
silently breaks legitimate use cases.

### Express 5 Made req.query Read-Only
Adding query filtering broke property listing with 500 errors after 
Express 5 upgrade — validation middleware was assigning parsed data 
directly to req.query, which Express 5 made a read-only getter. 
Fixed by writing to a separate req.validatedQuery property instead.
**Lesson:** framework major-version upgrades can silently break 
patterns that "always worked."

### shadcn FormLabel Crash Outside FormField Context
A wizard step crashed to a blank white screen. Console showed 
"useFormField should be used within FormField" — a shadcn form 
primitive was rendered without its required react-hook-form context 
wrapper.
**Lesson:** shadcn's Form* components are context-dependent; use the 
plain Label component for non-form-bound labels.

### Controlled/Uncontrolled Number Input (Two Rounds)
A "Maintenance" field couldn't be cleared — deleting a digit snapped 
back to a fallback value instantly. First fix (defer fallback to 
blur) helped partially but backspacing still misbehaved. Real root 
cause: the input's displayed text was derived directly from the 
numeric form value on every render, so any re-render (or an 
intermediate string that doesn't parse cleanly) overwrote what the 
user was actively typing. Fixed with a local string state that owns 
the display while focused, synced to the form on change but never 
pulled back from the form while the user is editing.
**Lesson:** whenever "what's displayed" and "what's stored" can 
diverge mid-edit, you need two states, synced one direction only 
while focused.

### Silent Fallback Values on Required Fields (UX Anti-Pattern)
Numeric fields silently substituted hardcoded defaults (rent → 
15000) when left empty, instead of showing a validation error — 
meaning a user could accidentally submit wrong data and never know. 
Fixed by letting required fields show proper Zod validation errors 
instead of auto-filling a guess.
**Lesson:** "graceful" fallbacks are right for genuinely optional 
data, wrong for anything business-critical — fail loud, not silent.

### Missing ffprobe Binary
Video frame extraction failed with "Cannot find ffprobe." 
ffmpeg-static only bundles ffmpeg; fluent-ffmpeg needs ffprobe 
configured separately via its own package and setFfprobePath() call.
**Lesson:** don't assume one "static" package covers every native 
binary a library wraps.

### Razorpay Test-Mode Domestic Card Requirement
A generic international test card number (4111 1111 1111 1111) was 
rejected in test-mode Checkout. Razorpay's Indian accounts require 
domestic test cards under RBI rules; fixed by using Razorpay's 
documented domestic test card and the dummy OTP 123456.

### Diagnosing a Real Third-Party API Limitation
A Razorpay refund failed with an opaque "invalid request sent" (400). 
Ruled out the usual suspects methodically: fetched the payment 
directly via Razorpay's API to confirm it was genuinely captured 
(not just authorized), verified the paise conversion was exact and 
matched the original payment. Matched a known razorpay-node GitHub 
issue — Razorpay's sandbox requires available balance to fund 
refunds and returns a generic error instead of "insufficient balance."
**Lesson:** don't assume every third-party failure is your bug — 
verify each assumption independently against the provider's own API 
before chasing a fix that doesn't exist.

### Zod's coerce Creates Input/Output Type Mismatches
z.coerce.number() types a schema's input as unknown and output as 
number. useForm<T> expecting both sides to match caused cascading 
type errors across the resolver, handleSubmit, and FormField. Fixed 
by using plain z.number() since the input already provided a number 
via valueAsNumber.

### NODE_ENV=production Silently Skips devDependencies
Deploying to Render, the build failed with dozens of "missing type 
declaration" TypeScript errors, despite the @types/* packages being 
correctly listed. Root cause: setting NODE_ENV=production causes 
npm install to skip devDependencies by default — but TypeScript 
compilation needs those types. Fixed with 
"npm install --include=dev && npm run build" as the build command.
**Lesson:** build-time and run-time environment needs can conflict 
when the same env variable governs both.

### Methodical Debugging: Can't Log In Despite Correct Credentials
A login failure looked identical to a typo, but visually confirming 
the plaintext password matched exactly ruled that out. Backend 
investigation ruled out duplicate accounts and confirmed the login 
code itself (findOne, bcrypt.compare argument order) was correct. 
Direct bcrypt.compare testing against the stored hash proved the 
stored password genuinely didn't match what was typed — a data issue, 
not a UI or logic bug. Fixed by resetting the password through the 
model's normal field + save() so the pre-validate hashing hook 
re-ran, rather than editing the hash directly.
**Lesson:** verify each layer independently (data existence → code 
logic → actual cryptographic comparison) rather than guessing; never 
manually write a passwordHash field, always go through the model's 
hashing path.

---

## 4. Tooling & Process

### Building with an AI IDE (Cursor)
"I architected the system — wrote coding standards and a PRD as 
documents the AI follows, planned every feature, reviewed every file 
before accepting it, and debugged issues myself. Cursor accelerated 
boilerplate; the design decisions, trade-offs, and root-cause fixes 
were mine." Be ready to explain any line of code and describe a bug 
you personally traced.

### Cursor Account ≠ GitHub Account ≠ Code
These are three independent things. Cursor's account only affects 
its AI chat features; git configuration is local to the project 
folder; only GitHub authentication matters for pushing code.

---

## 5. Quick-Fire Q&A Prep

**"What was the hardest part?"**
> "Flows where steps depend on each other in ways that create timing 
> bugs — a registration wizard authenticating mid-flow while a route 
> guard assumes auth state is static, or a JWT that goes stale the 
> instant the database changes underneath it. These aren't obvious 
> from reading either piece of code alone."

**"What would you improve or add next?"**
> "Move the OTP store from in-memory to Redis so it survives restarts 
> and scales across instances. Add a real vision-API integration to 
> replace the mocked analysis steps. Expand automated test coverage 
> beyond the current 13 targeted tests."

**"How does this scale?"**
> "Stateless JWT auth means I can run multiple server instances 
> behind a load balancer. Socket.io would need a Redis adapter to 
> share state across instances at scale. Background-style processing 
> for video/photo analysis is already decoupled from the request 
> path. The database is the eventual bottleneck, addressed with 
> indexing (already in place for geospatial and status queries) and 
> read replicas."

**"Why should we hire you based on this?"**
> "This shows I can take a real problem, design a system end to end 
> including third-party integrations with real money and real files, 
> debug subtle timing and framework-version issues independently, and 
> ship something that's actually deployed and working — not just 
> follow a tutorial."

## 6. Things to Never Say
- "I just followed a tutorial" — even AI-assisted, the architecture 
  and debugging were owned.
- "The AI did that, I'm not sure how it works" — always explain the 
  reasoning, or say "here's my understanding and how I'd verify it."

---

*BrokerFree: 20-day build, MERN + TypeScript, deployed live on 
Render + Vercel. Every feature above was personally tested, not just 
built.*
