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
-- ============================================
-- 02. 테스트 클럽 4개 생성
-- ============================================
-- 주의: 이 스크립트는 개발 환경 전용입니다.

-- 클럽 4개 생성 (id는 자동 증가)
INSERT INTO club (name, description, region, owner_user_id, member_recruitment_status, deleted, created_at, updated_at) VALUES
('테스트 강남 테니스 클럽',
 '서울 강남 지역에서 활동하는 테니스 동호회입니다. 주말마다 모여서 복식 경기를 즐깁니다.',
 '서울 강남',
 (SELECT id FROM users WHERE email = 'testuser01@openrun.test'),
 'OPEN',
 false,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP),

('테스트 부산 코트 클럽',
 '부산 해운대 지역 테니스 동호회. 평일 저녁과 주말에 주로 활동합니다.',
 '부산 해운대',
 (SELECT id FROM users WHERE email = 'testuser05@openrun.test'),
 'OPEN',
 false,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP),

('테스트 인천 주말 클럽',
 '주말에만 모이는 테니스 클럽입니다. 초보자부터 중급자까지 환영합니다.',
 '인천',
 (SELECT id FROM users WHERE email = 'testuser08@openrun.test'),
 'CLOSED',
 false,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP),

('테스트 경기 프로 클럽',
 '경기도 지역 고급 테니스 클럽. NTRP 4.0 이상 선수출신 중심으로 운영됩니다.',
 '경기 성남',
 (SELECT id FROM users WHERE email = 'testuser10@openrun.test'),
 'CLOSED',
 false,
 CURRENT_TIMESTAMP,
 CURRENT_TIMESTAMP);

-- 결과 확인
SELECT '✅ 테스트 클럽 4개 생성 완료' AS status;
SELECT id, name, region, member_recruitment_status FROM club WHERE name LIKE '테스트%' ORDER BY id;
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
-- ============================================
-- 04. 일정 및 참가자 생성
-- ============================================
-- 주의: 이 스크립트는 개발 환경 전용입니다.
-- 클럽 1 (테스트 강남 테니스 클럽)의 일정 생성: 과거 5개, 미래 10개

-- ============================================
-- 과거 일정 5개 (지난주)
-- ============================================
INSERT INTO schedule (
    club_id, court_name, scheduled_at, max_capacity, current_participants,
    cost, description, pinned, guest_recruit_open, interclub_recruit_open,
    draw_type, is_draw_valid, created_at, updated_at
) VALUES
-- 과거 1
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 A코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '7 days') + TIME '10:00:00',
 8, 6, 30000, '주말 복식 경기', false, false, false,
 NULL, false, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),

-- 과거 2
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 B코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '6 days') + TIME '14:00:00',
 6, 6, 25000, NULL, false, false, false,
 'AA', true, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),

-- 과거 3
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 C코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '5 days') + TIME '18:00:00',
 10, 8, 35000, '평일 저녁 경기', false, false, false,
 NULL, false, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- 과거 4
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 VIP코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '4 days') + TIME '10:00:00',
 4, 4, 50000, 'VIP 프라이빗 경기', false, false, false,
 'SEED', true, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- 과거 5
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 D코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '3 days') + TIME '16:00:00',
 8, 7, 28000, NULL, false, false, false,
 NULL, false, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');


-- ============================================
-- 미래 일정 10개
-- ============================================
INSERT INTO schedule (
    club_id, court_name, scheduled_at, max_capacity, current_participants,
    cost, description, pinned, guest_recruit_open, guest_recruit_note,
    interclub_recruit_open, draw_type, is_draw_valid, created_at, updated_at
) VALUES
-- 미래 1: 게스트 모집 중
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 A코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '1 day') + TIME '10:00:00',
 8, 5, 30000, '주말 복식 게스트 환영', false, true, '게스트 참가비 동일 (3만원)',
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 2: 정원 마감
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 B코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '2 days') + TIME '14:00:00',
 6, 6, 25000, '정원 마감', false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 3: 대기자 있음
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 C코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '3 days') + TIME '18:00:00',
 6, 8, 27000, '인기 일정', false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 4: 공지 고정
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 종합코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '7 days') + TIME '09:00:00',
 16, 10, 40000, '🔥 주말 대규모 토너먼트', true, true, '게스트도 참가 가능합니다!',
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 5
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 D코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '4 days') + TIME '16:00:00',
 8, 4, 28000, NULL, false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 6
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 E코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '5 days') + TIME '10:00:00',
 10, 7, 32000, '주말 특별 경기', false, true, '게스트 환영',
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 7
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 A코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '8 days') + TIME '14:00:00',
 6, 3, 25000, NULL, false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 8
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 B코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '9 days') + TIME '18:00:00',
 8, 8, 30000, '정원 마감', false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 9
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 VIP코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '10 days') + TIME '11:00:00',
 4, 2, 50000, 'VIP 코트', false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 미래 10
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 '강남 C코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '12 days') + TIME '15:00:00',
 10, 9, 35000, NULL, false, false, NULL,
 false, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- ============================================
