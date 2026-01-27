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
