-- ==========================================================
-- SUPERCLAIM PLATFORM SCHEMA (v2.0)
-- Strict isolation: all tables use `sc_` prefix to guarantee
-- 0% interference with existing POS / Retail tables.
-- ==========================================================

-- 1. Profiles Table (Extends auth.users for SuperClaim roles)
CREATE TABLE IF NOT EXISTS public.sc_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEALER', 'USER')),
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Dealers Table
CREATE TABLE IF NOT EXISTS public.sc_dealers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.sc_profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_address TEXT,
    contact_person TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_holder TEXT,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    commission_schedule TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (commission_schedule IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Product Categories Table
CREATE TABLE IF NOT EXISTS public.sc_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.sc_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.sc_product_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Plans Table
CREATE TABLE IF NOT EXISTS public.sc_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.sc_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    duration_months INT NOT NULL DEFAULT 12,
    coverage_types TEXT[] NOT NULL DEFAULT '{"physical_damage"}',
    max_claims INT NOT NULL DEFAULT 2,
    max_claim_value_pct NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    cooldown_days INT NOT NULL DEFAULT 30,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    kyc_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Policies Table
CREATE TABLE IF NOT EXISTS public.sc_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number TEXT UNIQUE NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.sc_plans(id),
    dealer_id UUID REFERENCES public.sc_dealers(id),
    user_id UUID REFERENCES auth.users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    device_category TEXT NOT NULL,
    device_brand TEXT NOT NULL,
    device_model TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(15,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    payment_ref TEXT,
    payment_channel TEXT,
    paid_at TIMESTAMPTZ,
    certificate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Claims Table
CREATE TABLE IF NOT EXISTS public.sc_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_ref TEXT UNIQUE NOT NULL,
    policy_id UUID NOT NULL REFERENCES public.sc_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    incident_type TEXT NOT NULL CHECK (incident_type IN ('physical_damage', 'water_damage', 'loss', 'short_circuit')),
    incident_date DATE NOT NULL,
    incident_location TEXT NOT NULL,
    description TEXT NOT NULL,
    claimed_amount NUMERIC(15,2) NOT NULL,
    approved_amount NUMERIC(15,2),
    deductible_amount NUMERIC(15,2) DEFAULT 0,
    net_payout NUMERIC(15,2),
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'KYC_PENDING', 'UNDER_REVIEW', 'DOCS_REQUESTED', 'APPROVED', 'REJECTED', 'PAYOUT_PROCESSING', 'COMPLETED')),
    kyc_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (kyc_status IN ('NOT_REQUIRED', 'PENDING', 'PASSED', 'FAILED')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Claim Documents Table
CREATE TABLE IF NOT EXISTS public.sc_claim_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.sc_claims(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('PHOTO', 'VIDEO', 'INVOICE', 'KTP', 'POLICE_REPORT', 'OTHER')),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Claim Milestones Table (7-Stage Tracker)
CREATE TABLE IF NOT EXISTS public.sc_claim_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.sc_claims(id) ON DELETE CASCADE,
    stage INT NOT NULL CHECK (stage BETWEEN 1 AND 7),
    stage_name TEXT NOT NULL,
    stage_name_id TEXT NOT NULL,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. KYC Records Table
CREATE TABLE IF NOT EXISTS public.sc_kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES public.sc_claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider TEXT NOT NULL DEFAULT 'verihubs',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASSED', 'FAILED')),
    provider_ref TEXT,
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Commissions Table
CREATE TABLE IF NOT EXISTS public.sc_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES public.sc_dealers(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES public.sc_policies(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISBURSED', 'CANCELLED')),
    disbursement_date TIMESTAMPTZ,
    period_batch TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.sc_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    changes_json JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.sc_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('EMAIL', 'WHATSAPP', 'IN_APP')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Global Settings Table (KYC global toggle, default SLA, etc.)
CREATE TABLE IF NOT EXISTS public.sc_global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Auto-calculate 5% deductible trigger on claim update
CREATE OR REPLACE FUNCTION public.sc_fn_calculate_deductible()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approved_amount IS NOT NULL AND (OLD.approved_amount IS DISTINCT FROM NEW.approved_amount) THEN
        NEW.deductible_amount := ROUND(NEW.approved_amount * 0.05, 2);
        NEW.net_payout := ROUND(NEW.approved_amount - NEW.deductible_amount, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sc_trg_calculate_deductible ON public.sc_claims;
CREATE TRIGGER sc_trg_calculate_deductible
    BEFORE INSERT OR UPDATE OF approved_amount ON public.sc_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.sc_fn_calculate_deductible();

-- Default initial seed data for Categories & Global Settings (safe idempotent inserts)
INSERT INTO public.sc_product_categories (name, code, description)
VALUES 
    ('Gadget', 'GADGET', 'Smartphones, Tablets, and Laptops'),
    ('Wearable Accessories', 'WEARABLE', 'Smartwatches, TWS Earbuds, and Fitness Trackers'),
    ('Electronics', 'ELECTRONICS', 'Cameras, Gaming Consoles, and Smart TVs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.sc_global_settings (key, value)
VALUES 
    ('kyc_global_enabled', '{"enabled": false}'::jsonb),
    ('claim_sla_days', '{"sla_days": 3}'::jsonb),
    ('deductible_rate', '{"rate_pct": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;
