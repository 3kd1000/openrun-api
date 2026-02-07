-- V75: 사용자 활동 시간 추적을 위한 last_active_at 컬럼 추가
-- 토큰 갱신/앱 재활성화 시 업데이트되어 DAU 집계에 사용됨

ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP;

-- 기존 사용자는 last_login_at 값으로 초기화
UPDATE users SET last_active_at = last_login_at WHERE last_login_at IS NOT NULL;

-- 인덱스 추가 (DAU/WAU/MAU 집계 성능 향상)
CREATE INDEX idx_users_last_active_at ON users(last_active_at);
