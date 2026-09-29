-- Defense-in-depth authorization for every family-health table.
-- API authorization remains mandatory; these policies also protect direct
-- Supabase access with an authenticated user token.

CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = target_family_id AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_family_owner(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.families
        WHERE id = target_family_id AND created_by = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_parent(target_parent_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.parent_profiles p
        WHERE p.id = target_parent_id AND public.is_family_member(p.family_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_family_capability(target_family_id UUID, capability TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = target_family_id
          AND fm.user_id = auth.uid()
          AND CASE capability
              WHEN 'medicines' THEN fm.can_manage_medicines
              WHEN 'appointments' THEN fm.can_manage_appointments
              WHEN 'documents' THEN fm.can_upload_documents
              WHEN 'sharing' THEN fm.can_share_doctor_brief
              WHEN 'location' THEN fm.can_view_location_history
              ELSE FALSE
          END
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_family_medicines(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_family_capability(target_family_id, 'medicines'); $$;

ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can upload documents" ON documents;
DROP POLICY IF EXISTS "Authorized members can manage documents" ON documents;
DROP POLICY IF EXISTS "Authorized members insert documents" ON documents;
DROP POLICY IF EXISTS "Authorized members update documents" ON documents;
DROP POLICY IF EXISTS "Authorized members delete documents" ON documents;
CREATE POLICY "Authorized members insert documents" ON documents FOR INSERT
WITH CHECK (public.has_family_capability(family_id, 'documents') AND uploaded_by = auth.uid());
CREATE POLICY "Authorized members update documents" ON documents FOR UPDATE
USING (public.has_family_capability(family_id, 'documents'))
WITH CHECK (public.has_family_capability(family_id, 'documents'));
CREATE POLICY "Authorized members delete documents" ON documents FOR DELETE
USING (public.has_family_capability(family_id, 'documents'));

DROP POLICY IF EXISTS "Members can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Authorized members manage appointments" ON appointments;
DROP POLICY IF EXISTS "Authorized members insert appointments" ON appointments;
DROP POLICY IF EXISTS "Authorized members update appointments" ON appointments;
DROP POLICY IF EXISTS "Authorized members delete appointments" ON appointments;
CREATE POLICY "Authorized members insert appointments" ON appointments FOR INSERT
WITH CHECK (public.has_family_capability(family_id, 'appointments'));
CREATE POLICY "Authorized members update appointments" ON appointments FOR UPDATE
USING (public.has_family_capability(family_id, 'appointments'))
WITH CHECK (public.has_family_capability(family_id, 'appointments'));
CREATE POLICY "Authorized members delete appointments" ON appointments FOR DELETE
USING (public.has_family_capability(family_id, 'appointments'));

DROP POLICY IF EXISTS "Members can view timeline" ON timeline_events;
DROP POLICY IF EXISTS "Family members manage timeline" ON timeline_events;
CREATE POLICY "Family members manage timeline" ON timeline_events FOR ALL
USING (public.is_family_member(family_id))
WITH CHECK (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Members can view location visits" ON location_visits;
DROP POLICY IF EXISTS "Authorized members manage location visits" ON location_visits;
DROP POLICY IF EXISTS "Authorized members view location visits" ON location_visits;
DROP POLICY IF EXISTS "Authorized members insert location visits" ON location_visits;
DROP POLICY IF EXISTS "Authorized members update location visits" ON location_visits;
DROP POLICY IF EXISTS "Authorized members delete location visits" ON location_visits;
CREATE POLICY "Authorized members view location visits" ON location_visits FOR SELECT
USING (public.has_family_capability(family_id, 'location'));
CREATE POLICY "Authorized members insert location visits" ON location_visits FOR INSERT
WITH CHECK (public.has_family_capability(family_id, 'location') AND confirmed_by = auth.uid());
CREATE POLICY "Authorized members update location visits" ON location_visits FOR UPDATE
USING (public.has_family_capability(family_id, 'location'))
WITH CHECK (public.has_family_capability(family_id, 'location'));
CREATE POLICY "Authorized members delete location visits" ON location_visits FOR DELETE
USING (public.has_family_capability(family_id, 'location'));

DROP POLICY IF EXISTS "Authorized members manage saved places" ON saved_places;
CREATE POLICY "Authorized members manage saved places" ON saved_places FOR ALL
USING (public.has_family_capability(family_id, 'location'))
WITH CHECK (public.has_family_capability(family_id, 'location'));

DROP POLICY IF EXISTS "Family members manage tasks" ON tasks;
DROP POLICY IF EXISTS "Family members view tasks" ON tasks;
DROP POLICY IF EXISTS "Family members insert tasks" ON tasks;
DROP POLICY IF EXISTS "Family members update tasks" ON tasks;
DROP POLICY IF EXISTS "Family members delete tasks" ON tasks;
CREATE POLICY "Family members view tasks" ON tasks FOR SELECT
USING (public.is_family_member(family_id));
CREATE POLICY "Family members insert tasks" ON tasks FOR INSERT
WITH CHECK (public.is_family_member(family_id) AND created_by = auth.uid());
CREATE POLICY "Family members update tasks" ON tasks FOR UPDATE
USING (public.is_family_member(family_id)) WITH CHECK (public.is_family_member(family_id));
CREATE POLICY "Family members delete tasks" ON tasks FOR DELETE
USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members manage measurements" ON measurements;
DROP POLICY IF EXISTS "Family members view measurements" ON measurements;
DROP POLICY IF EXISTS "Family members insert measurements" ON measurements;
CREATE POLICY "Family members view measurements" ON measurements FOR SELECT
USING (public.can_access_parent(parent_id));
CREATE POLICY "Family members insert measurements" ON measurements FOR INSERT
WITH CHECK (public.can_access_parent(parent_id) AND recorded_by = auth.uid());

DROP POLICY IF EXISTS "Authorized members manage medicine dose logs" ON medicine_dose_logs;
DROP POLICY IF EXISTS "Authorized members view medicine dose logs" ON medicine_dose_logs;
DROP POLICY IF EXISTS "Authorized members insert medicine dose logs" ON medicine_dose_logs;
CREATE POLICY "Authorized members view medicine dose logs" ON medicine_dose_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM medicines m
    WHERE m.id = medicine_id AND public.has_family_capability(m.family_id, 'medicines')
));
CREATE POLICY "Authorized members insert medicine dose logs" ON medicine_dose_logs FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM medicines m
    WHERE m.id = medicine_id AND public.has_family_capability(m.family_id, 'medicines')
) AND recorded_by = auth.uid());

DROP POLICY IF EXISTS "Family members view caregivers" ON caregivers;
CREATE POLICY "Family members view caregivers" ON caregivers FOR SELECT
USING (public.can_access_parent(parent_id));
DROP POLICY IF EXISTS "Family owners manage caregivers" ON caregivers;
CREATE POLICY "Family owners manage caregivers" ON caregivers FOR ALL
USING (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.is_family_owner(p.family_id)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.is_family_owner(p.family_id)
));

DROP POLICY IF EXISTS "Authorized members manage doctor shares" ON shares;
DROP POLICY IF EXISTS "Authorized members view doctor shares" ON shares;
DROP POLICY IF EXISTS "Authorized members insert doctor shares" ON shares;
DROP POLICY IF EXISTS "Authorized members update doctor shares" ON shares;
DROP POLICY IF EXISTS "Authorized members delete doctor shares" ON shares;
CREATE POLICY "Authorized members view doctor shares" ON shares FOR SELECT
USING (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.has_family_capability(p.family_id, 'sharing')
));
CREATE POLICY "Authorized members insert doctor shares" ON shares FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.has_family_capability(p.family_id, 'sharing')
) AND created_by = auth.uid());
CREATE POLICY "Authorized members update doctor shares" ON shares FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.has_family_capability(p.family_id, 'sharing')
)) WITH CHECK (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.has_family_capability(p.family_id, 'sharing')
));
CREATE POLICY "Authorized members delete doctor shares" ON shares FOR DELETE
USING (EXISTS (
    SELECT 1 FROM parent_profiles p
    WHERE p.id = parent_id AND public.has_family_capability(p.family_id, 'sharing')
));

DROP POLICY IF EXISTS "Owners manage family memberships" ON family_members;
CREATE POLICY "Owners manage family memberships" ON family_members FOR ALL
USING (public.is_family_owner(family_id))
WITH CHECK (public.is_family_owner(family_id));

DROP POLICY IF EXISTS "Family owners delete parent profiles" ON parent_profiles;
CREATE POLICY "Family owners delete parent profiles" ON parent_profiles FOR DELETE
USING (public.is_family_owner(family_id));

DROP POLICY IF EXISTS "Users view own audit events" ON audit_logs;
CREATE POLICY "Users view own audit events" ON audit_logs FOR SELECT
USING (user_id = auth.uid());
