CREATE TABLE message_reports (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id),
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    reason VARCHAR(20) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by BIGINT REFERENCES users(id)
);

CREATE INDEX idx_message_reports_status ON message_reports(status, created_at DESC);
CREATE UNIQUE INDEX idx_message_reports_unique ON message_reports(message_id, reporter_id);
