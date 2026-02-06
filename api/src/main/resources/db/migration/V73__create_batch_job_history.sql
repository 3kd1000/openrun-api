-- 배치 작업 실행 이력 테이블
CREATE TABLE batch_job_history (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,           -- 작업 이름 (AUDIT_LOG_CLEANUP, SCHEDULE_MAINTENANCE 등)
    status VARCHAR(20) NOT NULL,               -- 실행 상태 (SUCCESS, FAILED, RUNNING)
    started_at TIMESTAMP NOT NULL,             -- 시작 시각
    finished_at TIMESTAMP,                     -- 종료 시각
    duration_ms BIGINT,                        -- 실행 시간 (밀리초)
    result_summary TEXT,                       -- 결과 요약 (JSON 형태)
    error_message TEXT,                        -- 에러 메시지 (실패 시)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 조회 성능을 위한 인덱스
CREATE INDEX idx_batch_job_history_job_name ON batch_job_history(job_name);
CREATE INDEX idx_batch_job_history_started_at ON batch_job_history(started_at DESC);
CREATE INDEX idx_batch_job_history_status ON batch_job_history(status);

COMMENT ON TABLE batch_job_history IS '배치 작업 실행 이력';
COMMENT ON COLUMN batch_job_history.job_name IS '작업 이름';
COMMENT ON COLUMN batch_job_history.status IS '실행 상태 (SUCCESS, FAILED, RUNNING)';
COMMENT ON COLUMN batch_job_history.result_summary IS '결과 요약 (JSON)';
