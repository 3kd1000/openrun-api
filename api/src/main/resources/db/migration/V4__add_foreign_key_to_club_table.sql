ALTER TABLE club
ADD CONSTRAINT fk_club_owner_user_id
FOREIGN KEY (owner_user_id)
REFERENCES users(id);
