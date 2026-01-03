-- club_member 테이블에 role 컬럼 추가
-- 기본값: MEMBER
-- 기존 데이터: 클럽 소유자는 OWNER, 나머지는 MEMBER

-- 1. role 컬럼 추가
ALTER TABLE club_member
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';

-- 2. 기존 데이터 마이그레이션: 클럽 소유자에게 OWNER 권한 부여
UPDATE club_member cm
SET role = 'OWNER'
FROM club c
WHERE cm.club_id = c.id
  AND cm.user_id = c.owner_user_id;

-- 3. role 컬럼에 인덱스 추가 (권한 체크 쿼리 성능 향상)
CREATE INDEX idx_club_member_role ON club_member(role);

-- 4. 복합 인덱스 추가 (club_id + role 조합 조회)
CREATE INDEX idx_club_member_club_role ON club_member(club_id, role);
