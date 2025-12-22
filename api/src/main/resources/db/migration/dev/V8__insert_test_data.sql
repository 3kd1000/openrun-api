-- 테스트 데이터 생성 (개발 환경용)

-- 1. Users 테이블에 10명의 사용자 추가
INSERT INTO users (uid, social_id, email, name, deleted, created_at, updated_at) VALUES
('test-uid-a', 'test-social-a', 'a@test.com', '정주상', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-b', 'test-social-b', 'b@test.com', '최승연', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-c', 'test-social-c', 'c@test.com', '김영준', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-d', 'test-social-d', 'd@test.com', '서영재', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-e', 'test-social-e', 'e@test.com', '권종근', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-f', 'test-social-f', 'f@test.com', '송명우', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-g', 'test-social-g', 'g@test.com', '김형준', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-h', 'test-social-h', 'h@test.com', '안현우', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-i', 'test-social-i', 'i@test.com', '김민표', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test-uid-j', 'test-social-j', 'j@test.com', '장석원', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Clubs 테이블에 3개의 클럽 추가
INSERT INTO club (name, description, region, owner_user_id, deleted, created_at, updated_at) VALUES
('테니스클럽A', '서울 강남 지역 테니스 클럽', '서울 강남구', 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('테니스클럽B', '서울 강북 지역 테니스 클럽', '서울 강북구', 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('테니스클럽C', '경기 성남 지역 테니스 클럽', '경기 성남시', 3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Schedule 테이블에 테스트 일정 추가 (과거 5개, 미래 10개)
-- 과거 일정 (지난 주) - 정시 고정: 08시, 10시, 14시, 18시
INSERT INTO schedule (club_id, court_name, scheduled_at, max_capacity, current_participants, cost, description, created_at, updated_at) VALUES
(1, '골드 1번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '7 days') + TIME '08:00:00', 8, 6, 25000, '지난주 경기', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(1, '골드 2번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '6 days') + TIME '10:00:00', 6, 6, 20000, NULL, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(2, '실버 A코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '5 days') + TIME '14:00:00', 8, 4, 22000, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(2, '실버 B코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '4 days') + TIME '10:00:00', 10, 10, 30000, '주말 특별 경기', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(3, '브론즈 1번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP - INTERVAL '3 days') + TIME '18:00:00', 6, 5, 18000, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 미래 일정 (이번 주 ~ 다음 주) - 정시 고정: 06시, 08시, 10시, 14시, 18시
-- current_participants는 V10에서 실제 참가자 추가 후 업데이트됨
INSERT INTO schedule (club_id, court_name, scheduled_at, max_capacity, current_participants, cost, description, created_at, updated_at) VALUES
(1, '골드 1번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '1 day') + TIME '08:00:00', 8, 6, 25000, '주중 경기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, '골드 2번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '2 days') + TIME '10:00:00', 6, 7, 20000, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, '골드 3번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '3 days') + TIME '18:00:00', 8, 8, 25000, '수요일 저녁 경기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '실버 A코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '4 days') + TIME '14:00:00', 8, 9, 22000, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '실버 B코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '5 days') + TIME '10:00:00', 10, 10, 30000, '주말 특별 경기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '실버 C코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '6 days') + TIME '08:00:00', 6, 8, 20000, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '브론즈 1번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '7 days') + TIME '08:00:00', 6, 5, 18000, '다음주 월요일', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '브론즈 2번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '8 days') + TIME '14:00:00', 8, 7, 22000, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '브론즈 3번 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '9 days') + TIME '10:00:00', 10, 9, 28000, '다음주 주말 경기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, '골드 VIP 코트', DATE_TRUNC('day', CURRENT_TIMESTAMP + INTERVAL '10 days') + TIME '06:00:00', 4, 7, 50000, 'VIP 프라이빗 경기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMENT ON COLUMN schedule.id IS 'V8 마이그레이션에서 테스트 데이터 15개 생성';
