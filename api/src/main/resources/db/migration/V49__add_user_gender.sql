-- V49: users 테이블에 gender 컬럼 추가
-- 작성일: 2026-01-18
-- 목적: 사용자 성별 정보 추가 (MALE, FEMALE, PRIVATE)

-- 1. gender 컬럼 추가 (기본값 PRIVATE)
ALTER TABLE users ADD COLUMN gender VARCHAR(10) NOT NULL DEFAULT 'PRIVATE';

-- 2. 컬럼 코멘트 추가
COMMENT ON COLUMN users.gender IS '성별 (MALE, FEMALE, PRIVATE)';

-- 3. 기존 데이터는 모두 PRIVATE로 유지 (기본값 적용됨)
-- dev/prd 환경에서 필요 시 수동으로 MALE로 변경 예정
