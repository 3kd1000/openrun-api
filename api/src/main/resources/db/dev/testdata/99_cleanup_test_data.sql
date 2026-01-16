-- ============================================
-- 99. 테스트 데이터 전체 삭제
-- ============================================
-- 주의: 이 스크립트는 개발 환경에서만 실행하세요!
--       테스트 데이터만 삭제합니다 (@openrun.test 이메일 및 '테스트%' 클럽명)

-- 외래키 순서 역순으로 삭제
BEGIN;

-- 1. external_request 삭제
DELETE FROM external_request
WHERE requester_user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')
   OR club_id IN (SELECT id FROM club WHERE name LIKE '테스트%');

-- 2. schedule_participant 삭제
DELETE FROM schedule_participant
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')
   OR schedule_id IN (
       SELECT id FROM schedule
       WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')
   );

-- 3. schedule 삭제
DELETE FROM schedule
WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%');

-- 4. club_member 삭제
DELETE FROM club_member
WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')
   OR user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test');

-- 5. user_profile 삭제
DELETE FROM user_profile
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test');

-- 6. club 삭제
DELETE FROM club
WHERE name LIKE '테스트%';

-- 7. users 삭제
DELETE FROM users
WHERE email LIKE '%@openrun.test';

COMMIT;

-- 결과 확인
SELECT '✅ 테스트 데이터 삭제 완료' AS status;
SELECT
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@openrun.test') AS remaining_users,
    (SELECT COUNT(*) FROM club WHERE name LIKE '테스트%') AS remaining_clubs,
    (SELECT COUNT(*) FROM schedule WHERE club_id IN (SELECT id FROM club WHERE name LIKE '테스트%')) AS remaining_schedules,
    (SELECT COUNT(*) FROM external_request WHERE requester_user_id IN (SELECT id FROM users WHERE email LIKE '%@openrun.test')) AS remaining_requests;
