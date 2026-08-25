SUPERCLAIM

Insurance Platform for Gadget, Wearable & Electronics

PRODUCT REQUIREMENTS DOCUMENT

Version 2.0  |  2025  |  CONFIDENTIAL

Document Title

SuperClaim — Product Requirements Document (PRD)

Version

2.0 — Updated: Supabase Stack, Xendit, KYC, Claim Milestone, 5% Deductible

Status

Draft — For Review & Approval

Language

Bilingual Platform — Bahasa Indonesia & English

Target Market

Indonesia (Primary)

Stakeholders

SuperClaim Backoffice · Dealer Network · End Users

Changelog v2.0

Tech stack → Supabase + Railway + Xendit | KYC per-claim toggle | Claim milestone tracker | 5% platform deductible on all claims

1. Executive Summary

SuperClaim is a web-based insurance platform for gadgets, wearable accessories, and electronic devices. It connects three primary stakeholders — Backoffice, Dealers, and End Users — through a fully digital ecosystem covering policy issuance, claim management, commission tracking, KYC verification, and product configuration.

Version 2.0 updates the technical foundation to a Supabase-first architecture (database, authentication, file storage), Railway for backend hosting and Redis, and Xendit as the payment gateway. New product features include: KYC verification on claims (toggleable per Backoffice setting), a user-facing claim milestone tracker, and a mandatory 5% platform deductible applied to all claim approvals.

1.1 Key Objectives

Enable Dealers to sell insurance products and activate policies on behalf of users with zero friction.

Provide End Users a transparent, real-time claim experience with milestone tracking from submission to resolution.

Enforce identity verification (KYC) on claims when enabled by Backoffice, reducing fraud risk.

Apply a 5% platform deductible on all approved claim payouts, configurable and auditable.

Give SuperClaim Backoffice full control over products, pricing, coverage, commissions, KYC toggle, and claim adjudication.

Automate policy issuance and user onboarding via email invitation upon premium activation.

Support flexible commission disbursement schedules (weekly, bi-weekly, monthly) per dealer agreement.

2. Stakeholders & Roles

2.1 SuperClaim Backoffice (Admin)

Central control hub. Manages all platform configuration, dealer management, product setup, KYC settings, and claim adjudication.

Core Responsibilities

Invite, onboard, activate, and deactivate Dealers

Create and configure products per category (Gadget, Wearable, Electronics)

Define plans/tiers per product with pricing, coverage rules, and limits

Configure commission rates and disbursement schedules per Dealer

Toggle KYC requirement ON/OFF globally or per product plan

Review and approve/reject insurance claims

View 5% deductible applied per approved claim in financial reports

Generate reports: sales, claims, commissions, KYC status, policy status

2.2 Dealer

Authorized resellers who sell SuperClaim policies. Earn commission per policy sold.

Core Responsibilities

Activate insurance premiums/policies on behalf of customers

View sales dashboard, active policies, and commission summary

Track commission earnings and disbursement history

View customers and their claim status

2.3 End User (Policyholder)

Customers who purchase insurance through a Dealer. Receive email invitation upon policy activation. Can track their claim progress through a visual milestone tracker.

Core Responsibilities

Set up account via email invitation

View active policy and coverage details

Submit claims with required documents + KYC verification (if enabled)

Track claim progress through real-time milestone tracker

View final claim payout (original amount minus 5% platform deductible)

3. Insurance Product Structure

3.1 Product Categories

Category

Examples

Coverage Types

Gadget

Smartphone, Tablet, Laptop

Physical damage, Water damage, Loss, Short circuit

Wearable Accessories

Smartwatch, Earbuds, Fitness Tracker

Physical damage, Water damage, Loss, Short circuit

Electronics

Camera, Game Console, Smart TV

Physical damage, Water damage, Loss, Short circuit

3.2 Plan / Tier Parameters (All Configurable by Backoffice)

Parameter

Description

Configurable By

Plan Name

e.g., Basic, Silver, Gold

Backoffice

