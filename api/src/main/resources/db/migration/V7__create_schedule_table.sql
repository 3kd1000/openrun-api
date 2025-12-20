CREATE TABLE schedule (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    court_name VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_capacity INT NOT NULL,
    current_participants INT NOT NULL DEFAULT 0,
    cost DECIMAL(10, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedule_club_id ON schedule(club_id);
CREATE INDEX idx_schedule_scheduled_at ON schedule(scheduled_at);

COMMENT ON TABLE schedule IS '코트 일정 정보를 저장하는 테이블';
COMMENT ON COLUMN schedule.id IS '일정 ID';
COMMENT ON COLUMN schedule.club_id IS '클럽 ID';
COMMENT ON COLUMN schedule.court_name IS '코트명 (예: 골드 3번 코트)';
COMMENT ON COLUMN schedule.scheduled_at IS '일정 시간';
COMMENT ON COLUMN schedule.max_capacity IS '최대 정원';
COMMENT ON COLUMN schedule.current_participants IS '현재 참가자 수 (캐싱용)';
COMMENT ON COLUMN schedule.cost IS '비용 (선택)';
COMMENT ON COLUMN schedule.description IS '일정 설명';
COMMENT ON COLUMN schedule.created_at IS '생성 시각';
COMMENT ON COLUMN schedule.updated_at IS '수정 시각';
