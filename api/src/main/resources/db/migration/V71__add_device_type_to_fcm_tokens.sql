-- FCM 토큰에 디바이스 타입 추가 (모바일/데스크톱)
-- 같은 사용자 + 디바이스 타입당 하나의 토큰만 유지하기 위함

ALTER TABLE fcm_device_tokens ADD COLUMN device_type VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN';

-- 기존 데이터를 device_info 기반으로 추정하여 업데이트
UPDATE fcm_device_tokens
SET device_type = CASE
    WHEN device_info ILIKE '%iPhone%' OR device_info ILIKE '%iPad%'
         OR device_info ILIKE '%Android%' OR device_info ILIKE '%Mobile%'
    THEN 'MOBILE'
    ELSE 'DESKTOP'
END
WHERE device_type = 'UNKNOWN';

-- 인덱스 추가: 사용자+디바이스타입으로 빠른 조회
CREATE INDEX idx_fcm_device_tokens_user_device_type ON fcm_device_tokens(user_id, device_type);