Premium Price

Price paid per policy activation

Backoffice

Policy Duration

Active period in months

Backoffice

Coverage Types

Which incident types are covered

Backoffice

Max Claims per Period

e.g., max 2 claims per year

Backoffice

Max Claim Value

e.g., 80% of device purchase price

Backoffice

Cooldown Days

Min. days between claims

Backoffice

Commission Rate

Dealer commission % per sale

Backoffice

KYC Required

Toggle ON/OFF per plan — requires identity verification on each claim

Backoffice

Platform Deductible

5% of approved claim amount — mandatory, non-waivable

System (fixed)

3.3 Coverage Types & Required Documents

Coverage Type

Description

Required Documents

Physical Damage

Cracked screen, dents, broken parts

Min. 3 photos + detail video, purchase invoice, KTP, policy number

Water Damage

Liquid ingress damage

Min. 3 photos + detail video, purchase invoice, KTP, policy number

Loss / Theft

Device stolen or lost

Police report (min. Polres level / Surat Kehilangan), KTP, purchase invoice, policy number

Short Circuit / Electrical

Damage from electrical fault or surge

Min. 3 photos + detail video, purchase invoice, KTP, policy number

4. KYC (Know Your Customer) — Claim Verification

KYC is a per-claim identity verification step designed to prevent fraud and confirm that the person submitting the claim is the registered policyholder. It can be enabled or disabled globally or per product plan by the Backoffice.

4.1 KYC Settings (Backoffice)

Global toggle: enable KYC for all claims platform-wide

Per-plan toggle: override global setting for specific product plans

KYC method: selfie + KTP photo (liveness check)

KYC provider: integrated via third-party eKYC API (e.g., Verihubs, Privy, or Sumsub)

KYC results stored in Supabase and linked to claim record

Failed KYC blocks claim submission until re-verification passes

4.2 KYC Flow (User)

Step

Action

1

User starts claim submission form

2

System checks: is KYC required for this plan? (if OFF → skip to step 7)

3

User prompted: "Identity verification required to proceed"

4

User uploads: photo of KTP (front) + selfie holding KTP

5

System submits to eKYC provider — liveness + name match check

6

Result: PASS → proceed to claim form | FAIL → prompt re-upload (max 3 attempts)

7

KYC status (PASSED / SKIPPED / FAILED) stored against claim record

8

Backoffice sees KYC status on claim review panel

4.3 KYC Status in Backoffice

KYC Status

Meaning

Backoffice Action

PASSED

Identity verified by eKYC provider

Proceed with normal claim review

SKIPPED

KYC was disabled for this plan at time of submission

Proceed — KYC not required

FAILED

User failed eKYC after max attempts

Claim blocked — cannot be approved until KYC passes

PENDING

KYC in progress or not yet submitted

Wait for user to complete KYC

5. Platform Deductible (5%)

A mandatory 5% platform deductible is applied to every approved claim payout. This is a fixed system rule and cannot be waived. It is clearly disclosed to users during onboarding, in the policy document, and at the point of claim submission.

5.1 Deductible Calculation

Field

Example

Notes

Claimed Amount

Rp 5.000.000

Amount assessed and approved by Backoffice

Platform Deductible (5%)

Rp 250.000

System-calculated automatically

Net Payout to User

Rp 4.750.000

Shown clearly on claim approval notification

Deductible Revenue

Rp 250.000

Credited to SuperClaim platform revenue ledger

5.2 Deductible Rules

Applied to ALL approved claims, regardless of product, plan, or claim type

Rate is fixed at 5% — not configurable per plan (platform-level rule)

Deductible is calculated on the approved claim amount (post-coverage-cap assessment)

Displayed to user in: policy certificate, claim submission summary, approval notification

Tracked in financial reports: per claim, per dealer, per period

Deductible amount credited to SuperClaim revenue in the financial ledger

5.3 Disclosure Points

Policy certificate (PDF): explicit deductible clause

Claim submission form: "Note: A 5% platform deductible will be applied to the approved payout."

