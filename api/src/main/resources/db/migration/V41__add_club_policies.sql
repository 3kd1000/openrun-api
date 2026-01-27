-- club 테이블에 운영 정책 컬럼 추가
-- - join_policy: 가입 승인 방식 (APPROVAL / AUTO)
-- - interclub_recruitment_status: 교류전 모집 상태 (CLOSED / OPEN)

ALTER TABLE club
    ADD COLUMN join_policy VARCHAR(20) NOT NULL DEFAULT 'APPROVAL';

ALTER TABLE club
    ADD COLUMN interclub_recruitment_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED';

COMMENT ON COLUMN club.join_policy IS '가입 승인 방식 (APPROVAL=승인 필요, AUTO=자동 승인)';
COMMENT ON COLUMN club.interclub_recruitment_status IS '교류전 모집 상태 (CLOSED/OPEN)';

