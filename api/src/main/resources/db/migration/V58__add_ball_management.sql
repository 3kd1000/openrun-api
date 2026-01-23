-- 공용구 관리 기능 추가
-- Phase 1: club_member 컬럼 추가 + club_ball_transaction 테이블 생성

-- club_member 테이블에 공용구 관련 컬럼 추가
ALTER TABLE club_member
    ADD COLUMN is_ball_keeper BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN ball_quantity INT NOT NULL DEFAULT 0;

-- 인덱스 추가 (보유자 조회용)
CREATE INDEX idx_club_member_ball_keeper ON club_member(club_id, is_ball_keeper) WHERE is_ball_keeper = true;

-- club_ball_transaction 테이블 생성 (거래 내역)
CREATE TABLE club_ball_transaction (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    from_member_id BIGINT,
    to_member_id BIGINT,
    schedule_id BIGINT,
    description VARCHAR(500),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ball_transaction_club FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
    CONSTRAINT fk_ball_transaction_from_member FOREIGN KEY (from_member_id) REFERENCES club_member(id) ON DELETE SET NULL,
    CONSTRAINT fk_ball_transaction_to_member FOREIGN KEY (to_member_id) REFERENCES club_member(id) ON DELETE SET NULL,
    CONSTRAINT fk_ball_transaction_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE SET NULL,
    CONSTRAINT fk_ball_transaction_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('ADD', 'DISTRIBUTE', 'USE', 'ADJUST')),
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

-- 인덱스 추가
CREATE INDEX idx_ball_transaction_club_id ON club_ball_transaction(club_id);
CREATE INDEX idx_ball_transaction_created_at ON club_ball_transaction(club_id, created_at DESC);
CREATE INDEX idx_ball_transaction_schedule_id ON club_ball_transaction(schedule_id) WHERE schedule_id IS NOT NULL;

-- 코멘트 추가
COMMENT ON TABLE club_ball_transaction IS '클럽 공용구 거래 내역';
COMMENT ON COLUMN club_ball_transaction.transaction_type IS 'ADD: 입고, DISTRIBUTE: 배분, USE: 사용, ADJUST: 조정';
COMMENT ON COLUMN club_ball_transaction.quantity IS '거래 수량 (캔 단위)';
COMMENT ON COLUMN club_ball_transaction.from_member_id IS '출발 보유자 (DISTRIBUTE, USE에서 사용)';
COMMENT ON COLUMN club_ball_transaction.to_member_id IS '도착 보유자 (ADD, DISTRIBUTE에서 사용)';
COMMENT ON COLUMN club_ball_transaction.schedule_id IS '사용된 일정 (USE에서 사용)';
