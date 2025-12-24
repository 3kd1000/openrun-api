-- V21: users 테이블의 uid 컬럼을 nullable로 변경
-- 목적: OAuth 통합 계정 구조에서 uid는 UserOAuthProvider에 저장되므로 nullable 허용
-- 작성일: 2024-12-24

-- uid 컬럼의 NOT NULL 제약조건 제거
ALTER TABLE users ALTER COLUMN uid DROP NOT NULL;

-- 주석 업데이트
COMMENT ON COLUMN users.uid IS 'Firebase UID (Deprecated - UserOAuthProvider 테이블 사용 권장, 하위 호환성 유지)';
COMMENT ON COLUMN users.social_id IS '소셜 로그인 제공자별 고유 ID (Deprecated - UserOAuthProvider 테이블 사용 권장, 하위 호환성 유지)';
