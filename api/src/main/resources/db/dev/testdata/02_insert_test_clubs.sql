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
