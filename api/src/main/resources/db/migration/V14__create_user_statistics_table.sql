-- 사용자 통계 테이블 (스코어보드용)
CREATE TABLE user_statistics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,

    -- 경기 통계
    total_matches INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,

    -- 점수 통계
    total_points_scored INT NOT NULL DEFAULT 0,
    total_points_conceded INT NOT NULL DEFAULT 0,

    -- 계산 필드
    win_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,  -- 승률 (0.00 ~ 100.00)
    goal_difference INT NOT NULL DEFAULT 0,         -- 득실차

    -- 메타 정보
    last_match_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 외래키
    CONSTRAINT fk_user_statistics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_statistics_club FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,

    -- 유니크 제약 (한 클럽에서 한 사용자당 하나의 통계만)
    CONSTRAINT uk_user_statistics_user_club UNIQUE (user_id, club_id)
);

-- 인덱스 생성
CREATE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX idx_user_statistics_club_id ON user_statistics(club_id);
CREATE INDEX idx_user_statistics_win_rate ON user_statistics(club_id, win_rate DESC);
CREATE INDEX idx_user_statistics_goal_diff ON user_statistics(club_id, goal_difference DESC);

-- 코멘트 추가
COMMENT ON TABLE user_statistics IS '사용자별 경기 통계 (스코어보드용)';
COMMENT ON COLUMN user_statistics.user_id IS '사용자 ID';
COMMENT ON COLUMN user_statistics.club_id IS '클럽 ID';
COMMENT ON COLUMN user_statistics.total_matches IS '총 경기 수';
COMMENT ON COLUMN user_statistics.wins IS '승리 수';
COMMENT ON COLUMN user_statistics.draws IS '무승부 수';
COMMENT ON COLUMN user_statistics.losses IS '패배 수';
COMMENT ON COLUMN user_statistics.total_points_scored IS '총 득점';
COMMENT ON COLUMN user_statistics.total_points_conceded IS '총 실점';
COMMENT ON COLUMN user_statistics.win_rate IS '승률 (%)';
COMMENT ON COLUMN user_statistics.goal_difference IS '득실차';
COMMENT ON COLUMN user_statistics.last_match_at IS '마지막 경기 날짜';
