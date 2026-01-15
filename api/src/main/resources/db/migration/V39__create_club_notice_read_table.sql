-- V39: Create club_notice_read table (공지 읽음 상태)
-- 사용자별 공지 read/unread 추적을 위한 테이블

CREATE TABLE club_notice_read (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    notice_id BIGINT NOT NULL REFERENCES club_notice(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notice_id, user_id)
);

CREATE INDEX idx_club_notice_read_club_user ON club_notice_read(club_id, user_id);
CREATE INDEX idx_club_notice_read_notice_user ON club_notice_read(notice_id, user_id);