Claim approval email/WhatsApp: "Approved: Rp X | Deductible (5%): Rp Y | Net payout: Rp Z"

6. Claim Milestone Tracker (User-Facing)

The claim milestone tracker is a visual, real-time progress indicator displayed in the User Portal. It shows the current status of a claim in a step-by-step format, giving users full visibility into where their claim is in the process without needing to contact support.

6.1 Milestone Stages

Stage

Label (EN)

Label (ID)

Description

Trigger

1

Submitted

Klaim Diterima

Claim successfully submitted by user

User submits claim form

2

KYC Verification

Verifikasi KYC

Identity check in progress (shown only if KYC is ON)

KYC result pending

3

Under Review

Sedang Ditinjau

Backoffice is reviewing documents and claim details

Backoffice opens claim

4

Additional Docs

Dokumen Tambahan

Backoffice requested additional documents from user

Backoffice clicks Request Docs

5

Decision Made

Keputusan Diambil

Claim approved or rejected

Backoffice approves or rejects

6

Payout Processing

Pembayaran Diproses

Payout being processed (approved claims only)

System triggers payout

7

Completed

Selesai

Payout transferred or claim closed

Payout confirmed / rejection final

6.2 UI Behaviour

Displayed as a horizontal step indicator on the Claim Detail page

Active stage highlighted; completed stages show checkmark; pending stages grayed out

Stage 2 (KYC Verification) is hidden entirely when KYC is disabled for the plan

Stage 4 (Additional Docs) appears only if Backoffice has requested documents; otherwise skipped

Each stage shows: stage name, date/time it was entered, and a short status message

Mobile-responsive: collapses to vertical stepper on small screens

Notification sent at each stage transition (email + WhatsApp + in-app)

6.3 Claim Status Summary Card

Alongside the milestone tracker, a summary card shows:

Claim reference number

Incident type and date

Submitted amount

Approved amount (if decided) + 5% deductible breakdown + net payout

Estimated resolution timeline (configurable SLA shown to user, e.g. "3–5 business days")

Contact support button

7. Core User Flows

7.1 Dealer Onboarding Flow

Step

Actor

Action

1

Backoffice

Invite Dealer via email (name, business info)

2

System

Send invitation email with time-limited registration link

3

Dealer

Click link → complete profile → set password via Supabase Auth

4

Backoffice

Review and activate Dealer account

5

System

Notify Dealer of approval — Dealer Portal access granted

6

Backoffice

Configure commission rate and disbursement schedule for Dealer

7.2 Policy Activation & User Onboarding Flow

Step

Actor

Action

1

Dealer

Login to Dealer Portal via Supabase Auth

2

Dealer

Select product category → product → plan

3

Dealer

Input customer: name, email, phone, device details, serial number, purchase date & price

4

Dealer

Payment via Xendit: bank transfer / VA / QRIS / e-wallet

5

System

Xendit webhook confirms payment → policy issued automatically

6

System

Generate policy number + PDF certificate stored in Supabase Storage

7

System

Send email invitation to user: policy summary + account setup link

8

User

Click link → set password via Supabase Auth → access User Portal

7.3 Claim Submission Flow (with KYC & Deductible)

Step

Actor

Action

1

User

Login → navigate to "Submit Claim" → select active policy

2

User

Select incident type → fill claim form (date, location, description)

3

System

Check: is KYC required for this plan?

4

User

[If KYC ON] Upload KTP photo + selfie → eKYC verification runs

5

User

Upload required documents → stored in Supabase Storage (signed URLs)

6

System

Show deductible notice: "5% deductible will apply to approved payout"

7

User

Confirm and submit → claim reference number issued

8

System

Notify Backoffice of new claim → milestone set to "Submitted"

9

Backoffice

Open claim → review documents + KYC status → set milestone "Under Review"

10

Backoffice

If docs insufficient → Request Additional Docs → milestone "Additional Docs Required"

11

Backoffice

