import React, { useEffect, useState } from "react";
import { AppHeader } from "../../components/common/AppHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  calendarService,
  type CalendarConnectionItem,
} from "../../services/calendarService";

const CalendarSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connections, setConnections] = useState<CalendarConnectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // OAuth callback 결과 처리
    if (searchParams.get("connected") === "true") {
      setMessage({ type: "success", text: "Google Calendar 연동이 완료되었습니다." });
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("error") === "true") {
      setMessage({ type: "error", text: "연동에 실패했습니다. 다시 시도해주세요." });
      setSearchParams({}, { replace: true });
    }
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await calendarService.getStatus();
      setConnections(data.connections);
    } catch (error) {
      console.error("캘린더 연동 상태 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const googleConnection = connections.find(
    (c) => c.provider === "GOOGLE" && c.active
  );

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await calendarService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Google 인증 URL 생성 실패:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (provider: "GOOGLE" | "KAKAO") => {
    if (!confirm("캘린더 연동을 해제하시겠습니까?\n동기화된 이벤트는 외부 캘린더에서 직접 삭제해야 합니다.")) {
      return;
    }
    try {
      await calendarService.disconnect(provider);
      setConnections((prev) => prev.filter((c) => !(c.provider === provider && c.active)));
    } catch (error) {
      console.error("캘린더 연동 해제 실패:", error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="외부 캘린더 연동" onBack={() => navigate(-1)} />
      <div className="max-w-[600px] mx-auto p-4">
        {isLoading ? (
          <div className="text-center p-5 text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {message.text}
              </div>
            )}

            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              외부 캘린더를 연동하면, 참가 확정된 일정이 자동으로 캘린더에
              추가됩니다.
            </p>

            {/* Google Calendar */}
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <path
                        d="M19.5 4h-3V2.5a.5.5 0 0 0-1 0V4h-7V2.5a.5.5 0 0 0-1 0V4h-3A1.5 1.5 0 0 0 3 5.5v14A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 19.5 4zM20 19.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V9h16v10.5z"
                        fill="#4285F4"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Google Calendar
                    </div>
                    {googleConnection ? (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {googleConnection.externalEmail || "연동됨"}
                        {googleConnection.tokenExpired && (
                          <span className="text-destructive ml-1">
                            (재인증 필요)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        연동되지 않음
                      </div>
                    )}
                  </div>
                </div>

                {googleConnection ? (
                  <div className="flex gap-2">
                    {googleConnection.tokenExpired && (
                      <button
                        onClick={handleGoogleConnect}
                        disabled={isConnecting}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        재연결
                      </button>
                    )}
                    <button
                      onClick={() => handleDisconnect("GOOGLE")}
                      className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted"
                    >
                      연동 해제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleConnect}
                    disabled={isConnecting}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isConnecting ? "연결 중..." : "연동하기"}
                  </button>
                )}
              </div>
            </div>

            {/* 안내 문구 */}
            <div className="text-xs text-muted-foreground px-1 leading-relaxed mt-1 flex flex-col gap-1">
              <p>• 일정 참가 확정 시 자동으로 캘린더에 추가됩니다.</p>
              <p>• 참가 취소 시 캘린더에서 자동으로 삭제됩니다.</p>
              <p>• 일정이 수정되면 캘린더 이벤트도 자동 업데이트됩니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSettingsPage;
