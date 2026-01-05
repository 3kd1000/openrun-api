-- 기존 UNIQUE 제약조건 제거
DROP INDEX IF EXISTS idx_schedule_template_user_name;

-- template_type 컬럼 추가
ALTER TABLE schedule_template
ADD COLUMN template_type VARCHAR(30) NOT NULL DEFAULT 'SCHEDULE';

-- CHECK 제약조건 추가 (SCHEDULE 또는 PARTICIPATION_START만 허용)
ALTER TABLE schedule_template
ADD CONSTRAINT chk_template_type CHECK (template_type IN ('SCHEDULE', 'PARTICIPATION_START'));

-- court_name과 max_capacity를 nullable로 변경
ALTER TABLE schedule_template
ALTER COLUMN court_name DROP NOT NULL,
ALTER COLUMN max_capacity DROP NOT NULL;

-- template_name 길이 제한 변경 (50 → 5)
ALTER TABLE schedule_template
ALTER COLUMN template_name TYPE VARCHAR(5);

-- 새로운 UNIQUE 제약조건 추가 (user_id, template_type, template_name)
CREATE UNIQUE INDEX idx_schedule_template_user_type_name
ON schedule_template(user_id, template_type, template_name);

-- DEFAULT 제거 (이후 레코드는 명시적으로 template_type 지정 필요)
ALTER TABLE schedule_template
ALTER COLUMN template_type DROP DEFAULT;
