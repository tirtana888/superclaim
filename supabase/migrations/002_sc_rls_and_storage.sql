-- ==========================================================
-- SUPERCLAIM PLATFORM RLS & STORAGE (v2.0)
-- Row Level Security (RLS) policies for sc_* tables
-- ==========================================================

-- Helper function to check if current user is ADMIN
CREATE OR REPLACE FUNCTION public.sc_is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.sc_profiles
        WHERE id = user_id AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get dealer_id for current user
CREATE OR REPLACE FUNCTION public.sc_get_current_dealer_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
    v_dealer_id UUID;
BEGIN
    SELECT id INTO v_dealer_id
    FROM public.sc_dealers
    WHERE profile_id = user_id;
    RETURN v_dealer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all sc_* tables
ALTER TABLE public.sc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_claim_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sc_global_settings ENABLE ROW LEVEL SECURITY;

-- 1. sc_profiles Policies
DROP POLICY IF EXISTS "sc_profiles_admin_all" ON public.sc_profiles;
CREATE POLICY "sc_profiles_admin_all" ON public.sc_profiles
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_profiles_user_self" ON public.sc_profiles;
CREATE POLICY "sc_profiles_user_self" ON public.sc_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "sc_profiles_update_self" ON public.sc_profiles;
CREATE POLICY "sc_profiles_update_self" ON public.sc_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- 2. sc_dealers Policies
DROP POLICY IF EXISTS "sc_dealers_admin_all" ON public.sc_dealers;
CREATE POLICY "sc_dealers_admin_all" ON public.sc_dealers
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_dealers_self_select" ON public.sc_dealers;
CREATE POLICY "sc_dealers_self_select" ON public.sc_dealers
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

-- 3. Catalog (Categories, Products, Plans) Policies
DROP POLICY IF EXISTS "sc_categories_read_all" ON public.sc_product_categories;
CREATE POLICY "sc_categories_read_all" ON public.sc_product_categories
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "sc_products_read_all" ON public.sc_products;
CREATE POLICY "sc_products_read_all" ON public.sc_products
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "sc_plans_read_all" ON public.sc_plans;
CREATE POLICY "sc_plans_read_all" ON public.sc_plans
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "sc_catalog_admin_all" ON public.sc_plans;
CREATE POLICY "sc_catalog_admin_all" ON public.sc_plans
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

-- 4. sc_policies Policies
DROP POLICY IF EXISTS "sc_policies_admin_all" ON public.sc_policies;
CREATE POLICY "sc_policies_admin_all" ON public.sc_policies
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_policies_dealer_select" ON public.sc_policies;
CREATE POLICY "sc_policies_dealer_select" ON public.sc_policies
    FOR SELECT TO authenticated
    USING (dealer_id = public.sc_get_current_dealer_id(auth.uid()));

DROP POLICY IF EXISTS "sc_policies_dealer_insert" ON public.sc_policies;
CREATE POLICY "sc_policies_dealer_insert" ON public.sc_policies
    FOR INSERT TO authenticated
    WITH CHECK (dealer_id = public.sc_get_current_dealer_id(auth.uid()) OR public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_policies_user_select" ON public.sc_policies;
CREATE POLICY "sc_policies_user_select" ON public.sc_policies
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 5. sc_claims Policies
DROP POLICY IF EXISTS "sc_claims_admin_all" ON public.sc_claims;
CREATE POLICY "sc_claims_admin_all" ON public.sc_claims
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_claims_user_select" ON public.sc_claims;
CREATE POLICY "sc_claims_user_select" ON public.sc_claims
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sc_claims_user_insert" ON public.sc_claims;
CREATE POLICY "sc_claims_user_insert" ON public.sc_claims
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 6. sc_claim_documents Policies
DROP POLICY IF EXISTS "sc_claim_docs_admin_all" ON public.sc_claim_documents;
CREATE POLICY "sc_claim_docs_admin_all" ON public.sc_claim_documents
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_claim_docs_user_select" ON public.sc_claim_documents;
CREATE POLICY "sc_claim_docs_user_select" ON public.sc_claim_documents
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sc_claims
        WHERE sc_claims.id = sc_claim_documents.claim_id AND sc_claims.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "sc_claim_docs_user_insert" ON public.sc_claim_documents;
CREATE POLICY "sc_claim_docs_user_insert" ON public.sc_claim_documents
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sc_claims
        WHERE sc_claims.id = sc_claim_documents.claim_id AND sc_claims.user_id = auth.uid()
    ));

-- 7. sc_claim_milestones Policies
DROP POLICY IF EXISTS "sc_milestones_admin_all" ON public.sc_claim_milestones;
CREATE POLICY "sc_milestones_admin_all" ON public.sc_claim_milestones
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_milestones_user_select" ON public.sc_claim_milestones;
CREATE POLICY "sc_milestones_user_select" ON public.sc_claim_milestones
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sc_claims
        WHERE sc_claims.id = sc_claim_milestones.claim_id AND sc_claims.user_id = auth.uid()
    ));

-- 8. sc_commissions Policies
DROP POLICY IF EXISTS "sc_commissions_admin_all" ON public.sc_commissions;
CREATE POLICY "sc_commissions_admin_all" ON public.sc_commissions
    FOR ALL TO authenticated
    USING (public.sc_is_admin(auth.uid()));

DROP POLICY IF EXISTS "sc_commissions_dealer_select" ON public.sc_commissions;
CREATE POLICY "sc_commissions_dealer_select" ON public.sc_commissions
    FOR SELECT TO authenticated
    USING (dealer_id = public.sc_get_current_dealer_id(auth.uid()));

-- 9. Storage Buckets (sc-policy-certificates, sc-claim-documents, sc-kyc-documents, sc-report-exports)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('sc-policy-certificates', 'sc-policy-certificates', true),
    ('sc-claim-documents', 'sc-claim-documents', false),
    ('sc-kyc-documents', 'sc-kyc-documents', false),
    ('sc-report-exports', 'sc-report-exports', false)
ON CONFLICT (id) DO NOTHING;
