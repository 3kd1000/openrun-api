-- V17: match 테이블의 모든 ID 컬럼을 BIGINT로 변경
-- 이유: Entity에서 Long 타입을 사용하므로 DB도 BIGINT로 통일

-- 1. id 컬럼을 BIGSERIAL로 변경
ALTER TABLE match ALTER COLUMN id TYPE BIGINT;

-- 2. 외래키 컬럼들도 BIGINT로 변경
ALTER TABLE match ALTER COLUMN draw_id TYPE BIGINT;
ALTER TABLE match ALTER COLUMN team_a_player1_id TYPE BIGINT;
ALTER TABLE match ALTER COLUMN team_a_player2_id TYPE BIGINT;
ALTER TABLE match ALTER COLUMN team_b_player1_id TYPE BIGINT;
ALTER TABLE match ALTER COLUMN team_b_player2_id TYPE BIGINT;

-- 3. 추가된 컬럼들도 BIGINT로 변경
ALTER TABLE match ALTER COLUMN club_id TYPE BIGINT;
ALTER TABLE match ALTER COLUMN schedule_id TYPE BIGINT;
