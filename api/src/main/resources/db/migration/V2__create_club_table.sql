CREATE TABLE club (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    region VARCHAR(255),
    owner_user_id BIGINT NOT NULL, -- 추후 user 테이블과 foreign key 연결 필요
    deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Soft delete 플래그
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_club_owner_user_id ON club(owner_user_id);
CREATE INDEX idx_club_region ON club(region);

COMMENT ON TABLE club IS '클럽 정보를 저장하는 테이블';
COMMENT ON COLUMN club.id IS '클럽 ID';
COMMENT ON COLUMN club.name IS '클럽 이름';
COMMENT ON COLUMN club.description IS '클럽 설명';
COMMENT ON COLUMN club.region IS '활동 지역';
COMMENT ON COLUMN club.owner_user_id IS '클럽 생성자(소유자)의 유저 ID';
COMMENT ON COLUMN club.deleted IS '삭제 여부 (true: 삭제됨)';
COMMENT ON COLUMN club.created_at IS '생성 시각';
COMMENT ON COLUMN club.updated_at IS '수정 시각';
