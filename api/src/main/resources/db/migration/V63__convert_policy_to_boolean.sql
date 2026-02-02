-- =====================================================
-- 정책 필드를 VARCHAR에서 Boolean으로 변환
-- 모든 정책 필드 Boolean 통일
-- =====================================================

-- 1. 새로운 Boolean 컬럼 추가
ALTER TABLE club_policy ADD COLUMN auto_join_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE club_policy ADD COLUMN interclub_recruitment_open BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE club_policy ADD COLUMN member_recruitment_open BOOLEAN NOT NULL DEFAULT true;

-- 2. 기존 VARCHAR 값을 Boolean으로 변환
UPDATE club_policy SET
    auto_join_enabled = (join_policy = 'AUTO'),
    interclub_recruitment_open = (interclub_recruitment_status = 'OPEN'),
    member_recruitment_open = (member_recruitment_status = 'OPEN');

-- 3. 기존 VARCHAR 컬럼 삭제
ALTER TABLE club_policy DROP COLUMN join_policy;
ALTER TABLE club_policy DROP COLUMN interclub_recruitment_status;
ALTER TABLE club_policy DROP COLUMN member_recruitment_status;