Approve or Reject with notes → milestone "Decision Made"

12

System

[If approved] Calculate: net payout = approved amount − 5% deductible

13

System

Notify user (email + WhatsApp): approved amount, deductible, net payout

14

System

Milestone progresses → "Payout Processing" → "Completed"

7.4 Commission Disbursement Flow

Step

Actor

Action

1

System

Auto-calculate commission per policy sold (rate × premium)

2

System

Accumulate in Dealer commission ledger in Supabase

3

Backoffice

Review commission summary at disbursement period (weekly/bi-weekly/monthly)

4

Backoffice

Confirm disbursement — mark as paid

5

System

Update ledger — send payout notification to Dealer (email + WhatsApp)

8. Feature Requirements

8.1 Backoffice Portal

8.1.1 Dealer Management

Invite, edit, activate, suspend, deactivate dealers

Set commission rate and disbursement schedule per dealer

View dealer sales performance and commission history

8.1.2 Product & Plan Management

Create/edit/archive product categories, products, and plans

Configure all plan parameters including KYC toggle per plan

5% deductible is system-fixed — displayed on plan config but not editable

8.1.3 KYC Configuration

Global KYC toggle (enable/disable platform-wide)

Per-plan KYC toggle (overrides global for that plan)

Select eKYC provider and manage API credentials

View KYC audit log: who was verified, when, result

8.1.4 Claim Management

View all claims with filters: status, date, dealer, product, KYC status, claim type

Open individual claim: view documents (via Supabase Storage signed URLs), KYC result, milestone history

Approve: enter approved amount → system calculates 5% deductible → shows net payout

Reject: mandatory rejection reason → notifies user

Request additional documents → milestone updated → user notified

Export claim reports (CSV)

8.1.5 Financial Reports

Commission ledger per dealer: earned, pending, paid

Platform deductible revenue report: total deductible collected per period

Sales summary: policies sold by product, plan, dealer

Claim payout summary: approved amounts, deductibles, net payouts

8.2 Dealer Portal

8.2.1 Dashboard

Total policies sold, commission earned, pending disbursement, this month sales

Recent activations and notifications

8.2.2 Policy Activation

Select product → plan → enter customer + device details

Trigger Xendit payment flow → payment confirmed → policy issued

Download policy certificate (PDF from Supabase Storage)

8.2.3 My Customers

List all customers and their policy status, claim history

8.2.4 Commission Center

Earnings per policy, disbursement history, downloadable statements

8.3 User Portal

8.3.1 Onboarding

Accept email invite → set password via Supabase Auth → complete profile

8.3.2 My Policy

View policy card: product, plan, number, dates, status, coverage details

Download policy certificate PDF from Supabase Storage

8.3.3 Claim Submission

Incident type selection → claim form → KYC step (if enabled) → document upload → deductible notice → submit

Documents uploaded to Supabase Storage with access control (user-scoped)

Claim reference number issued on submission

8.3.4 Claim Tracker (Milestone)

Visual step-by-step milestone tracker on Claim Detail page

Real-time status updates at each stage transition

Summary card: claim ref, amounts, deductible breakdown, SLA estimate

Upload additional documents inline if requested

Full claim history list with status badges

8.3.5 Notifications

Email + WhatsApp + in-app at every milestone transition

Approval notification explicitly shows: approved amount, 5% deductible, net payout

9. Claim Rules & Validation Engine

Rule

Logic

Action if Failed

Policy Active

Claim date within policy start and end dates

Block — policy expired or inactive

Coverage Match

Incident type in plan's covered list

Block — incident not covered

Claim Frequency Limit

Approved claims in period < max per period

Block — limit reached

Claim Value Cap

Claimed amount ≤ plan's max claim value %

Flag — exceeds cap

Cooldown Period

Days since last claim ≥ plan cooldown days

Block — cooldown not elapsed

Document Completeness

All required docs uploaded per incident type

Block — prompt missing docs

Police Report (Loss)

If incident = Loss, Surat Kehilangan mandatory

