import React, { useEffect, useState } from "react";
import { AppHeader } from "../../components/common/AppHeader";
import { Switch } from "@/components/ui/switch";
import {
  notificationSettingService,
  type NotificationSettings,
} from "../../services/notificationSettingService";
import { useNavigate } from "react-router-dom";

interface SettingItem {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}

const SETTING_ITEMS: SettingItem[] = [
  {
    key: "notiSchedule",
    label: "일정 알림",
    description: "일정 리마인드, 대진표, 참가 확정 알림",
  },
  {
    key: "notiClub",
    label: "클럽 알림",
    description: "가입 신청/승인/반려, 게스트 참가 신청 알림",
  },
  {
    key: "notiMessage",
    label: "메시지 알림",
    description: "새 메시지 수신 알림",
  },
];

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings>({
    notiSchedule: true,
    notiClub: true,
    notiMessage: true,
    notiSystem: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await notificationSettingService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("알림 설정 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    try {
      await notificationSettingService.updateSettings(updated);
    } catch (error) {
      console.error("알림 설정 변경 실패:", error);
      setSettings(settings);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="알림 설정" onBack={() => navigate(-1)} />
      <div className="max-w-[600px] mx-auto p-4">

      {isLoading ? (
        <div className="text-center p-5 text-muted-foreground text-sm">
          불러오는 중...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {SETTING_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 bg-background border border-border rounded-lg cursor-pointer transition-all hover:bg-muted"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-sm font-medium text-foreground">
                  {item.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
              />
            </label>
          ))}

          <p className="text-xs text-muted-foreground mt-3 px-1 leading-relaxed">
            알림을 끄면 해당 카테고리의 푸시 알림과 앱 내 알림이 모두 수신되지
            않습니다.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
