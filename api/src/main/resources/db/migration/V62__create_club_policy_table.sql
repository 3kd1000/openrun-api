-- =====================================================
-- ClubPolicy 테이블 생성 및 기존 정책 데이터 마이그레이션
-- =====================================================

-- 1. club_policy 테이블 생성
CREATE TABLE club_policy (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL UNIQUE,

    -- 기존 정책 필드 (Club에서 이관)
    join_policy VARCHAR(20) NOT NULL DEFAULT 'APPROVAL',
    interclub_recruitment_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED',
    member_recruitment_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    member_recruitment_note TEXT,

    -- 어워드 정책 필드 (신규)
    award_period VARCHAR(20) NOT NULL DEFAULT 'HALF_YEAR',
    award_attendance_enabled BOOLEAN NOT NULL DEFAULT true,
    award_points_enabled BOOLEAN NOT NULL DEFAULT true,
    award_booking_enabled BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_club_policy_club FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE
);

CREATE INDEX idx_club_policy_club_id ON club_policy(club_id);

-- 2. 기존 club 데이터를 club_policy로 마이그레이션
INSERT INTO club_policy (
    club_id,
    join_policy,
    interclub_recruitment_status,
    member_recruitment_status,
    member_recruitment_note,
    created_at,
    updated_at
)
SELECT
    id,
    COALESCE(join_policy, 'APPROVAL'),
    COALESCE(interclub_recruitment_status, 'CLOSED'),
    COALESCE(member_recruitment_status, 'OPEN'),
    member_recruitment_note,
    NOW(),
    NOW()
FROM club
WHERE deleted = false;

-- 3. Club 테이블에서 정책 컬럼 삭제 (club_policy로 이관 완료)
ALTER TABLE club DROP COLUMN IF EXISTS join_policy;
ALTER TABLE club DROP COLUMN IF EXISTS interclub_recruitment_status;
ALTER TABLE club DROP COLUMN IF EXISTS member_recruitment_status;
ALTER TABLE club DROP COLUMN IF EXISTS member_recruitment_note;