-- 참가자 데이터 생성 (schedule_participant)
-- ============================================

-- 과거 일정 참가자들 (CONFIRMED만)
DO $$
DECLARE
    schedule_ids BIGINT[];
    user_ids BIGINT[];
    i INT;
    j INT;
    participant_count INT;
BEGIN
    -- 과거 일정 ID 조회
    SELECT ARRAY_AGG(id ORDER BY scheduled_at)
    INTO schedule_ids
    FROM schedule
    WHERE club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
      AND scheduled_at < CURRENT_TIMESTAMP
    LIMIT 5;

    -- 테스트 사용자 ID 조회 (email 기준)
    SELECT ARRAY_AGG(id ORDER BY email)
    INTO user_ids
    FROM users
    WHERE email LIKE '%@openrun.test';

    -- 각 과거 일정에 참가자 추가
    FOR i IN 1..5 LOOP
        -- current_participants 수만큼 참가자 추가
        participant_count := CASE i
            WHEN 1 THEN 6
            WHEN 2 THEN 6
            WHEN 3 THEN 8
            WHEN 4 THEN 4
            WHEN 5 THEN 7
        END;

        FOR j IN 1..participant_count LOOP
            INSERT INTO schedule_participant (schedule_id, user_id, status, position, as_guest, joined_at)
            VALUES (
                schedule_ids[i],
                user_ids[((i - 1 + j - 1) % 10) + 1],
                'CONFIRMED',
                j,
                false,
                CURRENT_TIMESTAMP - INTERVAL '1 day' * (8 - i) - INTERVAL '1 hour' * j
            );
        END LOOP;
    END LOOP;
END $$;


-- 미래 일정 참가자들 (CONFIRMED + WAITING)
DO $$
DECLARE
    schedule_ids BIGINT[];
    user_ids BIGINT[];
    i INT;
    j INT;
    participant_count INT;
    max_cap INT;
    confirmed_count INT;
    status_val VARCHAR(20);
BEGIN
    -- 미래 일정 ID 조회
    SELECT ARRAY_AGG(id ORDER BY scheduled_at)
    INTO schedule_ids
    FROM schedule
    WHERE club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
      AND scheduled_at >= CURRENT_TIMESTAMP
    LIMIT 10;

    -- 테스트 사용자 ID 조회 (email 기준)
    SELECT ARRAY_AGG(id ORDER BY email)
    INTO user_ids
    FROM users
    WHERE email LIKE '%@openrun.test';

    -- 미래 일정별 참가자 수 정의
    FOR i IN 1..10 LOOP
        -- (current_participants, max_capacity) 쌍
        participant_count := CASE i
            WHEN 1 THEN 5   -- max=8
            WHEN 2 THEN 6   -- max=6 (정원)
            WHEN 3 THEN 8   -- max=6 (대기 2명)
            WHEN 4 THEN 10  -- max=16
            WHEN 5 THEN 4   -- max=8
            WHEN 6 THEN 7   -- max=10
            WHEN 7 THEN 3   -- max=6
            WHEN 8 THEN 8   -- max=8 (정원)
            WHEN 9 THEN 2   -- max=4
            WHEN 10 THEN 9  -- max=10
        END;

        max_cap := CASE i
            WHEN 1 THEN 8
            WHEN 2 THEN 6
            WHEN 3 THEN 6
            WHEN 4 THEN 16
            WHEN 5 THEN 8
            WHEN 6 THEN 10
            WHEN 7 THEN 6
            WHEN 8 THEN 8
            WHEN 9 THEN 4
            WHEN 10 THEN 10
        END;

        confirmed_count := LEAST(participant_count, max_cap);

        FOR j IN 1..participant_count LOOP
            status_val := CASE WHEN j <= confirmed_count THEN 'CONFIRMED' ELSE 'WAITING' END;

            INSERT INTO schedule_participant (schedule_id, user_id, status, position, as_guest, joined_at)
            VALUES (
                schedule_ids[i],
                user_ids[((i - 1 + j - 1) % 10) + 1],
                status_val,
                j,
                false,
                CURRENT_TIMESTAMP - INTERVAL '1 hour' * (11 - j)
            );
        END LOOP;
    END LOOP;
