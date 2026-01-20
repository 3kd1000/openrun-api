-- ============================================
-- 99. 테스트 데이터 전체 삭제
-- ============================================
-- 주의: 이 스크립트는 개발 환경에서만 실행하세요!
--       테스트 데이터만 삭제합니다 (@openrun.test 이메일 및 '테스트%' 클럽명)

-- ============================================
-- 환경 검증 (프로덕션 실행 방지)
-- ============================================
DO $$
BEGIN
    IF current_database() NOT LIKE '%dev%' AND current_database() NOT LIKE '%test%' AND current_database() NOT LIKE '%local%' THEN
        RAISE EXCEPTION '⛔ 이 스크립트는 개발/테스트 환경에서만 실행할 수 있습니다! 현재 DB: %', current_database();
    END IF;
    RAISE NOTICE '✅ 환경 검증 통과: %', current_database();
END $$;

-- 외래키 순서 역순으로 삭제
BEGIN;

-- 1. match 삭제 (대진 경기 기록)
DELETE FROM match
WHERE schedule_id IN (
    SELECT id FROM schedule
    WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')
);

-- 2. external_request 삭제
DELETE FROM external_request
WHERE requester_user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')
   OR club_id IN (SELECT id FROM club WHERE name LIKE '테스트%');

-- 3. schedule_participant 삭제
DELETE FROM schedule_participant
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')
   OR schedule_id IN (
       SELECT id FROM schedule
       WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')
   );

-- 4. schedule 삭제
DELETE FROM schedule
WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%');

-- 5. club_member 삭제 (테스트 클럽에서 개발 유저 멤버십도 함께 삭제)
DELETE FROM club_member
WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')
   OR user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test');

-- 6. user_profile 삭제
DELETE FROM user_profile
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test');

-- 7. club 삭제
DELETE FROM club
WHERE name LIKE '테스트%';

-- 8. users 삭제 (테스트 사용자만 - 실제 개발 유저는 삭제하지 않음)
DELETE FROM users
WHERE email LIKE '%@openrun.test';

COMMIT;

-- 결과 확인
SELECT '✅ 테스트 데이터 삭제 완료' AS status;
SELECT
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@openrun.test') AS remaining_test_users,
    (SELECT COUNT(*) FROM club WHERE name LIKE '테스트%') AS remaining_test_clubs,
    (SELECT COUNT(*) FROM schedule WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')) AS remaining_schedules,
    (SELECT COUNT(*) FROM external_request WHERE requester_user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')) AS remaining_requests;

-- 개발 유저 멤버십 확인 (테스트 클럽 삭제 후 개발 유저의 다른 클럽 멤버십은 유지됨)
SELECT '📋 개발 유저 멤버십 현황 (실제 클럽만)' AS info;
SELECT
    u.name,
    COUNT(cm.id) AS club_count
FROM users u
LEFT JOIN club_member cm ON u.id = cm.user_id
LEFT JOIN club c ON cm.club_id = c.id AND c.name NOT LIKE '테스트%'
WHERE u.name IN ('김형준', '권종근', '장석원', '김정오', '김영준', '정주상')
GROUP BY u.name;
