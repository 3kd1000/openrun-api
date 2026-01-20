-- V50: 테니스 프로필에서 불필요한 필드 제거 (백핸드, 좋아하는 선수)
-- 작성일: 2026-01-18

-- backhand_type 컬럼 제거
ALTER TABLE user_profile DROP COLUMN IF EXISTS backhand_type;

-- favorite_player 컬럼 제거
ALTER TABLE user_profile DROP COLUMN IF EXISTS favorite_player;
