-- ============================================
-- 01. 테스트 사용자 10명 생성
-- ============================================
-- 주의: 이 스크립트는 개발 환경 전용입니다.
--       프로덕션에서는 절대 실행하지 마세요!

-- 사용자 10명 생성 (id는 자동 증가, uid는 NULL)
INSERT INTO users (email, name, image_url, phone_number, phone_visibility, email_visibility, is_guest, deleted, created_at, updated_at) VALUES
('testuser01@openrun.test', '김민수', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser02@openrun.test', '이영희', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser03@openrun.test', '박철수', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser04@openrun.test', '최지현', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser05@openrun.test', '정수민', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser06@openrun.test', '강호동', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser07@openrun.test', '송지효', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser08@openrun.test', '윤도현', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser09@openrun.test', '한예슬', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('testuser10@openrun.test', '임요환', NULL, NULL, 'PUBLIC', 'PUBLIC', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 테니스 프로필 생성 (user_profile)
INSERT INTO user_profile (user_id, tennis_started_at, backhand_type, ntrp, favorite_player, tournament_history, former_player) VALUES
((SELECT id FROM users WHERE email = 'testuser01@openrun.test'), '2020-03-01', 'TWO_HAND', '3.5', '페더러', NULL, false),
((SELECT id FROM users WHERE email = 'testuser02@openrun.test'), '2019-06-15', 'TWO_HAND', '3.0', '나달', NULL, false),
((SELECT id FROM users WHERE email = 'testuser03@openrun.test'), '2021-01-10', 'ONE_HAND', '4.0', '조코비치', '2024 시민대회 8강', false),
((SELECT id FROM users WHERE email = 'testuser04@openrun.test'), '2022-09-01', 'TWO_HAND', '2.5', '세레나 윌리엄스', NULL, false),
((SELECT id FROM users WHERE email = 'testuser05@openrun.test'), '2018-04-20', 'ONE_HAND', '4.5', '페더러', '2023 동호회 대회 우승', true),
((SELECT id FROM users WHERE email = 'testuser06@openrun.test'), '2020-11-05', 'TWO_HAND', '3.0', '델포트로', NULL, false),
((SELECT id FROM users WHERE email = 'testuser07@openrun.test'), '2021-07-12', 'TWO_HAND', '3.5', '오사카 나오미', NULL, false),
((SELECT id FROM users WHERE email = 'testuser08@openrun.test'), '2019-02-28', 'ONE_HAND', '4.0', '페더러', '2024 지역 리그 4강', false),
((SELECT id FROM users WHERE email = 'testuser09@openrun.test'), '2023-05-10', 'TWO_HAND', '2.0', '샤라포바', NULL, false),
((SELECT id FROM users WHERE email = 'testuser10@openrun.test'), '2017-08-15', 'TWO_HAND', '5.0', '페더러', '前 주니어 선수', true);

-- 결과 확인
SELECT '✅ 테스트 사용자 10명 생성 완료' AS status;
SELECT COUNT(*) AS user_count FROM users WHERE email LIKE '%@openrun.test';
SELECT id, email, name FROM users WHERE email LIKE '%@openrun.test' ORDER BY id;
