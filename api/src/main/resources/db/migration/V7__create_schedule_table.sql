
-- 1. Users 테이블에 1명의 사용자 추가 (실제 구글 이메일로 생성)
-- OAuth 로그인 시 이메일 일치하면 user_oauth_provider만 추가됨
INSERT INTO users (uid, social_id, email, name, deleted, created_at, updated_at) VALUES
('temp-uid-3kd1000', 'temp-social-3kd1000', '3kd1000@gmail.com', '정주상', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 오픈런 테니스 클럽 데이터 (ID = 1 고정)
-- schedule 테이블이 club_id FK를 참조하므로 먼저 생성
INSERT INTO club (id, name, description, region, owner_user_id, deleted, created_at, updated_at)
VALUES (
    1,
    '오픈런 테니스 클럽',
    '테니스를 사랑하는 사람들의 모임',
    '용인',
    1,  -- owner_user_id는 나중에 실제 관리자 ID로 변경 가능
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;  -- 이미 존재하면 무시 (멱등성 보장)

-- ID 시퀀스를 2부터 시작하도록 설정 (향후 다른 클럽 추가 대비)
SELECT setval('club_id_seq', GREATEST(1, (SELECT MAX(id) FROM club)), true);


-- schedule 테이블 생성
CREATE TABLE schedule (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    court_name VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_capacity INT NOT NULL,
    current_participants INT NOT NULL DEFAULT 0,
    cost DECIMAL(10, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedule_club_id ON schedule(club_id);
CREATE INDEX idx_schedule_scheduled_at ON schedule(scheduled_at);

COMMENT ON TABLE schedule IS '코트 일정 정보를 저장하는 테이블';
COMMENT ON COLUMN schedule.id IS '일정 ID';
COMMENT ON COLUMN schedule.club_id IS '클럽 ID';
COMMENT ON COLUMN schedule.court_name IS '코트명 (예: 골드 3번 코트)';
COMMENT ON COLUMN schedule.scheduled_at IS '일정 시간';
COMMENT ON COLUMN schedule.max_capacity IS '최대 정원';
COMMENT ON COLUMN schedule.current_participants IS '현재 참가자 수 (캐싱용)';
COMMENT ON COLUMN schedule.cost IS '비용 (선택)';
COMMENT ON COLUMN schedule.description IS '일정 설명';
COMMENT ON COLUMN schedule.created_at IS '생성 시각';
COMMENT ON COLUMN schedule.updated_at IS '수정 시각';
