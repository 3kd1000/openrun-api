-- 사용자별 알림 카테고리 설정 테이블
CREATE TABLE user_notification_setting (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    noti_schedule BOOLEAN NOT NULL DEFAULT TRUE,
    noti_club BOOLEAN NOT NULL DEFAULT TRUE,
    noti_message BOOLEAN NOT NULL DEFAULT TRUE,
    noti_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_notification_setting_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_notification_setting_user_id ON user_notification_setting(user_id);
