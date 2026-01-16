-- ============================================
-- 03. 클럽 멤버십 생성
-- ============================================
-- 주의: 이 스크립트는 개발 환경 전용입니다.

-- [클럽 1: 테스트 강남 테니스 클럽] - 7명 (OWNER 1 + ADMIN 1 + REGULAR 5)
INSERT INTO club_member (club_id, user_id, role, status, joined_at) VALUES
-- OWNER
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser01@openrun.test'), 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '180 days'),

-- ADMIN
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser02@openrun.test'), 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '150 days'),

-- REGULAR (정회원)
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser03@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '120 days'),
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser04@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '90 days'),
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser06@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '60 days'),
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser07@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '30 days'),

-- PENDING (가입 신청 중)
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM users WHERE email = 'testuser09@openrun.test'), 'REGULAR', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '2 days');


-- [클럽 2: 테스트 부산 코트 클럽] - 5명 (OWNER 1 + ADMIN 1 + REGULAR 3)
INSERT INTO club_member (club_id, user_id, role, status, joined_at) VALUES
-- OWNER
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 (SELECT id FROM users WHERE email = 'testuser05@openrun.test'), 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '200 days'),

-- ADMIN
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 (SELECT id FROM users WHERE email = 'testuser06@openrun.test'), 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '180 days'),

-- REGULAR
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 (SELECT id FROM users WHERE email = 'testuser07@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '100 days'),
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 (SELECT id FROM users WHERE email = 'testuser08@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '80 days'),
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 (SELECT id FROM users WHERE email = 'testuser02@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '50 days');


-- [클럽 3: 테스트 인천 주말 클럽] - 4명 (OWNER 1 + REGULAR 3)
INSERT INTO club_member (club_id, user_id, role, status, joined_at) VALUES
-- OWNER
((SELECT id FROM club WHERE name = '테스트 인천 주말 클럽'),
 (SELECT id FROM users WHERE email = 'testuser08@openrun.test'), 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '120 days'),

-- REGULAR
((SELECT id FROM club WHERE name = '테스트 인천 주말 클럽'),
 (SELECT id FROM users WHERE email = 'testuser03@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '90 days'),
((SELECT id FROM club WHERE name = '테스트 인천 주말 클럽'),
 (SELECT id FROM users WHERE email = 'testuser04@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '70 days'),
((SELECT id FROM club WHERE name = '테스트 인천 주말 클럽'),
 (SELECT id FROM users WHERE email = 'testuser09@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '40 days');


-- [클럽 4: 테스트 경기 프로 클럽] - 3명 (OWNER 1 + REGULAR 2)
INSERT INTO club_member (club_id, user_id, role, status, joined_at) VALUES
-- OWNER
((SELECT id FROM club WHERE name = '테스트 경기 프로 클럽'),
 (SELECT id FROM users WHERE email = 'testuser10@openrun.test'), 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '150 days'),

-- REGULAR
((SELECT id FROM club WHERE name = '테스트 경기 프로 클럽'),
 (SELECT id FROM users WHERE email = 'testuser03@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '100 days'),
((SELECT id FROM club WHERE name = '테스트 경기 프로 클럽'),
 (SELECT id FROM users WHERE email = 'testuser05@openrun.test'), 'REGULAR', 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '80 days');


-- 결과 확인
SELECT '✅ 클럽 멤버십 생성 완료' AS status;
SELECT
    c.name AS club_name,
    u.name AS user_name,
    cm.role,
    cm.status,
    cm.joined_at
FROM club_member cm
JOIN club c ON cm.club_id = c.id
JOIN users u ON cm.user_id = u.id
WHERE c.name LIKE '테스트%'
ORDER BY c.name, cm.role DESC, cm.joined_at;
