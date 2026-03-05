ALTER TABLE club_policy ADD COLUMN ranking_period VARCHAR(20) NOT NULL DEFAULT 'YEARLY';
ALTER TABLE club_policy ADD COLUMN ranking_custom_seasons TEXT;
