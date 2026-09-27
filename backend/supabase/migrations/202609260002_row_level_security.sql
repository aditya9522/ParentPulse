-- 202609260002_row_level_security.sql
-- Row Level Security (RLS) Policies for ParentPulse

-- Helper functions for authorization checks
CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = target_family_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_family_medicines(target_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = target_family_id
          AND user_id = auth.uid()
          AND can_manage_medicines = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Families policies
CREATE POLICY "Family members can view family"
    ON families FOR SELECT
    USING (public.is_family_member(id) OR created_by = auth.uid());

CREATE POLICY "Users can create family"
    ON families FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Family Members policies
CREATE POLICY "Members can view co-members"
    ON family_members FOR SELECT
    USING (public.is_family_member(family_id));

-- Parent Profiles policies
CREATE POLICY "Members can view parent profiles"
    ON parent_profiles FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Members can insert parent profiles"
    ON parent_profiles FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Members can update parent profiles"
    ON parent_profiles FOR UPDATE
    USING (public.is_family_member(family_id));

-- Documents policies
CREATE POLICY "Members can view documents"
    ON documents FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Members can upload documents"
    ON documents FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

-- Medicines policies
CREATE POLICY "Members can view medicines"
    ON medicines FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Authorized members can manage medicines"
    ON medicines FOR ALL
    USING (public.can_manage_family_medicines(family_id));

-- Appointments policies
CREATE POLICY "Members can view appointments"
    ON appointments FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Members can manage appointments"
    ON appointments FOR ALL
    USING (public.is_family_member(family_id));

-- Timeline Events policies
CREATE POLICY "Members can view timeline"
    ON timeline_events FOR SELECT
    USING (public.is_family_member(family_id));

-- Location visits policies
CREATE POLICY "Members can view location visits"
    ON location_visits FOR SELECT
    USING (public.is_family_member(family_id));

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);
