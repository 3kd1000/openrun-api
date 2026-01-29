-- OpenRun 기존 회원 데이터 마이그레이션
-- 실행: DBeaver에서 수동 실행 (Flyway 자동실행 X)
-- 실행 전 반드시 백업할 것!
--
-- 주의: phone_number, birth_date는 평문으로 저장됨
--       (사용자가 프로필 수정 시 자동 암호화됨)

-- ============================================
-- 1. users 테이블 업데이트 (phone_number, birth_date, region)
-- ============================================

-- 경기도 용인시
UPDATE users SET phone_number = '010-4036-8430', birth_date = '770227', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '장석원' AND deleted = false;
UPDATE users SET phone_number = '010-9098-3107', birth_date = '771114', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '정윤환' AND deleted = false;
UPDATE users SET phone_number = '010-8241-6225', birth_date = '780423', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '박영근' AND deleted = false;
UPDATE users SET phone_number = '010-3021-0333', birth_date = '780721', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '최승연' AND deleted = false;
UPDATE users SET phone_number = '010-2793-3399', birth_date = '850210', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '이상훈' AND deleted = false;
UPDATE users SET phone_number = '010-5521-7908', birth_date = '851228', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '김정오' AND deleted = false;
UPDATE users SET phone_number = '010-7926-5461', birth_date = '871111', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '송명우' AND deleted = false;
UPDATE users SET phone_number = '010-4958-0523', birth_date = '890523', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '장현석' AND deleted = false;
UPDATE users SET phone_number = '010-6663-4624', birth_date = '900131', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '안현우' AND deleted = false;
UPDATE users SET phone_number = '010-5835-7250', birth_date = '900527', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '나수한' AND deleted = false;
UPDATE users SET phone_number = '010-3691-5044', birth_date = '940107', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '마동혁' AND deleted = false;
UPDATE users SET phone_number = '010-7350-5721', birth_date = '920704', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '서영재' AND deleted = false;
UPDATE users SET phone_number = '010-5299-8308', birth_date = '931225', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '이대현' AND deleted = false;
UPDATE users SET phone_number = '010-4921-1593', birth_date = '950727', region_depth1 = '경기도', region_depth2 = '용인시' WHERE name = '성치호' AND deleted = false;

-- 경기도 성남시
UPDATE users SET phone_number = '010-4302-4057', birth_date = '800217', region_depth1 = '경기도', region_depth2 = '성남시' WHERE name = '김민표' AND deleted = false;
UPDATE users SET phone_number = '010-8749-6446', birth_date = '870327', region_depth1 = '경기도', region_depth2 = '성남시' WHERE name = '김민석' AND deleted = false;
UPDATE users SET phone_number = '010-8514-8509', birth_date = '870806', region_depth1 = '경기도', region_depth2 = '성남시' WHERE name = '이강일' AND deleted = false;
UPDATE users SET phone_number = '010-8377-0944', birth_date = '900801', region_depth1 = '경기도', region_depth2 = '성남시' WHERE name = '정주상' AND deleted = false;

-- 경기도 화성시
UPDATE users SET phone_number = '010-3837-2972', birth_date = '810305', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '정민식' AND deleted = false;
UPDATE users SET phone_number = '010-6233-6186', birth_date = '870221', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '이동주' AND deleted = false;
UPDATE users SET phone_number = '010-4526-7697', birth_date = '890427', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '권종근' AND deleted = false;
UPDATE users SET phone_number = '010-6771-2214', birth_date = '900713', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '김범준' AND deleted = false;
UPDATE users SET phone_number = '010-3661-7425', birth_date = '901107', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '김형준' AND deleted = false;
UPDATE users SET phone_number = '010-4765-8214', birth_date = '910530', region_depth1 = '경기도', region_depth2 = '화성시' WHERE name = '백규철' AND deleted = false;

