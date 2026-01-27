-- 사용자 테니스 프로필(선택 정보) - 1:1
CREATE TABLE user_profile (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tennis_started_at DATE NULL,
    backhand_type VARCHAR(20) NULL, -- ONE_HAND / TWO_HAND
    favorite_player VARCHAR(100) NULL,
    ntrp VARCHAR(20) NULL,
    tournament_history TEXT NULL,
    former_player BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profile_backhand_type ON user_profile(backhand_type);
