-- 사용자 연락처 정보 및 공개범위 컬럼 추가
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(255),
ADD COLUMN phone_visibility VARCHAR(20) DEFAULT 'PRIVATE',
ADD COLUMN email_visibility VARCHAR(20) DEFAULT 'CLUB_ONLY';

-- 공개범위 제약조건 추가
ALTER TABLE users
ADD CONSTRAINT check_phone_visibility CHECK (phone_visibility IN ('PRIVATE', 'CLUB_ONLY', 'PUBLIC')),
ADD CONSTRAINT check_email_visibility CHECK (email_visibility IN ('PRIVATE', 'CLUB_ONLY', 'PUBLIC'));

-- 컬럼 코멘트 추가
COMMENT ON COLUMN users.phone_number IS '사용자 연락처 (암호화 저장)';
COMMENT ON COLUMN users.phone_visibility IS '연락처 공개범위: PRIVATE(비공개), CLUB_ONLY(클럽원만), PUBLIC(전체공개)';
COMMENT ON COLUMN users.email_visibility IS '이메일 공개범위: PRIVATE(비공개), CLUB_ONLY(클럽원만), PUBLIC(전체공개)';
