-- 회원 탈퇴 시 경기 기록 익명화를 위해 player_id를 nullable로 변경

-- match 테이블의 필수 player_id 컬럼을 nullable로 변경
ALTER TABLE match ALTER COLUMN team_a_player1_id DROP NOT NULL;
ALTER TABLE match ALTER COLUMN team_b_player1_id DROP NOT NULL;

-- schedule_participant 테이블의 user_id를 nullable로 변경
ALTER TABLE schedule_participant ALTER COLUMN user_id DROP NOT NULL;

-- external_request 테이블의 requester_user_id를 nullable로 변경
ALTER TABLE external_request ALTER COLUMN requester_user_id DROP NOT NULL;

-- award_winner 테이블의 user_id를 nullable로 변경
ALTER TABLE award_winner ALTER COLUMN user_id DROP NOT NULL;

-- posts 테이블의 author_id를 nullable로 변경 (존재하는 경우)
ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;

-- comments 테이블의 author_id를 nullable로 변경 (존재하는 경우)
ALTER TABLE comments ALTER COLUMN author_id DROP NOT NULL;

-- user_statistics 테이블의 user_id는 PK와 관련이 있으므로 건드리지 않음
-- 탈퇴 시 통계 레코드 자체를 삭제