Block — alert user

KYC Check

If plan KYC=ON, KYC must PASS before submission

Block — KYC must be completed

5% Deductible

Always applied on approved amount

System auto-calculates — cannot be skipped

10. Notification System

Trigger Event

Recipient

Channel

Dealer invited

Dealer

Email

Dealer account activated

Dealer

Email

Policy issued (premium activated)

User

Email (invitation + policy summary)

Policy issued confirmation

Dealer

Email + WhatsApp

Claim submitted

User

Email + WhatsApp + In-app

Claim submitted (alert)

Backoffice

In-app

KYC result: PASSED

User

In-app

KYC result: FAILED

User

Email + In-app (re-upload prompt)

Milestone: Under Review

User

Email + WhatsApp + In-app

Milestone: Additional Docs Requested

User

Email + WhatsApp + In-app

Claim approved (with deductible breakdown)

User

Email + WhatsApp + In-app

Claim rejected (with reason)

User

Email + WhatsApp + In-app

Milestone: Payout Processing

User

WhatsApp + In-app

Milestone: Completed

User

Email + WhatsApp + In-app

Policy expiring in 30 days

User

Email + WhatsApp

Commission disbursed

Dealer

Email + WhatsApp

Password reset

Any

Email

11. Technology Stack

11.1 Architecture Overview

SuperClaim uses a Supabase-first architecture for database, authentication, and file storage. The backend API runs on Railway with Redis for async job queues. Xendit handles all payment processing. The frontend is a Next.js monorepo serving three portals under separate route groups.

11.2 Full Stack Specification

Layer

Technology

Purpose

Frontend

Next.js 14 (App Router) + TypeScript

Shared codebase — 3 portals under /admin, /dealer, /portal route groups

UI / Design System

Tailwind CSS + shadcn/ui

Accessible, consistent component library

State Management

Zustand + TanStack Query (React Query)

Server state via React Query; UI state via Zustand

Authentication

Supabase Auth

Email/password, magic link, JWT sessions, RBAC via user metadata (ADMIN / DEALER / USER)

Database

Supabase (PostgreSQL)

Primary relational DB — policies, claims, commissions, KYC records, audit logs

ORM / Query

Supabase JS Client + typed schema

Type-safe queries; use Supabase generated types from DB schema

File Storage

Supabase Storage

Claim documents, KYC images, policy PDFs — bucket-per-type with RLS policies

Backend API

Node.js + Fastify (TypeScript) on Railway

Business logic, webhooks, commission calculation, claim rules engine

Async Jobs / Queue

BullMQ + Redis (Railway Redis)

Email dispatch, WhatsApp notifications, report generation, payout webhooks

Payment Gateway

Xendit SDK

Virtual Account, QRIS, e-wallet (GoPay, OVO, DANA), credit/debit card — webhook confirms payment → policy issued

Email

SendGrid or Mailgun

Transactional emails — bilingual branded templates

WhatsApp / SMS

Fonnte or Wablas API

Claim milestone updates, policy notifications, commission alerts

eKYC Provider

Verihubs / Privy / Sumsub (TBD)

Selfie + KTP liveness check for claim KYC

PDF Generation

Puppeteer or @react-pdf/renderer

Policy certificate generation — stored to Supabase Storage

Hosting — Frontend

Vercel

Next.js deployment with CI/CD from GitHub

Hosting — Backend

Railway

Fastify API + BullMQ workers

Hosting — Redis

Railway Redis

Queue backend for BullMQ

Monitoring

Sentry (errors) + Posthog (analytics)

Error tracking and user behavior

12. Supabase Architecture Detail

12.1 Authentication (Supabase Auth)

All three roles (ADMIN, DEALER, USER) authenticate via Supabase Auth

Role stored in user_metadata: { role: "ADMIN" | "DEALER" | "USER" }

Invitation flow: Supabase invite_user_by_email() → user sets password on first login

JWT tokens verified server-side on every API request

Row Level Security (RLS) enforced at DB layer per role

