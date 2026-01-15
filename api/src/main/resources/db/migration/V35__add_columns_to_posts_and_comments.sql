-- V35: Add like_count, comment_count, deleted to posts and comments tables

-- 1. Add columns to posts table
ALTER TABLE posts
    ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Update deleted from deleted_at
UPDATE posts SET deleted = TRUE WHERE deleted_at IS NOT NULL;

-- Create index for deleted
CREATE INDEX idx_posts_deleted ON posts(deleted);

-- Drop old deleted_at column and index
DROP INDEX IF EXISTS idx_posts_deleted_at;
ALTER TABLE posts DROP COLUMN deleted_at;

-- 2. Add columns to comments table
ALTER TABLE comments
    ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for deleted
CREATE INDEX idx_comments_deleted ON comments(deleted);
