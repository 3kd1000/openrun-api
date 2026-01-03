-- system_admins 테이블 생성
-- Super User 권한을 가진 사용자 관리 (현재는 1명만 존재)

CREATE TABLE system_admins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by_user_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_admin_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_granted_by_user
        FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 추가
CREATE INDEX idx_system_admins_user_id ON system_admins(user_id);

-- 코멘트 추가
COMMENT ON TABLE system_admins IS 'System Admin 권한을 가진 Super User 관리 테이블';
COMMENT ON COLUMN system_admins.user_id IS 'System Admin 권한을 가진 사용자 ID';
COMMENT ON COLUMN system_admins.granted_at IS 'System Admin 권한 부여 시각';
COMMENT ON COLUMN system_admins.granted_by_user_id IS 'System Admin 권한을 부여한 사용자 ID (최초 생성 시 NULL 가능)';
COMMENT ON COLUMN system_admins.notes IS 'System Admin 권한 부여 사유 또는 메모';
