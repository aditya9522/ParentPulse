-- Voice capture is a distinct privacy choice from use of the AI assistant.
-- Keep consent evidence append-only while expanding the allowed event types.
ALTER TABLE public.consent_events
    DROP CONSTRAINT IF EXISTS consent_events_consent_type_check;

ALTER TABLE public.consent_events
    ADD CONSTRAINT consent_events_consent_type_check CHECK (
        consent_type IN (
            'location_history',
            'sos_location_sharing',
            'ai_assistant',
            'voice_input'
        )
    );
