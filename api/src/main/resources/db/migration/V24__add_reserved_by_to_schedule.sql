-- schedule 테이블에 예약자 필드 추가
ALTER TABLE schedule ADD COLUMN reserved_by_user_id BIGINT;

-- users 테이블 FK 추가
ALTER TABLE schedule
    ADD CONSTRAINT fk_schedule_reserved_by_user
    FOREIGN KEY (reserved_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

-- 인덱스 추가 (예약자별 일정 조회 성능 향상)
CREATE INDEX idx_schedule_reserved_by_user_id ON schedule(reserved_by_user_id);

COMMENT ON COLUMN schedule.reserved_by_user_id IS '일정을 예약한 사용자 ID (NULL 가능)';
