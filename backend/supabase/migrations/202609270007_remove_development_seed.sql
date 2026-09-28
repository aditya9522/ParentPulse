-- Remove only the fixed development identities previously shipped in seed.sql.
-- Family deletion cascades through its demo parent and associated care records.
DELETE FROM families WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

DELETE FROM users
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
)
AND email IN (
    'priya.sharma@example.com',
    'ramesh.sharma@example.com',
    'sunita.sharma@example.com'
);
