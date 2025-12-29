-- V26: Add all existing users to default club as ACTIVE members

-- Insert all existing users (including guests) into club_member table
-- Only insert if they're not already members (to avoid duplicate key errors)
INSERT INTO club_member (club_id, user_id, status, joined_at)
SELECT
    1 AS club_id,  -- Default club ID (오픈런)
    u.id AS user_id,
    'ACTIVE' AS status,
    NOW() AS joined_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1
    FROM club_member cm
    WHERE cm.club_id = 1 AND cm.user_id = u.id
);

-- Note:
-- - All users (both regular and guests) are automatically added to the default club
-- - Status is set to ACTIVE (no approval needed)
-- - This ensures existing users can be searched in the reservation owner search
