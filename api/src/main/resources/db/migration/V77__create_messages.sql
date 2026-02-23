-- 다이렉트 메시지(DM) 테이블
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    receiver_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_type VARCHAR(20),
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 수신자 기준 조회 (대화 목록, 읽지 않은 메시지)
CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at DESC);

-- 발신자 기준 조회
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);

-- 대화 쌍 조회 (두 사용자 간의 메시지)
CREATE INDEX idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
);
