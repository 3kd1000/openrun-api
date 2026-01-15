-- schedule 테이블에 pinned 필드 추가 (공지성 고정 일정)
ALTER TABLE schedule
    ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN schedule.pinned IS '클럽 공지성 고정 일정 여부 (true면 pinned)';

