CREATE TABLE IF NOT EXISTS push_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios')),
    device_name VARCHAR(120),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sos_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response VARCHAR(30) NOT NULL DEFAULT 'acknowledged' CHECK (response IN ('acknowledged', 'responding')),
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sos_ack_event_user UNIQUE (sos_event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_devices_user_active ON push_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sos_events_family_status ON sos_events(family_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_ack_event ON sos_acknowledgements(sos_event_id);

ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their push devices" ON push_devices FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family members view SOS events" ON sos_events FOR SELECT
USING (public.is_family_member(family_id));

CREATE POLICY "Family members create SOS events" ON sos_events FOR INSERT
WITH CHECK (public.is_family_member(family_id) AND initiated_by = auth.uid());

CREATE POLICY "Family members update SOS events" ON sos_events FOR UPDATE
USING (public.is_family_member(family_id));

CREATE POLICY "Family members view SOS acknowledgements" ON sos_acknowledgements FOR SELECT
USING (EXISTS (SELECT 1 FROM sos_events e WHERE e.id = sos_event_id AND public.is_family_member(e.family_id)));

CREATE POLICY "Users acknowledge SOS events" ON sos_acknowledgements FOR INSERT
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM sos_events e WHERE e.id = sos_event_id AND public.is_family_member(e.family_id)));

CREATE POLICY "Users update their SOS acknowledgement" ON sos_acknowledgements FOR UPDATE
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
