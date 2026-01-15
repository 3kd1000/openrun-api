-- V36: Refactor posts table - remove title, change category to post_type, limit content to 500 chars, add guest fields

-- 1. Add new post_type column
ALTER TABLE posts ADD COLUMN post_type VARCHAR(20);

-- 2. Copy data from category to post_type, converting values
UPDATE posts SET post_type =
    CASE category
        WHEN 'FREE' THEN 'GENERAL'
        WHEN 'QUESTION' THEN 'INQUIRY'
        ELSE category
    END;

-- 3. Make post_type NOT NULL
ALTER TABLE posts ALTER COLUMN post_type SET NOT NULL;

-- 4. Drop old category column
ALTER TABLE posts DROP COLUMN category;

-- 5. Drop title column
ALTER TABLE posts DROP COLUMN title;

-- 6. Modify content column to VARCHAR(500)
ALTER TABLE posts ALTER COLUMN content TYPE VARCHAR(500);

-- 7. Add guest_name and guest_email columns for INQUIRY posts
ALTER TABLE posts ADD COLUMN guest_name VARCHAR(100);
ALTER TABLE posts ADD COLUMN guest_email VARCHAR(100);

-- 8. Allow author_id to be nullable (for guest INQUIRY posts)
ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;