-- 경기도 수원시
UPDATE users SET phone_number = '010-9490-1984', birth_date = '840228', region_depth1 = '경기도', region_depth2 = '수원시' WHERE name = '김영준' AND deleted = false;
UPDATE users SET phone_number = '010-8075-3238', birth_date = '881210', region_depth1 = '경기도', region_depth2 = '수원시' WHERE name = '송현우' AND deleted = false;
UPDATE users SET phone_number = '010-5087-3011', birth_date = '891005', region_depth1 = '경기도', region_depth2 = '수원시' WHERE name = '채민식' AND deleted = false;
UPDATE users SET phone_number = '010-9920-8107', birth_date = '900808', region_depth1 = '경기도', region_depth2 = '수원시' WHERE name = '박성익' AND deleted = false;
UPDATE users SET phone_number = '010-8660-2765', birth_date = '970406', region_depth1 = '경기도', region_depth2 = '수원시' WHERE name = '김준영' AND deleted = false;

-- 대전광역시
UPDATE users SET phone_number = '010-2850-0913', birth_date = '900913', region_depth1 = '대전광역시', region_depth2 = '중구' WHERE name = '구현호' AND deleted = false;


-- ============================================
-- 2. user_profile 테이블 UPSERT (없으면 INSERT, 있으면 UPDATE)
-- ============================================

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-04-01', NULL, NULL, false FROM users WHERE name = '장석원' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2023-01-01', NULL, NULL, false FROM users WHERE name = '정윤환' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2018-04-01', NULL, NULL, false FROM users WHERE name = '박영근' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2020-11-01', NULL, NULL, false FROM users WHERE name = '최승연' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2022-05-01', NULL, NULL, false FROM users WHERE name = '김민표' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2019-01-01', NULL, NULL, false FROM users WHERE name = '정민식' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-05-01', NULL, NULL, false FROM users WHERE name = '김영준' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2022-01-01', NULL, NULL, false FROM users WHERE name = '이상훈' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2017-05-01', NULL, NULL, false FROM users WHERE name = '김정오' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-05-01', NULL, NULL, false FROM users WHERE name = '이동주' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-02-01', NULL, NULL, false FROM users WHERE name = '김민석' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-04-01', NULL, NULL, false FROM users WHERE name = '이강일' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2020-07-01', NULL, NULL, false FROM users WHERE name = '송명우' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-02-01', NULL, NULL, false FROM users WHERE name = '송현우' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2020-07-01', NULL, NULL, false FROM users WHERE name = '권종근' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2019-06-01', NULL, NULL, false FROM users WHERE name = '장현석' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2023-03-01', NULL, NULL, false FROM users WHERE name = '채민식' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-06-01', NULL, NULL, false FROM users WHERE name = '안현우' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2020-10-01', NULL, NULL, false FROM users WHERE name = '김범준' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-10-01', NULL, NULL, false FROM users WHERE name = '나수한' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-05-01', NULL, NULL, false FROM users WHERE name = '정주상' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-10-01', NULL, NULL, false FROM users WHERE name = '구현호' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-10-01', NULL, NULL, false FROM users WHERE name = '박성익' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2022-09-01', NULL, NULL, false FROM users WHERE name = '김형준' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-12-01', NULL, NULL, false FROM users WHERE name = '백규철' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2023-06-01', NULL, NULL, false FROM users WHERE name = '서영재' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2019-03-01', NULL, NULL, false FROM users WHERE name = '이대현' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2021-10-01', NULL, NULL, false FROM users WHERE name = '마동혁' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2020-01-01', NULL, NULL, false FROM users WHERE name = '성치호' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;

INSERT INTO user_profile (user_id, tennis_started_at, ntrp, tournament_history, former_player)
SELECT id, '2023-03-01', NULL, NULL, false FROM users WHERE name = '김준영' AND deleted = false
ON CONFLICT (user_id) DO UPDATE SET tennis_started_at = EXCLUDED.tennis_started_at;


-- ============================================
-- 3. 검증 쿼리 (실행 후 확인용)
-- ============================================

-- 업데이트된 사용자 수 확인
-- SELECT COUNT(*) as updated_users FROM users WHERE phone_number IS NOT NULL AND deleted = false;

-- 데이터 확인
-- SELECT u.name, u.phone_number, u.birth_date, up.tennis_started_at
-- FROM users u
-- LEFT JOIN user_profile up ON u.id = up.user_id
-- WHERE u.deleted = false AND u.phone_number IS NOT NULL
-- ORDER BY u.name;
