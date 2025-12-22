-- 일정 테이블에 대진 관련 컬럼 추가
ALTER TABLE schedule
    ADD COLUMN draw_type VARCHAR(10) CHECK (draw_type IN ('AA', 'AB', 'SEED')),
    ADD COLUMN is_draw_valid BOOLEAN DEFAULT false,
    ADD COLUMN draw_created_at TIMESTAMP;

-- 인덱스 생성 (대진 유효성 검색 최적화)
CREATE INDEX idx_schedule_is_draw_valid ON schedule(is_draw_valid);

-- 코멘트 추가
COMMENT ON COLUMN schedule.draw_type IS '대진 타입 (AA/AB/SEED, NULL=대진 없음)';
COMMENT ON COLUMN schedule.is_draw_valid IS '대진 유효성 (참가자 변경 시 false, 기본값 false)';
COMMENT ON COLUMN schedule.draw_created_at IS '대진 생성 시각 (NULL=대진 없음)';
