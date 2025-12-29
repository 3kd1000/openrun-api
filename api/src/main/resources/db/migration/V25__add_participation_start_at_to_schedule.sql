-- schedule 테이블에 참가신청 시작시간 필드 추가
ALTER TABLE schedule ADD COLUMN participation_start_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN schedule.participation_start_at IS '참가신청 시작시간 (NULL이면 즉시 신청 가능)';
