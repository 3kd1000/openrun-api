-- Audit Log 테이블: Schedule, ScheduleParticipant, Match 변경 이력 추적

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,              -- 누가
    entity_type VARCHAR(50) NOT NULL,     -- SCHEDULE, SCHEDULE_PARTICIPANT, MATCH
    entity_id BIGINT NOT NULL,            -- 어떤 레코드
    action_type VARCHAR(20) NOT NULL,     -- CREATE, UPDATE, DELETE
    changes JSONB,                         -- {"before": {...}, "after": {...}}
    club_id BIGINT NOT NULL,              -- 클럽 컨텍스트
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_audit_log_club_created ON audit_log(club_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);  -- TTL 배치용
