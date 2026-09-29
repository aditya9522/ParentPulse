-- Remove only the fixed development identities previously shipped in seed.sql.
-- Delete every family owned by those exact id/email pairs first: production
-- databases may contain an older seed family id, and families.created_by uses
-- ON DELETE RESTRICT. Family deletion cascades through demo care records.
DELETE FROM families
WHERE created_by IN (
    SELECT id
    FROM users
    WHERE (id, email) IN (
        ('11111111-1111-1111-1111-111111111111'::uuid, 'priya.sharma@example.com'),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'ramesh.sharma@example.com'),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'sunita.sharma@example.com')
    )
);

DELETE FROM users
WHERE (id, email) IN (
    ('11111111-1111-1111-1111-111111111111'::uuid, 'priya.sharma@example.com'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'ramesh.sharma@example.com'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'sunita.sharma@example.com')
);