Password reset via Supabase built-in email flow

12.2 Database — Key Tables

Table

Key Fields

Notes

profiles

id (auth.users FK), role, full_name, phone, status

Extends Supabase auth.users

dealers

id, profile_id, business_name, bank_account, commission_schedule, status

One dealer per profile

product_categories

id, name, description, is_active

Gadget / Wearable / Electronics

products

id, category_id, name, description, is_active

Products per category

plans

id, product_id, name, price, duration_months, coverage_types[], max_claims, max_claim_value_pct, cooldown_days, commission_rate, kyc_required, is_active

kyc_required: boolean per plan

policies

id, plan_id, dealer_id, user_id, policy_number, device details, start_date, end_date, status, payment_ref (Xendit)

payment_ref links to Xendit transaction

claims

id, policy_id, claim_ref, incident_type, incident_date, description, status, kyc_status, approved_amount, deductible_amount, net_payout, rejection_reason, reviewed_by

deductible_amount = approved_amount × 0.05

claim_documents

id, claim_id, document_type, storage_path, file_name, uploaded_at

storage_path = Supabase Storage path

claim_milestones

id, claim_id, stage, entered_at, note

One row per stage transition

kyc_records

id, claim_id, user_id, provider, status, provider_ref, verified_at

KYC result per claim

commissions

id, dealer_id, policy_id, amount, rate, status, disbursement_date, period

Auto-created on policy activation

notifications

id, user_id, type, title, body, channel, is_read, sent_at

In-app notification log

audit_logs

id, actor_id, action, entity_type, entity_id, changes_json, created_at

All Backoffice actions

12.3 Supabase Storage — Bucket Structure

Bucket

Contents

Access Policy

policy-certificates

Policy PDF certificates

User can read own; Dealer can read their customers; Admin full access

claim-documents

All claim document uploads (photos, videos, PDFs)

User can upload/read own claims; Admin full access

kyc-documents

KTP photos + selfies for KYC

User can upload; Admin read-only; strictly access-controlled

report-exports

CSV/Excel report exports generated by Backoffice

Admin only

12.4 Row Level Security (RLS) — Key Policies

profiles: users can read/update their own row only; admin can read all

policies: users see only their own policy; dealers see policies they activated; admin sees all

claims: users see only their own claims; admin sees all; dealers cannot access claim content

claim_documents: users can INSERT on their own claims; SELECT on own claims; admin full access

kyc_documents: user INSERT only (no SELECT — privacy); admin SELECT for review

commissions: dealers can SELECT their own rows; INSERT/UPDATE restricted to backend service role

13. Xendit Payment Integration

13.1 Payment Flow

Step

Action

Detail

1

Dealer selects plan and confirms order

Frontend calls backend /payment/create

2

Backend creates Xendit invoice or VA

Amount = plan premium; description = policy details; metadata = { plan_id, dealer_id, customer_data }

3

Dealer completes payment

VA / QRIS / e-wallet / card via Xendit checkout

4

Xendit fires webhook to backend

POST /webhooks/xendit — verified with Xendit callback token

5

Backend processes webhook

Status = PAID → create policy record → generate PDF certificate → trigger user invitation email

6

System notifies dealer

Email + WhatsApp: "Policy activated successfully"

13.2 Supported Payment Methods

Bank Virtual Account: BCA, BNI, BRI, Mandiri, Permata

QRIS (all QR-compatible apps)

E-Wallets: GoPay, OVO, DANA, ShopeePay

Credit / Debit Card (Visa, Mastercard)

Retail: Alfamart, Indomaret

13.3 Xendit Webhook Security

All webhooks verified using x-callback-token header against environment secret

Idempotency: webhook events stored with xendit_event_id to prevent duplicate processing

Failed webhook retry: Xendit retries up to 3x; backend handles gracefully

Payment expiry: invoices expire after 24 hours — dealer notified to re-initiate

14. Non-Functional Requirements

Requirement

Specification

Language

