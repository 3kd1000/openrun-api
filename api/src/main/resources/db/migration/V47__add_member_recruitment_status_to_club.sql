ALTER TABLE club
    ADD COLUMN member_recruitment_status VARCHAR(20) NOT NULL DEFAULT 'OPEN';

-- 기존 데이터 명시적 세팅 (DB별 plan 안정화 목적)
UPDATE club
SET member_recruitment_status = 'OPEN'
WHERE member_recruitment_status IS NULL;

