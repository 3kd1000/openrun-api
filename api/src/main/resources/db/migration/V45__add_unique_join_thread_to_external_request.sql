-- JOIN(가입 문의/요청): club 단위로 1 사용자 1 스레드(외부요청 row) 유지
-- schedule_id가 NULL인 JOIN 요청에 대해서만 유니크를 건다.
CREATE UNIQUE INDEX IF NOT EXISTS ux_external_request_join_thread
    ON external_request (club_id, type, requester_user_id)
    WHERE schedule_id IS NULL AND type = 'JOIN';

