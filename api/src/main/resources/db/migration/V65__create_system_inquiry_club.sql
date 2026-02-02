-- OpenRun 운영팀 시스템 클럽 생성
-- 서비스 문의 접수 전용 클럽

-- 1. 시스템 클럽 생성
-- system_admins가 있으면 그 user_id 사용, 없으면 users 테이블의 첫 번째 사용자 사용
INSERT INTO club (name, description, region, owner_user_id, member_count, deleted, created_at, updated_at)
SELECT
    'OpenRun 운영팀',
    '서비스 문의 접수 전용 클럽입니다. 문의사항이 있으시면 글을 남겨주세요.',
    NULL,
    COALESCE(
        (SELECT user_id FROM system_admins ORDER BY id LIMIT 1),
        (SELECT id FROM users ORDER BY id LIMIT 1)
    ),
    1,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM users);

-- 2. 클럽 owner를 멤버로 등록
INSERT INTO club_member (club_id, user_id, status, role, is_ball_keeper, ball_quantity, joined_at)
SELECT
    c.id,
    c.owner_user_id,
    'ACTIVE',
    'OWNER',
    false,
    0,
    CURRENT_TIMESTAMP
FROM club c
WHERE c.name = 'OpenRun 운영팀';
