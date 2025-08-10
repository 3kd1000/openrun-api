CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(100) NOT NULL,
    image_url TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_uid ON users(uid);

COMMENT ON TABLE users IS '사용자 정보를 저장하는 테이블';
COMMENT ON COLUMN users.id IS '서비스 내부 사용자 ID';
COMMENT ON COLUMN users.uid IS 'Firebase에서 발급한 고유 사용자 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일';
COMMENT ON COLUMN users.nickname IS '사용자 닉네임';
COMMENT ON COLUMN users.image_url IS '사용자 프로필 이미지 URL';
COMMENT ON COLUMN users.created_at IS '생성 시각';
COMMENT ON COLUMN users.updated_at IS '수정 시각';
