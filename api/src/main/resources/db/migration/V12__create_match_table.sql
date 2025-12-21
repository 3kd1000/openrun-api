-- 경기(매치) 테이블 (GraphDB 마이그레이션 대비)
CREATE TABLE match (
    id SERIAL PRIMARY KEY,
    draw_id INT NOT NULL,
    match_number INT NOT NULL,

    -- Team A (복식: player1 + player2, 단식: player1만)
    team_a_player1_id INT NOT NULL,
    team_a_player2_id INT,

    -- Team B (복식: player1 + player2, 단식: player1만)
    team_b_player1_id INT NOT NULL,
    team_b_player2_id INT,

    -- 경기 결과 (nullable - 경기 전에는 null)
    team_a_score INT,
    team_b_score INT,
    result VARCHAR(20) CHECK (result IN ('TEAM_A_WIN', 'TEAM_B_WIN', 'DRAW')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_match_draw FOREIGN KEY (draw_id) REFERENCES schedule_draw(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_team_a_player1 FOREIGN KEY (team_a_player1_id) REFERENCES users(id),
    CONSTRAINT fk_match_team_a_player2 FOREIGN KEY (team_a_player2_id) REFERENCES users(id),
    CONSTRAINT fk_match_team_b_player1 FOREIGN KEY (team_b_player1_id) REFERENCES users(id),
    CONSTRAINT fk_match_team_b_player2 FOREIGN KEY (team_b_player2_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX idx_match_draw_id ON match(draw_id);
CREATE INDEX idx_match_team_a_player1 ON match(team_a_player1_id);
CREATE INDEX idx_match_team_a_player2 ON match(team_a_player2_id);
CREATE INDEX idx_match_team_b_player1 ON match(team_b_player1_id);
CREATE INDEX idx_match_team_b_player2 ON match(team_b_player2_id);
CREATE INDEX idx_match_result ON match(result);

-- 코멘트 추가
COMMENT ON TABLE match IS '경기(매치) 기록 - GraphDB 마이그레이션 대비';
COMMENT ON COLUMN match.id IS '경기 ID (PK)';
COMMENT ON COLUMN match.draw_id IS '대진표 ID (FK)';
COMMENT ON COLUMN match.match_number IS '경기 번호 (1, 2, 3...)';
COMMENT ON COLUMN match.team_a_player1_id IS 'Team A 선수1 (단식/복식 모두 필수)';
COMMENT ON COLUMN match.team_a_player2_id IS 'Team A 선수2 (복식만 사용)';
COMMENT ON COLUMN match.team_b_player1_id IS 'Team B 선수1 (단식/복식 모두 필수)';
COMMENT ON COLUMN match.team_b_player2_id IS 'Team B 선수2 (복식만 사용)';
COMMENT ON COLUMN match.team_a_score IS 'Team A 점수 (경기 전에는 null)';
COMMENT ON COLUMN match.team_b_score IS 'Team B 점수 (경기 전에는 null)';
COMMENT ON COLUMN match.result IS '경기 결과 (TEAM_A_WIN/TEAM_B_WIN/DRAW)';
