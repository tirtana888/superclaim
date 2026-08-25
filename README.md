# 🛡️ SuperClaim — Digital Insurance Platform (v2.0)

**SuperClaim** is a comprehensive multi-stakeholder insurance platform for gadget and electronics protection in Indonesia, connecting Backoffice Admins, Authorized Dealer Retailers (iBox, Digimap, Erafone, Samsung), and Policyholder Customers.

---

## 🚀 Key Features

### 1. 🏢 Backoffice Admin Portal (`/admin`)
- **Dashboard (`/admin/dashboard`)**: Platform-wide metrics (active policies, claim queue, platform revenue).
- **Claim Adjudication (`/admin/claims`)**: Document evidence inspector, Didit.me biometric audit, and approval with **automatic 5% Platform Deductible calculation**.
- **Dealer Network (`/admin/dealers`)**: Onboarding & invitation via Supabase Auth Admin API (`inviteUserByEmail`), commission tiering (10–15%), and payout schedules.
- **eKYC Configuration & Audit (`/admin/kyc` & `/admin/kyc/audit`)**: Global KYC toggle, per-plan overrides, and audit log for Didit.me liveness decisions.
- **Financial Ledgers & Deductible Reports (`/admin/reports`)**: 5% deductible platform revenue audit table, real CSV exports, and batch dealer commission disbursement.

### 2. 🏪 Dealer Retail Portal (`/dealer`)
- **Point of Sale Activation (`/dealer/activate`)**: 4-step POS wizard for in-store checkout.
- **Xendit Payment Integration**: Dynamic invoice creation with QRIS, BCA, Mandiri, BNI Virtual Accounts, and E-Wallets.
- **Customer Portfolio (`/dealer/customers`)**: Real-time list of all policies issued by the store with instant access to digital certificates.
- **Commission Tracker (`/dealer/commissions`)**: Accrued earnings, pending batches, and disbursement history.

### 3. 📱 User / Policyholder Portal (`/portal`)
- **Dashboard (`/portal/dashboard`)**: Insured gadget cards, policy countdowns, and quick claim actions.
- **Policy Portfolio & Details (`/portal/policies` & `/portal/policy/[id]`)**: Coverage terms, peril inclusions, claim limits (max 2 per year), and deductible disclosures.
- **Claim Submission Wizard (`/portal/claims/new`)**: 4-step wizard with incident chronology, Didit.me selfie liveness check, evidence upload, and mandatory 5% Deductible acknowledgment.
- **7-Stage Milestone Tracker (`/portal/claims/[id]`)**: Real-time progress stepper (Submitted $\rightarrow$ KYC $\rightarrow$ Under Review $\rightarrow$ Additional Docs $\rightarrow$ Decision Made $\rightarrow$ Payout Processing $\rightarrow$ Completed) with SLA timeframes and requested document re-upload form.
- **Official Digital Certificate (`/portal/certificates/[id]`)**: Printable and downloadable PDF policy certificate with verification QR code and official SuperClaim authorization seal.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui primitives, Lucide Icons
- **Database & Auth**: Supabase PostgreSQL (`sc_*` isolated tables), Supabase Auth with RBAC middleware, Supabase Storage (`sc-claim-documents`, `sc-policy-certificates`, `sc-kyc-documents`)
- **Identity & eKYC**: Didit.me (`didit.me`) biometric 3D liveness + KTP OCR matching
- **Payment Gateway**: Xendit Payment Gateway (Invoices, QRIS, Virtual Accounts, Webhook callbacks)
- **Email Delivery**: Alibaba Cloud DirectMail SMTP relayed via Supabase Auth custom SMTP
- **State Management**: Zustand persisted store (`lib/store.ts`) & REST API handlers (`/app/api/...`)
- **i18n**: Bilingual platform support (Bahasa Indonesia & English)

---

## ⚙️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and set your credentials:
```bash
cp .env.example .env.local
```

### 3. Database Migrations
Execute the SQL migrations in your Supabase SQL Editor:
- `supabase/migrations/001_sc_schema.sql` (Creates all 14 `sc_*` tables, indexes, and 5% deductible calculation trigger)
- `supabase/migrations/002_sc_rls_and_storage.sql` (RLS policies and Storage buckets)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Database Safety & POS Isolation
All SuperClaim database tables, views, and storage buckets are strictly prefixed with **`sc_*`** to ensure zero interference with co-located POS/retail databases.

---

## 📜 License
Private & Confidential — SuperClaim Platform 2025.
