-- 어워드 수상자 테이블 (과거 수상자 수동 입력 + 자동 집계 결과 저장)
CREATE TABLE award_winner (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    award_type VARCHAR(20) NOT NULL,  -- ATTENDANCE, POINTS, BOOKING
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    value BIGINT,  -- 기록값 (참석횟수, 승점, 예약횟수)
    is_manual BOOLEAN NOT NULL DEFAULT false,  -- true: Admin 수동입력, false: 시스템 자동집계
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT,  -- 수동입력 시 입력자 user_id

    CONSTRAINT fk_award_winner_club FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
    CONSTRAINT fk_award_winner_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- 같은 클럽, 같은 기간, 같은 타입에는 한 명만 수상 가능
    CONSTRAINT uk_award_winner_unique UNIQUE (club_id, award_type, period_start, period_end)
);

CREATE INDEX idx_award_winner_club_id ON award_winner(club_id);
CREATE INDEX idx_award_winner_user_id ON award_winner(user_id);
CREATE INDEX idx_award_winner_period ON award_winner(period_start, period_end);

COMMENT ON TABLE award_winner IS '어워드 수상자 기록';
COMMENT ON COLUMN award_winner.is_manual IS 'true: Admin에서 수동입력, false: 시스템 자동집계';
