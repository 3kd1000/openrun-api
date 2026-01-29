-- 사용자 생년월일 컬럼 추가

-- 생년월일 (암호화 저장, YYMMDD 형식)
ALTER TABLE users ADD COLUMN birth_date VARCHAR(255);

-- 생년월일 공개 범위 (기본: 비공개)
ALTER TABLE users ADD COLUMN birth_date_visibility VARCHAR(20) DEFAULT 'PRIVATE';

-- 인덱스 (공개 범위 조회용)
CREATE INDEX idx_users_birth_date_visibility ON users(birth_date_visibility);
