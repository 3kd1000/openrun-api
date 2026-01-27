-- club 테이블에 멤버 수 필드 추가 (Daily Batch에서 계산, 멤버 변동 시에도 갱신)
ALTER TABLE club ADD COLUMN member_count INTEGER DEFAULT 0;

COMMENT ON COLUMN club.member_count IS '활성 멤버 수 (ACTIVE 상태) - Daily Cron 및 멤버 변동 시 갱신';

-- 기존 데이터 초기화 (ACTIVE 상태 멤버 수로)
UPDATE club c
SET member_count = (
    SELECT COUNT(*)
    FROM club_member cm
    WHERE cm.club_id = c.id AND cm.status = 'ACTIVE'
);
