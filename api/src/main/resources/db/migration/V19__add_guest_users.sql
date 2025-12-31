-- V19: Add is_guest column and create guest users

-- Step 1: Add is_guest column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- Step 2: Create 16 guest users (guest1 ~ guest16)
INSERT INTO users (email, name, uid, is_guest, created_at, updated_at)
VALUES
    ('guest1@dummy.openrun.local', '게스트1', 'guest-dummy-001', TRUE, NOW(), NOW()),
    ('guest2@dummy.openrun.local', '게스트2', 'guest-dummy-002', TRUE, NOW(), NOW()),
    ('guest3@dummy.openrun.local', '게스트3', 'guest-dummy-003', TRUE, NOW(), NOW()),
    ('guest4@dummy.openrun.local', '게스트4', 'guest-dummy-004', TRUE, NOW(), NOW()),
    ('guest5@dummy.openrun.local', '게스트5', 'guest-dummy-005', TRUE, NOW(), NOW()),
    ('guest6@dummy.openrun.local', '게스트6', 'guest-dummy-006', TRUE, NOW(), NOW()),
    ('guest7@dummy.openrun.local', '게스트7', 'guest-dummy-007', TRUE, NOW(), NOW()),
    ('guest8@dummy.openrun.local', '게스트8', 'guest-dummy-008', TRUE, NOW(), NOW()),
    ('guest9@dummy.openrun.local', '게스트9', 'guest-dummy-009', TRUE, NOW(), NOW()),
    ('guest10@dummy.openrun.local', '게스트10', 'guest-dummy-010', TRUE, NOW(), NOW()),
    ('guest11@dummy.openrun.local', '게스트11', 'guest-dummy-011', TRUE, NOW(), NOW()),
    ('guest12@dummy.openrun.local', '게스트12', 'guest-dummy-012', TRUE, NOW(), NOW()),
    ('guest13@dummy.openrun.local', '게스트13', 'guest-dummy-013', TRUE, NOW(), NOW()),
    ('guest14@dummy.openrun.local', '게스트14', 'guest-dummy-014', TRUE, NOW(), NOW()),
    ('guest15@dummy.openrun.local', '게스트15', 'guest-dummy-015', TRUE, NOW(), NOW()),
    ('guest16@dummy.openrun.local', '게스트16', 'guest-dummy-016', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Note:
-- - These guest users are shared across all clubs
-- - Maximum draw capacity is 16 players, so 16 guests are sufficient
-- - is_guest flag will be used to exclude guests from scoreboard statistics
