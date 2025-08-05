CREATE TABLE draw_statistics (
    id BIGSERIAL PRIMARY KEY,
    draw_type VARCHAR(255) NOT NULL UNIQUE,
    generation_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE draw_statistics IS '대진 생성 통계 테이블';
COMMENT ON COLUMN draw_statistics.id IS '통계 ID';
COMMENT ON COLUMN draw_statistics.draw_type IS '대진 종류';
COMMENT ON COLUMN draw_statistics.generation_count IS '생성 횟수';
COMMENT ON COLUMN draw_statistics.created_at IS '생성 시각';
COMMENT ON COLUMN draw_statistics.updated_at IS '수정 시각';
