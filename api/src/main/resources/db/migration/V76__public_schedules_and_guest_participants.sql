-- V76: 공개일정 + 게스트 참가자 지원
-- 설계 문서: docs/side-projects/openrun/decisions/open-schedule-design.md

-- 1. schedule: club_id nullable (공개일정은 club_id = null)
ALTER TABLE schedule ALTER COLUMN club_id DROP NOT NULL;

-- 2. schedule: 공개일정용 추가 필드
ALTER TABLE schedule ADD COLUMN court_address VARCHAR(200);
ALTER TABLE schedule ADD COLUMN region VARCHAR(50);
ALTER TABLE schedule ADD COLUMN created_by_user_id BIGINT REFERENCES users(id);

-- 3. schedule_participant: user_id nullable + guest_name (게스트 참가자)
ALTER TABLE schedule_participant ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE schedule_participant ADD COLUMN guest_name VARCHAR(50);

-- 4. match: guest_name 컬럼 4개 (게스트 포함 대진 저장)
ALTER TABLE match ADD COLUMN team_a_player1_guest_name VARCHAR(50);
ALTER TABLE match ADD COLUMN team_a_player2_guest_name VARCHAR(50);
ALTER TABLE match ADD COLUMN team_b_player1_guest_name VARCHAR(50);
ALTER TABLE match ADD COLUMN team_b_player2_guest_name VARCHAR(50);

-- 5. users: nickname (공개 맥락 표시명)
ALTER TABLE users ADD COLUMN nickname VARCHAR(30);

-- 6. 인덱스
CREATE INDEX idx_schedule_region ON schedule(region);
CREATE INDEX idx_schedule_public ON schedule(scheduled_at) WHERE club_id IS NULL;
