-- 일정에 소요시간(분) 컬럼 추가
-- 기본값 120분(2시간)으로 설정
ALTER TABLE schedule ADD COLUMN duration_minutes INTEGER DEFAULT 120;

-- 기존 데이터도 명시적으로 2시간으로 설정
UPDATE schedule SET duration_minutes = 120 WHERE duration_minutes IS NULL;
