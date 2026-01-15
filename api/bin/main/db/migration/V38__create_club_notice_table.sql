-- V38: Create club_notice table (공지사항)
-- 공지사항은 posts 카테고리(NOTICE)에서 분리하여 별도 테이블로 관리합니다.

CREATE TABLE club_notice (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_club_notice_club_id ON club_notice(club_id);
CREATE INDEX idx_club_notice_display_order ON club_notice(club_id, display_order);

