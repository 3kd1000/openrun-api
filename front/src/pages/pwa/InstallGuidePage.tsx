import React from "react";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "../../contexts/PwaInstallContext";
import { useNotification } from "../../contexts/NotificationContext";
import { isAndroid } from "../../utils/platformDetection";
import { AppHeader } from "../../components/common/AppHeader";

/* ── SVG 일러스트: 전체화면(주소창 없음) ── */
const FullscreenIllustration: React.FC = () => (
  <svg width="100%" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="8" width="80" height="104" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
    <rect x="44" y="18" width="72" height="86" rx="2" fill="#ecfdf5" />
    <rect x="50" y="24" width="60" height="8" rx="2" fill="#059669" opacity="0.7" />
    <rect x="50" y="36" width="40" height="4" rx="1" fill="#94a3b8" opacity="0.5" />
    <rect x="50" y="44" width="55" height="4" rx="1" fill="#94a3b8" opacity="0.4" />
    <rect x="50" y="52" width="35" height="4" rx="1" fill="#94a3b8" opacity="0.3" />
    <rect x="44" y="92" width="72" height="12" fill="#f8fafc" />
    <circle cx="60" cy="98" r="3" fill="#059669" />
    <circle cx="80" cy="98" r="3" fill="#cbd5e1" />
    <circle cx="100" cy="98" r="3" fill="#cbd5e1" />
    <path d="M28 30 L38 30 M28 30 L28 40" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    <path d="M132 30 L122 30 M132 30 L132 40" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 90 L38 90 M28 90 L28 80" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    <path d="M132 90 L122 90 M132 90 L132 80" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ── SVG 일러스트: 푸시 알림 ── */
const NotificationIllustration: React.FC = () => (
  <svg width="100%" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="8" width="80" height="104" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
    <rect x="44" y="18" width="72" height="86" rx="2" fill="#f8fafc" />
    <rect x="48" y="24" width="64" height="28" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1" />
    <circle cx="58" cy="34" r="5" fill="#059669" opacity="0.2" />
    <path d="M56 34 L60 34 M58 32 L58 36" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="66" y="30" width="40" height="3" rx="1" fill="#334155" opacity="0.7" />
    <rect x="66" y="36" width="30" height="2.5" rx="1" fill="#94a3b8" opacity="0.5" />
    <rect x="66" y="42" width="35" height="2.5" rx="1" fill="#94a3b8" opacity="0.4" />
    <rect x="48" y="58" width="64" height="4" rx="1" fill="#94a3b8" opacity="0.2" />
    <rect x="48" y="66" width="50" height="4" rx="1" fill="#94a3b8" opacity="0.15" />
    <rect x="48" y="74" width="58" height="4" rx="1" fill="#94a3b8" opacity="0.1" />
    <circle cx="128" cy="20" r="14" fill="#059669" opacity="0.1" />
    <path d="M128 13 C124 13 121 16 121 20 C121 25 119 26 119 26 L137 26 C137 26 135 25 135 20 C135 16 132 13 128 13 Z" stroke="#059669" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M126 26 C126 28 127 29 128 29 C129 29 130 28 130 26" stroke="#059669" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="134" cy="14" r="3" fill="#ef4444" />
  </svg>
);

/* ── iOS 공유 아이콘 ── */
const IosShareIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const InstallGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const { isPwa, canInstallNatively, triggerInstall } = usePwaInstall();
  const { needsPermission, requestPushPermission } = useNotification();

  return (
    <div className="flex flex-col min-h-screen bg-muted">
      <AppHeader title="앱 설치 가이드" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-24 max-w-[600px] mx-auto w-full">
        {/* Hero */}
        <div className="relative flex flex-col items-center justify-center pt-8 pb-6 px-6 text-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              OpenRun을 앱으로 설치하세요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              홈 화면에 추가하면 더 빠르고<br />편하게 사용할 수 있어요
            </p>
          </div>
        </div>

        {/* 이미 PWA로 실행 중 */}
        {isPwa && (
          <div className="px-4 mb-4">
            <div className="bg-background rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">이미 앱으로 설치됨</div>
                  <div className="text-xs text-muted-foreground">홈 화면에서 실행 중이에요</div>
                </div>
              </div>
              {needsPermission && (
                <button
                  onClick={() => requestPushPermission()}
                  className="w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90"
                >
                  알림 허용하기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 혜택 카드 - 항상 표시 */}
        {!isPwa && (
          <div className="grid grid-cols-2 gap-3 px-4 mb-6">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 shadow-sm">
              <FullscreenIllustration />
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">전체화면 사용</div>
                <div className="text-xs text-muted-foreground mt-0.5">주소창 없이 앱처럼 사용</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 shadow-sm">
              <NotificationIllustration />
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">푸시 알림</div>
                <div className="text-xs text-muted-foreground mt-0.5">일정 변경, 대진표 알림 수신</div>
              </div>
            </div>
          </div>
        )}

        {/* Android 바로 설치 버튼 - canInstallNatively일 때만 */}
        {!isPwa && isAndroid() && canInstallNatively && (
          <div className="px-4 mb-4">
            <button
              onClick={() => triggerInstall()}
              className="w-full p-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-[0.98]"
            >
              바로 앱 설치하기
            </button>
          </div>
        )}

        {/* 설치 방법 - Android / iPhone 모두 표시 */}
        {!isPwa && (
          <div className="px-4 mb-4">
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">

              {/* Android */}
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </span>
                Android (Chrome)
              </h3>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">1</span>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">
                    Chrome 우측 상단의 <strong>⋮</strong> 메뉴를 탭하세요
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">2</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed mb-1.5">
                      <strong>'홈 화면에 추가'</strong>를 선택하세요
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
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
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">3</span>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">
                    <strong>'설치'</strong> 또는 <strong>'추가'</strong>를 탭하세요
                  </p>
                </div>
              </div>

              <hr className="border-border mb-6" />

              {/* iPhone */}
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  </svg>
                </span>
                iPhone (Safari)
              </h3>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">1</span>
                  <p className="flex-1 text-sm text-foreground leading-relaxed flex items-center gap-1.5 flex-wrap">
                    하단의
                    <span className="inline-flex"><IosShareIcon /></span>
                    <strong>공유</strong> 버튼을 탭하세요
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">2</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed mb-1.5">
                      <strong>'홈 화면에 추가'</strong>를 선택하세요
                    </p>
                    <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
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
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-xs font-bold">3</span>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">
                    오른쪽 상단의 <strong>'추가'</strong>를 탭하세요
                  </p>
                </div>
              </div>

              {/* Safari 안내 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Safari</strong>에서 설치해야 <strong>푸시 알림</strong> 수신이 가능합니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 하단 안내 */}
        {!isPwa && (
          <div className="px-4 mb-4">
            <div className="p-4 bg-primary/5 rounded-xl text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                앱 설치 후 알림을 허용하면<br />
                일정 변경, 대진표 생성 등 중요한 알림을 받을 수 있어요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {!isPwa && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[600px] mx-auto p-4 bg-background/80 backdrop-blur-md border-t border-border z-40">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-[0.98]"
          >
            확인했어요
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallGuidePage;
