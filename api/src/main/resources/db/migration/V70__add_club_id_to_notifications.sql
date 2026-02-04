ALTER TABLE notifications ADD COLUMN club_id BIGINT NOT NULL REFERENCES club(id);
CREATE INDEX idx_notifications_club_id ON notifications(club_id);
