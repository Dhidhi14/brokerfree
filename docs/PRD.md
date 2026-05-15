# BrokerFree Product Requirements Document

## Product Vision
A trust-first rental platform for India that eliminates broker fraud, deposit theft, and rental discrimination through verification, escrow, and AI.

## Problem Statement
Indian renters lose ₹50,000+ annually to brokers, fake listings, and stolen deposits. Existing platforms either tolerate brokers (99acres, MagicBricks) or have weak verification (NoBroker). Discrimination based on bachelor status, religion, food habits is rampant with no accountability.

## Target Users

### Primary: Tenants (25-35 years)
- Working professionals in Indian metros
- Earn ₹30K-₹2L/month
- Frustrated by brokers, fake listings, deposit fraud
- Tech-savvy, use Zomato/Swiggy daily

### Primary: Property Owners (30-60 years)
- Own 1-3 rental properties
- Tired of broker commissions, no-show tenants, property damage
- Want verified tenants and digital agreements

### Secondary: Platform Admin
- BrokerFree employee verifying owners and mediating disputes

## Core User Flows

### Tenant Journey
1. Land on homepage → see verified listings
2. Sign up: email + phone OTP → complete tenant profile
3. Search by city/locality/budget/amenities
4. View property detail with AI-verified video tour
5. Apply to property → real-time chat with verified owner
6. Schedule visit → visit → mark visited
7. Owner approves → generate rent agreement → both sign digitally
8. Pay deposit + first month rent → deposit held in escrow
9. Move in: upload room-by-room photos (locked, timestamped)
10. Live in property → monthly rent paid directly to owner
11. Move out: upload photos → AI compares with move-in → resolves deposit
12. Rate the owner publicly

### Owner Journey
1. Sign up → upload Aadhaar/PAN for KYC (mock DigiLocker)
2. Wait for admin verification (2 min in demo)
3. Add property: photos, video, amenities, pricing
4. AI analyzes video tour → verification badge added
5. Receive applications from verified tenants
6. Chat with applicants → schedule visits
7. Approve preferred tenant → both sign agreement
8. Receive deposit notification (held in escrow, not yet released)
9. Receive monthly rent automatically
10. At lease end: photo comparison → escrow released
11. Get rated by tenant publicly

### Admin Journey
1. Login to admin panel
2. Review owner KYC submissions → approve/reject
3. Review listings flagged for discrimination
4. Mediate escrow disputes (see AI suggestions)
5. View platform analytics

## Feature List (Priority Order)

### Must-Have (MVP)
1. **Authentication**: Email + phone OTP, JWT tokens, role-based access
2. **Owner KYC**: Document upload, mock Aadhaar verification, admin approval
3. **Property CRUD**: Multi-step listing wizard, photo/video upload, geolocation
4. **Property Search**: Filters, map view, list view, pagination
5. **AI Video Verification**: Claude Vision analyzes tour, generates report ⭐
6. **Application Workflow**: Apply, shortlist, schedule visit, approve/reject
7. **Real-time Chat**: Socket.io, message history, typing indicators
8. **Rent Agreement Generator**: PDF generation, state-specific templates, digital signatures
9. **Razorpay Escrow**: Hold deposits, state machine, webhook handlers ⭐
10. **Move-in/out Photo Lock**: Time-stamped, geo-tagged, AI damage comparison ⭐
11. **Bi-directional Ratings**: Tenant rates owner, owner rates tenant
12. **Admin Panel**: Verifications, disputes, analytics

### Nice-to-Have (Post-MVP)
- Saved searches with email alerts
- Roommate matching
- Maintenance request tickets
- Multi-language UI (Hindi)
- Mobile app

### Out of Scope (V1)
- Real Aadhaar API integration (mocked)
- Real DigiLocker integration (mocked)
- Real e-signature service (mocked)
- Property sales (only rentals)
- International users

## Success Metrics (Demo Goals)
- Tenant can complete full flow: search → apply → rent → move-in → move-out
- Owner can complete full flow: KYC → list → approve → receive deposit → handle move-out
- AI video verification works on real property tour videos
- Escrow correctly holds/releases/splits deposits
- All states/transitions in escrow tested

## Technical Constraints
- Build in 3 months working part-time
- Use only free tier services
- No real payments (Razorpay test mode only)
- Mock government API integrations (Aadhaar, DigiLocker)
- Demo deployed to Vercel + Render free tiers

## Design Principles
1. **Trust-first**: Verification badges, transparency in every step
2. **Mobile-first**: 70% users will be on mobile
3. **Fast**: Page loads under 2s, API responses under 500ms
4. **Indian-friendly**: ₹ currency, Indian city defaults, regional context
5. **Accessible**: ARIA labels, keyboard navigation, screen reader support