Bilingual: Bahasa Indonesia (default) & English — user-switchable

Availability

99.5% uptime SLA — Railway auto-restart; Supabase managed infrastructure

Performance

Page load < 2s; API response < 500ms; Supabase queries optimized with indexes

Security

Supabase RLS, SSL/TLS, bcrypt passwords, JWT auth, RBAC, signed storage URLs

File Uploads

Max 50MB per video; 10MB per image; accepted: JPG, PNG, PDF, MP4

KYC Privacy

KYC documents stored in restricted bucket; purged after 90 days per data policy

Scalability

Supabase scales automatically; Railway supports horizontal scaling for API workers

Data Retention

Policy and claim data: 7 years minimum (insurance regulation compliance)

Audit Logging

All Backoffice actions logged to audit_logs table with full change diff

Mobile Responsive

All portals fully responsive — milestone tracker optimized for mobile

Browser Support

Chrome, Firefox, Safari, Edge — latest 2 major versions

15. Development Milestones

Phase

Scope

Target

Phase 1 — Foundation

Supabase project setup (DB schema, RLS, Auth, Storage buckets), Railway deploy, Next.js monorepo scaffold with 3 portal route groups

Week 1–2

Phase 2 — Auth & Backoffice Core

Supabase Auth for all roles, Backoffice: dealer invite & management, product & plan management (incl. KYC toggle per plan)

Week 3–4

Phase 3 — Dealer Portal & Policy Activation

Dealer portal: policy activation form, Xendit payment integration (VA + QRIS + e-wallet), webhook handler, policy PDF to Supabase Storage, user email invitation

Week 5–7

Phase 4 — User Portal & Policy View

User onboarding via Supabase Auth invite, User portal: policy view, certificate download

Week 8

Phase 5 — Claims & KYC

Claim submission form, document upload to Supabase Storage, eKYC integration (Verihubs/Privy), KYC flow + result storage, claim rules engine, 5% deductible calculation

Week 9–11

Phase 6 — Claim Milestone Tracker

Claim milestone DB table, Backoffice sets milestones on claim actions, User portal: visual milestone tracker UI (desktop + mobile), claim summary card with deductible breakdown

Week 12

Phase 7 — Backoffice Claim Review

Backoffice claim review panel: documents viewer, KYC status, approve/reject/request docs, deductible auto-calculation on approval

Week 13

Phase 8 — Notifications

BullMQ + Railway Redis setup, email templates (SendGrid), WhatsApp API (Fonnte), in-app notifications, milestone transition triggers

Week 14–15

Phase 9 — Commission & Reports

Commission ledger, disbursement management, financial reports (sales, claims, deductible revenue, commissions), CSV export

Week 16

Phase 10 — i18n & Polish

Bilingual (next-intl): Bahasa Indonesia + English, mobile QA, performance optimization, Supabase query tuning

Week 17

Phase 11 — QA & Launch

End-to-end testing, Xendit sandbox → production, security audit (RLS, storage policies), UAT with all stakeholders, Railway production deploy

Week 18–20

16. Open Questions & Decisions Needed

#

Question

Priority

1

Which eKYC provider? Verihubs (local, affordable), Privy (trusted in ID), or Sumsub (international)?

High

2

Is claim payout manual (bank transfer by Backoffice) or automated via Xendit Disbursement API?

High

3

Is SuperClaim the underwriter, or partnering with a licensed insurer (wajib OJK)?

High

4

Are there OJK / POJK insurance product filing requirements to address before launch?

High

5

What is the SLA for claim resolution shown to users in the milestone tracker? (e.g. 3–5 business days)

Medium

6

Can the 5% deductible be waived for VIP customers or special dealer agreements?

Medium

7

Do dealers need a printed/physical policy certificate to hand to customers at point of sale?

Low

8

Is there a maximum claim value in absolute Rupiah (in addition to the % cap)?

Medium

9

Multi-tenant: will SuperClaim run as a white-label platform for other insurers in the future?

Low

— End of Document —