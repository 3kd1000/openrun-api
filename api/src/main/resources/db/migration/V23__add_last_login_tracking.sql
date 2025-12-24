-- V23: Add last login tracking columns
-- 사용자의 마지막 로그인 정보를 추적 (문의 대응용)

-- Step 1: Add last_login_provider column
ALTER TABLE users ADD COLUMN last_login_provider VARCHAR(20);

-- Step 2: Add last_login_at column
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;

-- Note:
-- - last_login_provider: 마지막 로그인 수단 (GOOGLE, KAKAO, NAVER)
-- - last_login_at: 마지막 로그인 시각
-- - 히스토리 관리가 아닌 최신 기록만 유지
