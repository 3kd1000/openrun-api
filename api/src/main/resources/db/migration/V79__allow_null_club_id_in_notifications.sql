-- 메시지 알림 등 클럽과 무관한 알림을 위해 club_id를 nullable로 변경
ALTER TABLE notifications ALTER COLUMN club_id DROP NOT NULL;
