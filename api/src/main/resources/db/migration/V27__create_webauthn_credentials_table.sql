-- WebAuthn 인증 정보 테이블 생성
CREATE TABLE webauthn_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(1024) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    sign_count BIGINT NOT NULL DEFAULT 0,
    aaguid VARCHAR(36),
    transports VARCHAR(255),
    device_name VARCHAR(100),
    credential_type VARCHAR(50) NOT NULL DEFAULT 'public-key',
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE UNIQUE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- 코멘트 추가
COMMENT ON TABLE webauthn_credentials IS 'WebAuthn 생체인증 정보 (Face ID, Touch ID 등)';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'WebAuthn Credential ID (Base64URL encoded)';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Public Key for signature verification (Base64URL encoded)';
COMMENT ON COLUMN webauthn_credentials.sign_count IS 'Signature counter for replay attack prevention';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation GUID';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Comma-separated list of transports (usb,nfc,ble,internal)';
COMMENT ON COLUMN webauthn_credentials.device_name IS 'User-defined device name (e.g., iPhone 15 Pro)';
COMMENT ON COLUMN webauthn_credentials.last_used_at IS 'Last successful authentication timestamp';
