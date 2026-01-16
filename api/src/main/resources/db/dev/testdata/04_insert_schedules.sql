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
