CREATE TABLE IF NOT EXISTS healthcare_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL CHECK (category IN ('doctor', 'medicine', 'lab', 'hospital', 'insurance', 'home_care', 'other')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    expense_date DATE NOT NULL,
    provider_name VARCHAR(255),
    receipt_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    notes TEXT,
    is_reimbursed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(120) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    coverage_amount NUMERIC(14, 2) NOT NULL CHECK (coverage_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    expiry_date DATE NOT NULL,
    tpa_cashless_helpline VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_insurance_family_policy UNIQUE (family_id, policy_number)
);

CREATE INDEX IF NOT EXISTS idx_expenses_parent_date ON healthcare_expenses(parent_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_parent_expiry ON insurance_policies(parent_id, expiry_date);

ALTER TABLE healthcare_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members view expenses" ON healthcare_expenses FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "Family members create expenses" ON healthcare_expenses FOR INSERT WITH CHECK (public.is_family_member(family_id));
CREATE POLICY "Family members update expenses" ON healthcare_expenses FOR UPDATE USING (public.is_family_member(family_id)) WITH CHECK (public.is_family_member(family_id));
CREATE POLICY "Family members delete expenses" ON healthcare_expenses FOR DELETE USING (public.is_family_member(family_id));
CREATE POLICY "Family members view insurance" ON insurance_policies FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "Family members create insurance" ON insurance_policies FOR INSERT WITH CHECK (public.is_family_member(family_id));
CREATE POLICY "Family members update insurance" ON insurance_policies FOR UPDATE USING (public.is_family_member(family_id)) WITH CHECK (public.is_family_member(family_id));
CREATE POLICY "Family members delete insurance" ON insurance_policies FOR DELETE USING (public.is_family_member(family_id));
