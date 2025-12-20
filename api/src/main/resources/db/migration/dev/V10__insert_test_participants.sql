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

-- Schedule 6: 골드 1번 코트 (max 8, current 2 → CONFIRMED 2명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(6, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(6, 3, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Schedule 7: 골드 2번 코트 (max 6, current 0 → 참가자 없음)
-- 참가자 없음

-- Schedule 8: 골드 3번 코트 (max 8, current 1 → CONFIRMED 1명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(8, 5, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- Schedule 9: 실버 A코트 (max 8, current 3 → CONFIRMED 3명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(9, 2, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(9, 4, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(9, 6, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- Schedule 10: 실버 B코트 (max 10, current 0 → 참가자 없음)
-- 참가자 없음

-- Schedule 11: 실버 C코트 (max 6, current 2 → CONFIRMED 2명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(11, 7, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(11, 8, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- Schedule 12: 브론즈 1번 코트 (max 6, current 1 → CONFIRMED 1명)
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(12, 9, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Schedule 13: 브론즈 2번 코트 (max 8, current 4 → CONFIRMED 4명, WAITING 2명 추가!)
-- 정원 미만이지만 대기자 테스트를 위해 추가
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(13, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(13, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
(13, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(13, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '5 hours');

-- Schedule 14: 브론즈 3번 코트 (max 10, current 0 → 참가자 없음)
-- 참가자 없음

-- Schedule 15: 골드 VIP 코트 (max 4, current 0 → CONFIRMED 4명, WAITING 3명 추가!)
-- 정원 마감 + 대기자 시나리오
-- 먼저 정원까지 채우기
INSERT INTO schedule_participant (schedule_id, user_id, status, position, joined_at) VALUES
(15, 1, 'CONFIRMED', 1, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
(15, 2, 'CONFIRMED', 2, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
(15, 3, 'CONFIRMED', 3, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(15, 4, 'CONFIRMED', 4, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
-- 정원 초과로 대기 상태
(15, 5, 'WAITING', 5, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(15, 6, 'WAITING', 6, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(15, 7, 'WAITING', 7, CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- ============================================
-- Schedule 15의 current_participants 업데이트
-- ============================================
-- V8에서 0으로 설정되어 있었는데, 실제로는 4명이 확정되어 있음
UPDATE schedule SET current_participants = 4 WHERE id = 15;

-- ============================================
-- 주석: 총 참가신청 데이터
-- ============================================
-- Schedule 1: 6명 (CONFIRMED)
-- Schedule 2: 6명 (CONFIRMED, 정원 마감)
-- Schedule 3: 4명 (CONFIRMED)
-- Schedule 4: 10명 (CONFIRMED, 정원 마감)
-- Schedule 5: 5명 (CONFIRMED)
-- Schedule 6: 2명 (CONFIRMED)
-- Schedule 7: 0명
-- Schedule 8: 1명 (CONFIRMED)
-- Schedule 9: 3명 (CONFIRMED)
-- Schedule 10: 0명
-- Schedule 11: 2명 (CONFIRMED)
-- Schedule 12: 1명 (CONFIRMED)
-- Schedule 13: 4명 (CONFIRMED)
-- Schedule 14: 0명
-- Schedule 15: 4명 CONFIRMED + 3명 WAITING (정원 마감 + 대기열)
