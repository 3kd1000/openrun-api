-- V22: Drop deprecated columns (uid, social_id)
-- OAuth 정보는 이제 user_oauth_providers 테이블에서 관리

-- Step 1: Drop uid column (firebaseUid - deprecated)
ALTER TABLE users DROP COLUMN IF EXISTS uid;

-- Step 2: Drop social_id column (deprecated)
ALTER TABLE users DROP COLUMN IF EXISTS social_id;

-- Note:
-- - OAuth 정보는 user_oauth_providers 테이블에서 관리
-- - email이 유일한 사용자 식별자
-- - 게스트 사용자는 더미 이메일 사용
