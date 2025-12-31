-- V20: user_oauth_providers 테이블 생성 (OAuth 제공자별 정보 저장)
-- 목적: Google, Kakao, Naver 등 여러 OAuth 제공자를 하나의 User 계정에 연결
-- 작성일: 2024-12-24

CREATE TABLE user_oauth_providers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_uid VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_user_oauth_provider_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Unique Constraints
    CONSTRAINT uk_provider_uid
        UNIQUE (provider, provider_uid),
    CONSTRAINT uk_user_provider
        UNIQUE (user_id, provider)
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_user_oauth_providers_provider ON user_oauth_providers(provider);

-- 주석 추가
COMMENT ON TABLE user_oauth_providers IS 'OAuth 제공자별 인증 정보 저장';
COMMENT ON COLUMN user_oauth_providers.provider IS 'OAuth 제공자: GOOGLE, KAKAO, NAVER 등';
COMMENT ON COLUMN user_oauth_providers.provider_uid IS 'OAuth 제공자에서 발급한 고유 ID (Firebase UID 또는 Social ID)';
