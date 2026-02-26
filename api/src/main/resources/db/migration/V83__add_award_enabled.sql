-- 어워드 기능 글로벌 ON/OFF 토글 추가
ALTER TABLE club_policy ADD COLUMN award_enabled BOOLEAN NOT NULL DEFAULT true;
