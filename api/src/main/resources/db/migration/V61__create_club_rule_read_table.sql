-- 회칙 읽음 추적 테이블 (공지사항 읽음 추적과 동일한 구조)
CREATE TABLE club_rule_read (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_club_rule_read_club FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
    CONSTRAINT fk_club_rule_read_rule FOREIGN KEY (rule_id) REFERENCES club_rule(id) ON DELETE CASCADE,
    CONSTRAINT fk_club_rule_read_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_club_rule_read_rule_user UNIQUE (rule_id, user_id)
);

-- 인덱스
CREATE INDEX idx_club_rule_read_club_user ON club_rule_read(club_id, user_id);
CREATE INDEX idx_club_rule_read_rule ON club_rule_read(rule_id);
