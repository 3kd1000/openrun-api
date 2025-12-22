-- match 테이블에 club_id 추가 및 구조 변경

-- 1. match 테이블에 컬럼 추가
ALTER TABLE match
ADD COLUMN club_id BIGINT,
ADD COLUMN schedule_id BIGINT,
ADD COLUMN played_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_migrated BOOLEAN NOT NULL DEFAULT false;

-- 2. draw_id를 nullable로 변경 (과거 경기는 draw 없음)
ALTER TABLE match ALTER COLUMN draw_id DROP NOT NULL;

-- 3. 외래키 추가
ALTER TABLE match
ADD CONSTRAINT fk_match_club
FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE;

ALTER TABLE match
ADD CONSTRAINT fk_match_schedule
FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE SET NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_match_club_id ON match(club_id);
CREATE INDEX idx_match_schedule_id ON match(schedule_id);
CREATE INDEX idx_match_played_at ON match(played_at);
CREATE INDEX idx_match_is_migrated ON match(is_migrated);

-- 5. 복합 인덱스 (club별 조회 최적화)
CREATE INDEX idx_match_club_played_at ON match(club_id, played_at DESC);

-- 6. 코멘트 추가
COMMENT ON COLUMN match.club_id IS '클럽 ID (성능 최적화용 직접 참조)';
COMMENT ON COLUMN match.schedule_id IS '일정 ID (nullable - 과거 마이그레이션 데이터는 null)';
COMMENT ON COLUMN match.played_at IS '경기 날짜';
COMMENT ON COLUMN match.is_migrated IS 'CSV 마이그레이션 데이터 여부';
