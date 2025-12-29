-- 테스트 참가신청 데이터 생성 (개발 환경용)
-- V8에서 생성한 users(1-10)와 schedules(1-15)를 연결

-- ============================================
-- 과거 일정 참가자 데이터 (이미 완료된 경기)
-- ============================================

-- Schedule 1: 골드 1번 코트 (max 8, current 6 → CONFIRMED 6명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(1, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '7 days 2 hours'),
(1, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '7 days 1 hour'),
(1, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '6 days 23 hours'),
(1, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '6 days 22 hours'),
(1, 5, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '6 days 20 hours'),
(1, 6, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '6 days 18 hours');

-- Schedule 2: 골드 2번 코트 (max 6, current 6 → CONFIRMED 6명, 정원 마감)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(2, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '6 days 3 hours'),
(2, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '6 days 2 hours'),
(2, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '6 days 1 hour'),
(2, 7, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(2, 8, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '5 days 23 hours'),
(2, 9, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '5 days 22 hours');

-- Schedule 3: 실버 A코트 (max 8, current 4 → CONFIRMED 4명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(3, 4, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '5 days 4 hours'),
(3, 5, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '5 days 3 hours'),
(3, 6, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '5 days 2 hours'),
(3, 7, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '5 days 1 hour');

-- Schedule 4: 실버 B코트 (max 10, current 10 → CONFIRMED 10명, 정원 마감)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(4, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '4 days 5 hours'),
(4, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '4 days 4 hours'),
(4, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '4 days 3 hours'),
(4, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '4 days 2 hours'),
(4, 5, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '4 days 1 hour'),
(4, 6, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(4, 7, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '3 days 23 hours'),
(4, 8, 'CONFIRMED', 8, CURRENT_TIMESTAMP - INTERVAL '3 days 22 hours'),
(4, 9, 'CONFIRMED', 9, CURRENT_TIMESTAMP - INTERVAL '3 days 21 hours'),
(4, 10, 'CONFIRMED', 10, CURRENT_TIMESTAMP - INTERVAL '3 days 20 hours');

-- Schedule 5: 브론즈 1번 코트 (max 6, current 5 → CONFIRMED 5명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(5, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '3 days 4 hours'),
(5, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '3 days 3 hours'),
(5, 8, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '3 days 2 hours'),
(5, 9, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '3 days 1 hour'),
(5, 10, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- ============================================
-- 미래 일정 참가자 데이터 (진행 중인 모집)
-- ============================================

-- Schedule 6: 골드 1번 코트 (max 8, current 6 → CONFIRMED 6명, 정원-2)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(6, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(6, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(6, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(6, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(6, 5, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(6, 6, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '5 hours');

-- Schedule 7: 골드 2번 코트 (max 6, current 7 → CONFIRMED 6명 + WAITING 1명, 정원 초과)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(7, 4, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(7, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(7, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(7, 7, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(7, 8, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(7, 9, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(7, 10, 'WAITING', 7, CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Schedule 8: 골드 3번 코트 (max 8, current 8 → CONFIRMED 8명, 정원 마감)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(8, 4, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
(8, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '13 hours'),
(8, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(8, 5, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(8, 6, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(8, 7, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(8, 8, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(8, 9, 'CONFIRMED', 8, CURRENT_TIMESTAMP - INTERVAL '7 hours');

-- Schedule 9: 실버 A코트 (max 8, current 9 → CONFIRMED 8명 + WAITING 1명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(9, 4, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '16 hours'),
(9, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '15 hours'),
(9, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
(9, 5, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '13 hours'),
(9, 6, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(9, 7, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(9, 8, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(9, 9, 'CONFIRMED', 8, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(9, 10, 'WAITING', 9, CURRENT_TIMESTAMP - INTERVAL '8 hours');

-- Schedule 10: 실버 B코트 (max 10, current 10 → CONFIRMED 10명, 정원 마감)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(10, 4, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
(10, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '17 hours'),
(10, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '16 hours'),
(10, 5, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '15 hours'),
(10, 6, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
(10, 7, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '13 hours'),
(10, 8, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(10, 9, 'CONFIRMED', 8, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(10, 10, 'CONFIRMED', 9, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(10, 1, 'CONFIRMED', 10, CURRENT_TIMESTAMP - INTERVAL '9 hours');

-- Schedule 11: 실버 C코트 (max 6, current 8 → CONFIRMED 6명 + WAITING 2명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(11, 5, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '20 hours'),
(11, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '19 hours'),
(11, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
(11, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '17 hours'),
(11, 6, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '16 hours'),
(11, 7, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '15 hours'),
(11, 8, 'WAITING', 7, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
(11, 9, 'WAITING', 8, CURRENT_TIMESTAMP - INTERVAL '13 hours');

-- Schedule 12: 브론즈 1번 코트 (max 6, current 5 → CONFIRMED 5명, 정원-1)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(12, 5, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(12, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(12, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(12, 9, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(12, 10, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Schedule 13: 브론즈 2번 코트 (max 8, current 7 → CONFIRMED 7명, 정원-1)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(13, 6, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(13, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(13, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(13, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(13, 5, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(13, 7, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(13, 8, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Schedule 14: 브론즈 3번 코트 (max 10, current 9 → CONFIRMED 9명, 정원-1)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(14, 7, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
(14, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '13 hours'),
(14, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(14, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
(14, 5, 'CONFIRMED', 5, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(14, 6, 'CONFIRMED', 6, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(14, 8, 'CONFIRMED', 7, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(14, 9, 'CONFIRMED', 8, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(14, 10, 'CONFIRMED', 9, CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Schedule 15: 골드 VIP 코트 (max 4, current 0 → CONFIRMED 4명, WAITING 3명 추가!)
-- 정원 마감 + 대기자 시나리오
-- 먼저 정원까지 채우기
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(15, 8, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(15, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(15, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(15, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
-- 정원 초과로 대기 상태
(15, 5, 'WAITING', 5, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(15, 6, 'WAITING', 6, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(15, 7, 'WAITING', 7, CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- ============================================
-- 주석: 총 참가신청 데이터 (current_participants)
-- ============================================
-- current_participants = CONFIRMED + WAITING (CANCELLED 제외)
--
-- 과거 일정:
-- Schedule 1: 6명 (CONFIRMED 6)
-- Schedule 2: 6명 (CONFIRMED 6, 정원 마감)
-- Schedule 3: 4명 (CONFIRMED 4)
-- Schedule 4: 10명 (CONFIRMED 10, 정원 마감)
-- Schedule 5: 5명 (CONFIRMED 5)
--
-- 미래 일정 (다양한 케이스):
-- Schedule 6: 6명 (max 8, CONFIRMED 6, 정원-2)
-- Schedule 7: 7명 (max 6, CONFIRMED 6 + WAITING 1, 정원+1)
-- Schedule 8: 8명 (max 8, CONFIRMED 8, 정원 마감)
-- Schedule 9: 9명 (max 8, CONFIRMED 8 + WAITING 1, 정원+1)
-- Schedule 10: 10명 (max 10, CONFIRMED 10, 정원 마감)
-- Schedule 11: 8명 (max 6, CONFIRMED 6 + WAITING 2, 정원+2)
-- Schedule 12: 5명 (max 6, CONFIRMED 5, 정원-1)
-- Schedule 13: 7명 (max 8, CONFIRMED 7, 정원-1)
-- Schedule 14: 9명 (max 10, CONFIRMED 9, 정원-1)
-- Schedule 15: 7명 (max 4, CONFIRMED 4 + WAITING 3, 정원+3)
