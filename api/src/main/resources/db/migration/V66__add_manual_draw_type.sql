-- draw_type CHECK 제약 조건에 MANUAL 추가
ALTER TABLE schedule DROP CONSTRAINT schedule_draw_type_check;
ALTER TABLE schedule ADD CONSTRAINT schedule_draw_type_check CHECK (draw_type IN ('AA', 'AB', 'SEED', 'MANUAL'));

COMMENT ON COLUMN schedule.draw_type IS '대진 타입 (AA/AB/SEED/MANUAL, NULL=대진 없음)';
