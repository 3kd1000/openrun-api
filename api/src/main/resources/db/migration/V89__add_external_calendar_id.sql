-- CalendarConnection에 서브 캘린더 ID 저장 컬럼 추가
ALTER TABLE calendar_connection ADD COLUMN external_calendar_id VARCHAR(255);
