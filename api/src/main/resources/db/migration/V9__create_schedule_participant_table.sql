-- ===============================
-- Schedule Participant Table
-- ===============================
CREATE TABLE schedule_participant (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    position INT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_participant_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_schedule_participant_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- 한 일정에 한 사용자는 한 번만 신청 가능 (취소 후 재신청 가능하도록 status가 CANCELLED가 아닌 경우만)
    CONSTRAINT uk_schedule_user_active
        UNIQUE (schedule_id, user_id)
);

-- 조회 성능 최적화를 위한 인덱스
CREATE INDEX idx_schedule_participant_schedule_id ON schedule_participant(schedule_id);
CREATE INDEX idx_schedule_participant_user_id ON schedule_participant(user_id);
CREATE INDEX idx_schedule_participant_status ON schedule_participant(status);
