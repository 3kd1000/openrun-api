-- Add social_id column to users table
ALTER TABLE users ADD COLUMN social_id VARCHAR(255);

-- Add unique constraint to social_id column
ALTER TABLE users ADD CONSTRAINT uc_users_social_id UNIQUE (social_id);

-- Modify email column to allow null values
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
