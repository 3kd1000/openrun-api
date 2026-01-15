-- V43: Create external_request table (외부 요청 공통 인박스)
-- - JOIN: 클럽 가입 요청
-- - GUEST: 게스트 모집 참가 요청(일정 기반)
-- - INTERCLUB: 교류전 요청(일정 기반, MVP)

CREATE TABLE external_request (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
    schedule_id BIGINT NULL REFERENCES schedule(id) ON DELETE SET NULL,
    requester_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id BIGINT NULL REFERENCES posts(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    decided_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMP WITH TIME ZONE NULL,
    decision_note TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_external_request_club_status ON external_request(club_id, status);
CREATE INDEX idx_external_request_club_type ON external_request(club_id, type);
CREATE INDEX idx_external_request_requester ON external_request(requester_user_id);
CREATE INDEX idx_external_request_post ON external_request(post_id);
CREATE INDEX idx_external_request_schedule ON external_request(schedule_id);

-- 일정 기반 요청은 동일 사용자/일정/타입에 대해 1건만 (중복 신청 방지)
CREATE UNIQUE INDEX ux_external_request_schedule_type_requester
    ON external_request (schedule_id, type, requester_user_id)
    WHERE schedule_id IS NOT NULL;

