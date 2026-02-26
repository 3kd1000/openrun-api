-- 공개일정(clubId=null)의 audit log 지원을 위해 club_id NOT NULL 제약 제거
ALTER TABLE audit_log ALTER COLUMN club_id DROP NOT NULL;
