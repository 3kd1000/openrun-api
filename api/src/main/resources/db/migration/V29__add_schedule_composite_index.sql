-- Schedule 테이블에 복합 인덱스 추가 (성능 최적화)

-- 1. 복합 인덱스 추가 (club별 일정 조회 최적화)
-- club_id로 필터링하고 scheduled_at으로 정렬하는 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_schedule_club_id_scheduled_at
ON schedule(club_id, scheduled_at);

-- 2. 코멘트 추가
COMMENT ON INDEX idx_schedule_club_id_scheduled_at IS '클럽별 일정 조회 최적화를 위한 복합 인덱스 (캘린더 뷰, 리스트 뷰 성능 향상)';
