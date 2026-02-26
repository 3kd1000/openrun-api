-- schedule_type 컬럼 추가 (PUBLIC/CLUB 명시적 구분)
ALTER TABLE schedule ADD COLUMN schedule_type VARCHAR(10);
UPDATE schedule SET schedule_type = CASE WHEN club_id IS NULL THEN 'PUBLIC' ELSE 'CLUB' END;
ALTER TABLE schedule ALTER COLUMN schedule_type SET NOT NULL;
CREATE INDEX idx_schedule_type ON schedule(schedule_type);
