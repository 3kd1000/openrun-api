import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePwaInstall } from "../../contexts/PwaInstallContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { isAndroid, isIOS } from "../../utils/platformDetection";
import { isFcmSupported } from "../../services/fcmService";
import { setOpenRunUiSettings } from "../../utils/openrunUiSettings";
import { AppHeader } from "../../components/common/AppHeader";

/* ── 알림 목업 데이터 (실제 백엔드 발송 문구 기준) ── */
const NOTIFICATION_MOCKUPS = [
  {
    icon: "bell",
    label: "일정 리마인드",
    body: "내일 양재코트 일정이 있습니다 (14:00)",
    time: "방금 전",
    color: "bg-primary/15 text-primary",
  },
  {
    icon: "users",
    label: "가입 신청",
    body: "오픈런 테니스클럽에 새 가입 신청이 있습니다",
    time: "1시간 전",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: "confirm",
    label: "참가 확정",
    body: "양재코트 일정 대기상태에서 참가확정으로 변경되었습니다",
    time: "2시간 전",
    color: "bg-amber-100 text-amber-600",
  },
];



/* ── iOS 공유 아이콘 ── */
const IosShareIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

/* ── 진단 항목 ── */
const DiagnosticRow: React.FC<{
  label: string;
  status: "ok" | "warn" | "error";
  text: string;
}> = ({ label, status, text }) => {
  const icon = status === "ok" ? "\u2705" : status === "warn" ? "\u26A0\uFE0F" : "\u274C";
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{icon} {text}</span>
    </div>
  );
};

const InstallGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPwa, canInstallNatively, triggerInstall } = usePwaInstall();
  const { needsPermission, permissionRevoked, requestPushPermission } = useNotification();
  const { user } = useAuth();

  /* ── 목적지 (로그인 흐름에서 전달받음) ── */
  const state = location.state as { destination?: string } | null;

  const handleConfirm = () => {
    setOpenRunUiSettings({ startGuideSeen: true });
    if (state?.destination) {
      navigate(state.destination, { replace: true });
    } else {
      navigate(-1);
    }
  };

  /* ── 진단 정보 계산 ── */
  const deviceLabel = isAndroid() ? "Android" : isIOS() ? "iOS" : "데스크탑";

  const installStatus: "ok" | "warn" = isPwa ? "ok" : "warn";
  const installText = isPwa ? "설치 완료" : "미설치";

  const getNotificationStatus = (): { status: "ok" | "warn" | "error"; text: string } => {
    if (!user) return { status: "warn", text: "로그인 필요" };
    if (!isFcmSupported()) return { status: "warn", text: "미지원 브라우저" };
    if (permissionRevoked) return { status: "error", text: "권한 차단됨 (기기 설정에서 허용 필요)" };
    if (needsPermission) return { status: "warn", text: "미허용" };
    return { status: "ok", text: "허용됨" };
  };
  const notiInfo = getNotificationStatus();

  /* ── 진단 카드에서 보여줄 액션 버튼 ── */
  const showInstallButton = !isPwa && isAndroid() && canInstallNatively;
  const showPermissionButton = user && needsPermission && !permissionRevoked;

  return (
    <div className="flex flex-col min-h-screen bg-muted">
      <AppHeader
        title="시작 가이드"
        {...(!state?.destination && { onBack: () => navigate(-1) })}
      />

      <div className="flex-1 overflow-y-auto pb-24 max-w-[600px] mx-auto w-full">
        {/* Hero */}
        <div className="relative flex flex-col items-center justify-center pt-6 pb-4 px-6 text-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1.5">
              OpenRun을 100% 활용하세요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              앱 설치와 알림 설정으로<br />더 편하게 사용할 수 있어요
            </p>
          </div>
        </div>

        {/* 알림 목업 카드 */}
        <div className="px-4 mb-4">
          <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              알림으로 놓치지 마세요
            </h3>
            <div className="flex flex-col gap-1.5">
              {NOTIFICATION_MOCKUPS.map((mock, i) => (
                <div key={i} className="bg-muted/50 rounded-lg px-3 py-2">
                  {/* 헤더: 앱아이콘 + 앱이름 + 시간 */}
                  <div className="flex items-center gap-1.5">
                    <img src="/icon-512x512-v4.png" alt="" className="w-4 h-4 rounded" />
                    <span className="text-[10px] text-muted-foreground font-medium">OpenRun</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{mock.time}</span>
                  </div>
                  {/* 본문: 제목 + 내용 */}
                  <p className="text-[12px] font-semibold text-foreground leading-tight">{mock.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{mock.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Android 바로 설치 버튼 - canInstallNatively일 때만 */}
        {!isPwa && isAndroid() && canInstallNatively && (
          <div className="px-4 mb-3">
            <button
              onClick={() => triggerInstall()}
              className="w-full p-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-[0.98]"
            >
              바로 앱 설치하기
            </button>
          </div>
        )}

        {/* 설치 방법 - Android / iPhone 항상 표시 */}
        <div className="px-4 mb-3">
          <div className="bg-background rounded-xl border border-border p-4 shadow-sm">

            {/* Android */}
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </span>
              Android
              <span className="text-xs font-normal text-muted-foreground">(Chrome 브라우저 권장)</span>
            </h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">1</span>
                <p className="flex-1 text-sm text-foreground leading-relaxed">
                  Chrome 우측 상단의 <strong>⋮</strong> 메뉴를 탭하세요
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">2</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed mb-1">
                    <strong>'홈 화면에 추가'</strong>를 선택하세요
                  </p>
                  <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="text-xs text-muted-foreground font-medium">홈 화면에 추가</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">3</span>
                <p className="flex-1 text-sm text-foreground leading-relaxed">
                  <strong>'설치'</strong> 또는 <strong>'추가'</strong>를 탭하세요
                </p>
              </div>
            </div>

            <hr className="border-border mb-4" />

            {/* iPhone */}
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                </svg>
              </span>
              iPhone
              <span className="text-xs font-normal text-muted-foreground">(Safari 브라우저 권장)</span>
            </h3>
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">1</span>
                <p className="flex-1 text-sm text-foreground leading-relaxed flex items-center gap-1.5 flex-wrap">
                  하단의
                  <span className="inline-flex"><IosShareIcon /></span>
                  <strong>공유</strong> 버튼을 탭하세요
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">2</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed mb-1">
                    <strong>'홈 화면에 추가'</strong>를 선택하세요
                  </p>
                  <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="text-xs text-muted-foreground font-medium">홈 화면에 추가</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">3</span>
                <p className="flex-1 text-sm text-foreground leading-relaxed">
                  오른쪽 상단의 <strong>'추가'</strong>를 탭하세요
                </p>
              </div>
            </div>

            {/* Safari 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                iPhone은 <strong>Safari</strong>에서 설치해야 <strong>푸시 알림</strong> 수신이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 내 기기 진단 결과 */}
        <div className="px-4 mb-4">
          <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              내 기기 진단 결과
            </h3>
            <div className="divide-y divide-border">
              <DiagnosticRow label="접속 기기" status="ok" text={deviceLabel} />
              <DiagnosticRow label="앱 설치" status={installStatus} text={installText} />
              <DiagnosticRow label="알림 설정" status={notiInfo.status} text={notiInfo.text} />
            </div>

            {/* 액션 버튼 */}
            {(showInstallButton || showPermissionButton) && (
              <div className="flex flex-col gap-2 mt-3">
                {showInstallButton && (
                  <button
                    onClick={() => triggerInstall()}
                    className="w-full p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold transition-colors hover:bg-primary/90"
                  >
                    앱 설치하기
                  </button>
                )}
                {showPermissionButton && (
                  <button
                    onClick={() => requestPushPermission()}
                    className="w-full p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold transition-colors hover:bg-primary/90"
                  >
                    알림 허용하기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[600px] mx-auto p-4 bg-background/80 backdrop-blur-md border-t border-border z-40">
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-[0.98]"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
};

export default InstallGuidePage;
