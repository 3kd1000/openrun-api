-- schedule 테이블에 게스트 모집/교류전 모집 플래그 및 안내문 필드 추가

ALTER TABLE schedule
    ADD COLUMN guest_recruit_open BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE schedule
    ADD COLUMN guest_recruit_note TEXT;

ALTER TABLE schedule
    ADD COLUMN interclub_recruit_open BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE schedule
    ADD COLUMN interclub_recruit_note TEXT;

COMMENT ON COLUMN schedule.guest_recruit_open IS '게스트 모집 오픈 여부';
COMMENT ON COLUMN schedule.guest_recruit_note IS '게스트 모집 안내문(선택)';
COMMENT ON COLUMN schedule.interclub_recruit_open IS '교류전 모집 오픈 여부';
COMMENT ON COLUMN schedule.interclub_recruit_note IS '교류전 모집 안내문(선택)';