END $$;


-- 결과 확인
SELECT '✅ 일정 15개 및 참가자 생성 완료' AS status;
SELECT
    s.id,
    s.court_name,
    s.scheduled_at,
    s.max_capacity,
    s.current_participants,
    COUNT(sp.id) AS actual_participants,
    s.guest_recruit_open,
    s.pinned
FROM schedule s
LEFT JOIN schedule_participant sp ON s.id = sp.schedule_id
WHERE s.club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
GROUP BY s.id
ORDER BY s.scheduled_at;
-- ============================================
-- 05. 외부 요청 생성 (게스트 신청, 가입 신청)
-- ============================================
-- 주의: 이 스크립트는 개발 환경 전용입니다.

-- ============================================
-- GUEST 타입: 게스트 모집 참가 신청
-- ============================================

-- PENDING 상태 (승인 대기 중)
INSERT INTO external_request (club_id, schedule_id, requester_user_id, type, status, created_at, updated_at)
VALUES
-- testuser09가 클럽1의 미래 일정1에 게스트 신청 (PENDING)
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM schedule
  WHERE club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
    AND scheduled_at >= CURRENT_TIMESTAMP
    AND guest_recruit_open = true
  ORDER BY scheduled_at
  LIMIT 1),
 (SELECT id FROM users WHERE email = 'testuser09@openrun.test'),
 'GUEST',
 'PENDING',
 CURRENT_TIMESTAMP - INTERVAL '3 hours',
 CURRENT_TIMESTAMP - INTERVAL '3 hours'),

-- testuser10이 클럽1의 미래 일정4에 게스트 신청 (PENDING)
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM schedule
  WHERE club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
    AND scheduled_at >= CURRENT_TIMESTAMP
    AND guest_recruit_open = true
  ORDER BY scheduled_at
  OFFSET 1
  LIMIT 1),
 (SELECT id FROM users WHERE email = 'testuser10@openrun.test'),
 'GUEST',
 'PENDING',
 CURRENT_TIMESTAMP - INTERVAL '5 hours',
 CURRENT_TIMESTAMP - INTERVAL '5 hours');


-- APPROVED 상태 (승인됨)
INSERT INTO external_request (
    club_id, schedule_id, requester_user_id, type, status,
    decided_by_user_id, decided_at, decision_note,
    created_at, updated_at
)
VALUES
-- testuser04가 클럽1의 미래 일정6에 게스트 신청 → 승인됨
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT s.id FROM schedule s
  WHERE s.club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
    AND s.scheduled_at >= CURRENT_TIMESTAMP
    AND s.guest_recruit_open = true
  ORDER BY s.scheduled_at
  OFFSET 2
  LIMIT 1),
 (SELECT id FROM users WHERE email = 'testuser04@openrun.test'),
 'GUEST',
 'APPROVED',
 (SELECT id FROM users WHERE email = 'testuser01@openrun.test'),  -- OWNER가 승인
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 '게스트 참가 승인합니다',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day');


