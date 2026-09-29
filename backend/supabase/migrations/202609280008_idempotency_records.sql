-- Durable duplicate protection for retried mobile mutations.
CREATE TABLE IF NOT EXISTS public.idempotency_records (
    user_id UUID NOT NULL,
    request_key VARCHAR(200) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    state VARCHAR(20) NOT NULL CHECK (state IN ('processing', 'completed')),
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, request_key)
);

CREATE INDEX IF NOT EXISTS ix_idempotency_records_expiry
    ON public.idempotency_records (expires_at);

ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.idempotency_records FROM anon, authenticated;

COMMENT ON TABLE public.idempotency_records IS
    'Short-lived authenticated mutation results used to prevent duplicate care writes.';
