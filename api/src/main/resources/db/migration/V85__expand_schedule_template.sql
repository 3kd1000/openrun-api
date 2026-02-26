-- 즐겨찾기 확장: 새 필드 추가 + 이름 길이 확장
ALTER TABLE schedule_template ALTER COLUMN template_name TYPE VARCHAR(20);

ALTER TABLE schedule_template ADD COLUMN court_address VARCHAR(200);
ALTER TABLE schedule_template ADD COLUMN region VARCHAR(50);
ALTER TABLE schedule_template ADD COLUMN match_type VARCHAR(20);
ALTER TABLE schedule_template ADD COLUMN number_of_courts INTEGER;