-- REJECTED 상태 (거절됨)
INSERT INTO external_request (
    club_id, schedule_id, requester_user_id, type, status,
    decided_by_user_id, decided_at, decision_note,
    created_at, updated_at
)
VALUES
-- testuser08이 클럽1의 미래 일정1에 게스트 신청 → 거절됨
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 (SELECT id FROM schedule
  WHERE club_id = (SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽')
    AND scheduled_at >= CURRENT_TIMESTAMP
    AND guest_recruit_open = true
  ORDER BY scheduled_at
  LIMIT 1),
 (SELECT id FROM users WHERE email = 'testuser08@openrun.test'),
 'GUEST',
 'REJECTED',
 (SELECT id FROM users WHERE email = 'testuser02@openrun.test'),  -- ADMIN이 거절
 CURRENT_TIMESTAMP - INTERVAL '6 hours',
 '죄송합니다. 이미 정원이 거의 찼습니다.',
 CURRENT_TIMESTAMP - INTERVAL '12 hours',
 CURRENT_TIMESTAMP - INTERVAL '6 hours');


-- ============================================
-- JOIN 타입: 클럽 가입 신청
-- ============================================

-- PENDING 상태 (승인 대기 중)
INSERT INTO external_request (club_id, schedule_id, requester_user_id, type, status, created_at, updated_at)
VALUES
-- testuser09가 클럽1에 가입 신청 (이미 위에서 추가됨 - club_member에 PENDING)
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 NULL,  -- JOIN 타입은 schedule_id가 NULL
 (SELECT id FROM users WHERE email = 'testuser09@openrun.test'),
 'JOIN',
 'PENDING',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- testuser10이 클럽2에 가입 신청
((SELECT id FROM club WHERE name = '테스트 부산 코트 클럽'),
 NULL,
 (SELECT id FROM users WHERE email = 'testuser10@openrun.test'),
 'JOIN',
 'PENDING',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- testuser01이 클럽3에 가입 신청
((SELECT id FROM club WHERE name = '테스트 인천 주말 클럽'),
 NULL,
 (SELECT id FROM users WHERE email = 'testuser01@openrun.test'),
 'JOIN',
 'PENDING',
 CURRENT_TIMESTAMP - INTERVAL '5 hours',
 CURRENT_TIMESTAMP - INTERVAL '5 hours');


-- APPROVED 상태 (승인됨 - 이미 club_member에 ACTIVE로 추가된 케이스)
-- 과거에 가입 신청 → 승인된 기록
INSERT INTO external_request (
    club_id, schedule_id, requester_user_id, type, status,
    decided_by_user_id, decided_at, decision_note,
    created_at, updated_at
)
VALUES
((SELECT id FROM club WHERE name = '테스트 강남 테니스 클럽'),
 NULL,
 (SELECT id FROM users WHERE email = 'testuser07@openrun.test'),
 'JOIN',
 'APPROVED',
 (SELECT id FROM users WHERE email = 'testuser01@openrun.test'),
 CURRENT_TIMESTAMP - INTERVAL '29 days',
 '가입을 환영합니다!',
 CURRENT_TIMESTAMP - INTERVAL '30 days',
 CURRENT_TIMESTAMP - INTERVAL '29 days');


-- REJECTED 상태 (거절됨)
INSERT INTO external_request (
    club_id, schedule_id, requester_user_id, type, status,
    decided_by_user_id, decided_at, decision_note,
    created_at, updated_at
)
VALUES
((SELECT id FROM club WHERE name = '테스트 경기 프로 클럽'),
 NULL,
 (SELECT id FROM users WHERE email = 'testuser09@openrun.test'),
 'JOIN',
 'REJECTED',
 (SELECT id FROM users WHERE email = 'testuser10@openrun.test'),
 CURRENT_TIMESTAMP - INTERVAL '10 days',
 '죄송합니다. NTRP 4.0 이상만 가입 가능합니다.',
 CURRENT_TIMESTAMP - INTERVAL '15 days',
 CURRENT_TIMESTAMP - INTERVAL '10 days');


-- 결과 확인
SELECT '✅ 외부 요청 (게스트/가입 신청) 생성 완료' AS status;
SELECT
    er.id,
    er.type,
    er.status,
    c.name AS club_name,
    u.name AS requester_name,
    s.court_name AS schedule_court,
    s.scheduled_at AS schedule_time,
    er.created_at
FROM external_request er
JOIN club c ON er.club_id = c.id
JOIN users u ON er.requester_user_id = u.id
LEFT JOIN schedule s ON er.schedule_id = s.id
WHERE c.name LIKE '테스트%'
ORDER BY er.type, er.status, er.created_at DESC;
