-- 일정별 대진표 테이블 (일정당 1개만 존재)
CREATE TABLE schedule_draw (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL UNIQUE,
    draw_type VARCHAR(10) NOT NULL CHECK (draw_type IN ('AA', 'AB', 'SEED')),
    is_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_draw_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_schedule_draw_schedule_id ON schedule_draw(schedule_id);
CREATE INDEX idx_schedule_draw_is_valid ON schedule_draw(is_valid);

-- 코멘트 추가
COMMENT ON TABLE schedule_draw IS '일정별 대진표 (일정당 1개)';
COMMENT ON COLUMN schedule_draw.id IS '대진표 ID (PK)';
COMMENT ON COLUMN schedule_draw.schedule_id IS '일정 ID (FK, UNIQUE)';
COMMENT ON COLUMN schedule_draw.draw_type IS '대진 타입 (AA/AB/SEED)';
COMMENT ON COLUMN schedule_draw.is_valid IS '유효성 (참가자 변경 시 false)';
COMMENT ON COLUMN schedule_draw.created_at IS '생성 시각';
COMMENT ON COLUMN schedule_draw.updated_at IS '수정 시각';
