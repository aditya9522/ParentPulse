-- Auditable consent, deletion tombstones, and deletion-safe policies.

CREATE TABLE IF NOT EXISTS consent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(60) NOT NULL CHECK (
        consent_type IN ('location_history', 'sos_location_sharing', 'ai_assistant')
    ),
    granted BOOLEAN NOT NULL,
    policy_version VARCHAR(30) NOT NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'mobile_settings',
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consent_events_user_type_time
    ON consent_events(user_id, consent_type, occurred_at DESC);

CREATE TABLE IF NOT EXISTS deleted_identities (
    id UUID PRIMARY KEY,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    auth_cleanup_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (auth_cleanup_status IN ('pending', 'completed')),
    cleanup_context JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_events_select_own ON consent_events;
CREATE POLICY consent_events_select_own ON consent_events
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS consent_events_insert_own ON consent_events;
CREATE POLICY consent_events_insert_own ON consent_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Consent evidence is append-only for authenticated clients. The backend service role
-- can perform privacy erasure through the user cascade.
REVOKE UPDATE, DELETE ON consent_events FROM authenticated;
REVOKE ALL ON deleted_identities FROM authenticated, anon;
GRANT SELECT, INSERT ON consent_events TO authenticated;
GRANT ALL ON consent_events, deleted_identities TO service_role;

COMMENT ON TABLE consent_events IS
    'Append-only evidence of versioned user privacy choices.';
COMMENT ON TABLE deleted_identities IS
    'Minimal non-PII tombstones preventing deleted Auth identities from being recreated.';
