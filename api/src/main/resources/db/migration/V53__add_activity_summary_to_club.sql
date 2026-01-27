-- Club 테이블에 활동 요약 필드 추가 (Daily Cron에서 계산하여 저장)
ALTER TABLE club ADD COLUMN activity_summary VARCHAR(200);

COMMENT ON COLUMN club.activity_summary IS '클럽 활동 요약 (예: 총 25개 일정, 158명 참가) - Daily Cron에서 계산';
