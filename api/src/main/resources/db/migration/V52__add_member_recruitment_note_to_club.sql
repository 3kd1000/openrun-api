-- club 테이블에 신규회원 모집글(안내문) 필드 추가

ALTER TABLE club
    ADD COLUMN member_recruitment_note TEXT;

COMMENT ON COLUMN club.member_recruitment_note IS '신규회원 모집 안내문(선택)';
