-- 사용자 테이블에 지역 정보 컬럼 추가 (시/도, 시/군/구)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS region_depth1 VARCHAR(20),
    ADD COLUMN IF NOT EXISTS region_depth2 VARCHAR(20);

-- 검색 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region_depth1, region_depth2);

COMMENT ON COLUMN users.region_depth1 IS '시/도 (예: 서울특별시, 경기도)';
COMMENT ON COLUMN users.region_depth2 IS '시/군/구 (예: 강남구, 수원시)';
