-- 일정 생성 템플릿 테이블
CREATE TABLE schedule_template (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    template_name VARCHAR(50) NOT NULL,
    court_name VARCHAR(100) NOT NULL,
    max_capacity INTEGER NOT NULL,
    cost DECIMAL(10, 2),
    participation_start_pattern VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_template_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_max_capacity
        CHECK (max_capacity >= 1),
    CONSTRAINT check_template_name_length
        CHECK (char_length(template_name) >= 1 AND char_length(template_name) <= 50)
);

-- 인덱스 생성
CREATE INDEX idx_schedule_template_user_id ON schedule_template(user_id);
CREATE UNIQUE INDEX idx_schedule_template_user_name ON schedule_template(user_id, template_name);

-- 코멘트 추가
COMMENT ON TABLE schedule_template IS '사용자별 일정 생성 템플릿';
COMMENT ON COLUMN schedule_template.user_id IS '템플릿 소유자 (사용자 ID)';
COMMENT ON COLUMN schedule_template.template_name IS '템플릿 이름 (예: 주말 오전, 평일 저녁)';
COMMENT ON COLUMN schedule_template.court_name IS '코트명';
COMMENT ON COLUMN schedule_template.max_capacity IS '최대 정원';
COMMENT ON COLUMN schedule_template.cost IS '참가 비용 (nullable)';
COMMENT ON COLUMN schedule_template.participation_start_pattern IS '참가신청 시작시간 패턴 (예: 매달 1일 00:00)';
