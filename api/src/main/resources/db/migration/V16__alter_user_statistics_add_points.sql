-- V16: user_statistics 테이블에 승점(points) 컬럼 추가
-- 승점 계산: 승=3점, 무=1점, 패=0점

ALTER TABLE user_statistics
ADD COLUMN points INT NOT NULL DEFAULT 0;

-- 승점 기준 정렬을 위한 인덱스 추가
CREATE INDEX idx_user_statistics_club_points ON user_statistics(club_id, points DESC);

-- 기존 데이터가 있다면 승점 재계산 (wins * 3 + draws * 1)
UPDATE user_statistics
SET points = (wins * 3 + draws * 1);
