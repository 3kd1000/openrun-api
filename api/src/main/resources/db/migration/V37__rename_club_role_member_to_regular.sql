-- club_member.role: 기존 MEMBER -> REGULAR 로 표준화
-- 목적:
-- - 프론트/백엔드 공통 Role 체계를 4단계(OWNER/ADMIN/REGULAR/ASSOCIATE)로 정리
-- - "MEMBER" 매핑 로직 없이도 운영 가능하도록 DB 값을 선제 변환

-- 1) 기존 데이터 변환
UPDATE club_member
SET role = 'REGULAR'
WHERE role = 'MEMBER';

-- 2) 기본값 변경 (신규 가입/생성 시 기본 role)
ALTER TABLE club_member
ALTER COLUMN role SET DEFAULT 'REGULAR';

