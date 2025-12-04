-- Create club_member table
CREATE TABLE club_member (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(club_id, user_id)
);

-- Create index for frequently queried columns
CREATE INDEX idx_club_member_club_id ON club_member(club_id);
CREATE INDEX idx_club_member_user_id ON club_member(user_id);
