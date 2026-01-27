-- ContactVisibility를 PRIVATE/PUBLIC 2개로 단순화
-- CLUB_ONLY를 PUBLIC으로 통합하고, 기본값을 모두 PUBLIC으로 변경

-- 1. 기존 데이터의 email_visibility를 CLUB_ONLY → PUBLIC으로 변경
UPDATE users
SET email_visibility = 'PUBLIC'
WHERE email_visibility = 'CLUB_ONLY';

-- 2. 기존 데이터의 phone_visibility를 CLUB_ONLY → PUBLIC으로 변경
UPDATE users
SET phone_visibility = 'PUBLIC'
WHERE phone_visibility = 'CLUB_ONLY';

-- 3. 기존 데이터의 phone_visibility가 PRIVATE인 경우도 PUBLIC으로 변경
--    (사용자가 요청: 어차피 클럽에만 보이므로 모두 PUBLIC으로)
UPDATE users
SET phone_visibility = 'PUBLIC'
WHERE phone_visibility = 'PRIVATE' OR phone_visibility IS NULL;

-- 4. 기존 CHECK constraint 제거
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_phone_visibility,
DROP CONSTRAINT IF EXISTS check_email_visibility;

-- 5. 새로운 CHECK constraint 추가 (PRIVATE/PUBLIC만 허용)
ALTER TABLE users
ADD CONSTRAINT check_phone_visibility CHECK (phone_visibility IN ('PRIVATE', 'PUBLIC')),
ADD CONSTRAINT check_email_visibility CHECK (email_visibility IN ('PRIVATE', 'PUBLIC'));

-- 6. DEFAULT 값을 PUBLIC으로 변경
ALTER TABLE users
ALTER COLUMN phone_visibility SET DEFAULT 'PUBLIC',
ALTER COLUMN email_visibility SET DEFAULT 'PUBLIC';

-- 7. 컬럼 코멘트 업데이트
COMMENT ON COLUMN users.phone_visibility IS '연락처 공개범위: PRIVATE(비공개), PUBLIC(클럽원 및 게스트 참여 시 공유)';
COMMENT ON COLUMN users.email_visibility IS '이메일 공개범위: PRIVATE(비공개), PUBLIC(클럽원 및 게스트 참여 시 공유)';
