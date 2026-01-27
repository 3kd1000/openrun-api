-- schedule_participant: 외부 승인 게스트를 구분하기 위한 플래그
ALTER TABLE schedule_participant
    ADD COLUMN as_guest BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_schedule_participant_schedule_user
    ON schedule_participant (schedule_id, user_id);

