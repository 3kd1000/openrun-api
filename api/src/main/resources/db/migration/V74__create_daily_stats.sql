-- V74: 일별 통계 스냅샷 테이블
-- 매일 자정에 배치로 수집하여 저장

CREATE TABLE daily_stats (
    id BIGSERIAL PRIMARY KEY,
    record_date DATE NOT NULL UNIQUE,

    -- 누적 지표
    total_users BIGINT NOT NULL,          -- 총 사용자 수 (게스트 제외)
    total_clubs BIGINT NOT NULL,          -- 총 클럽 수

    -- 활성 사용자 지표
    dau BIGINT NOT NULL,                  -- Daily Active Users (당일 로그인)
    wau BIGINT NOT NULL,                  -- Weekly Active Users (7일 내 로그인)
    mau BIGINT NOT NULL,                  -- Monthly Active Users (30일 내 로그인)

    -- 신규 지표
    new_users BIGINT NOT NULL,            -- 당일 신규 가입자
    new_clubs BIGINT NOT NULL,            -- 당일 신규 클럽

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 날짜 기준 조회를 위한 인덱스
CREATE INDEX idx_daily_stats_record_date ON daily_stats(record_date DESC);

COMMENT ON TABLE daily_stats IS '일별 서비스 통계 스냅샷';
COMMENT ON COLUMN daily_stats.record_date IS '통계 기준 날짜';
COMMENT ON COLUMN daily_stats.total_users IS '해당일 기준 총 사용자 수 (게스트 제외)';
COMMENT ON COLUMN daily_stats.total_clubs IS '해당일 기준 총 클럽 수';
COMMENT ON COLUMN daily_stats.dau IS '해당일 로그인한 사용자 수';
COMMENT ON COLUMN daily_stats.wau IS '해당일 기준 최근 7일간 로그인한 사용자 수';
COMMENT ON COLUMN daily_stats.mau IS '해당일 기준 최근 30일간 로그인한 사용자 수';
COMMENT ON COLUMN daily_stats.new_users IS '해당일 신규 가입자 수';
COMMENT ON COLUMN daily_stats.new_clubs IS '해당일 신규 개설 클럽 수';
