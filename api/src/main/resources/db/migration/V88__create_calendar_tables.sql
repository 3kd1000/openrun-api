-- Calendar Connection: 사용자별 외부 캘린더 연동 정보
CREATE TABLE calendar_connection (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id),
    provider        VARCHAR(20)  NOT NULL,
    external_email  VARCHAR(255),
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMP,
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_calendar_connection_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_calendar_connection_user_id ON calendar_connection(user_id);

-- Calendar Event: 외부 캘린더에 동기화된 일정 매핑
CREATE TABLE calendar_event (
    id                      BIGSERIAL PRIMARY KEY,
    calendar_connection_id  BIGINT       NOT NULL REFERENCES calendar_connection(id) ON DELETE CASCADE,
    schedule_id             BIGINT       NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
    external_event_id       VARCHAR(255) NOT NULL,
    last_synced_at          TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_calendar_event_connection_schedule UNIQUE (calendar_connection_id, schedule_id)
);

CREATE INDEX idx_calendar_event_schedule_id ON calendar_event(schedule_id);
CREATE INDEX idx_calendar_event_connection_id ON calendar_event(calendar_connection_id);
