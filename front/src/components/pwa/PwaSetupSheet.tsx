import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "../../contexts/PwaInstallContext";
import { useNotification } from "../../contexts/NotificationContext";
import { isAndroid, isIOS } from "../../utils/platformDetection";
import {
  getOpenRunUiSettings,
  setOpenRunUiSettings,
} from "../../utils/openrunUiSettings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { PhoneIcon } from "../common/Icons";

interface PwaSetupSheetProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "install" | "notification";

export const PwaSetupSheet: React.FC<PwaSetupSheetProps> = ({
  open,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { isPwa, canInstallNatively, triggerInstall } = usePwaInstall();
  const { needsPermission, requestPushPermission } = useNotification();
  const [step, setStep] = useState<Step>("install");

  // Sheet가 열릴 때 초기 step 결정 + 1회 표시 마킹
  useEffect(() => {
    if (!open) return;

    // 1회 표시 기록
    setOpenRunUiSettings({ pwaSetupShown: true });

    // 이미 PWA면 설치 step 건너뜀
    if (isPwa) {
      if (needsPermission) {
        setStep("notification");
      } else {
        // 둘 다 완료 → 바로 완료
        onComplete();
      }
    } else {
      setStep("install");
    }
  }, [open, isPwa, needsPermission, onComplete]);

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (accepted) {
      // 설치 성공 → 알림 step으로 (필요시)
      if (needsPermission) {
        setStep("notification");
      } else {
        onComplete();
      }
    }
    // 설치 거부 → 그대로 유지 (사용자가 "나중에" 누를 수 있게)
  };

  const handleGoToGuide = () => {
    navigate("/install-guide");
  };

  const handleAllowNotification = async () => {
    await requestPushPermission();
    onComplete();
  };

  const handleSkip = () => {
    if (step === "install" && needsPermission) {
      setStep("notification");
    } else {
      onComplete();
    }
  };

  // 이미 표시된 적 있으면 열지 않음 (안전장치)
  const uiSettings = getOpenRunUiSettings();
  if (!open || (uiSettings.pwaSetupShown && !open)) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onComplete()}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl max-h-[60vh]">
        <SheetHeader className="text-center pb-0">
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
              {step === "install" ? (
                <PhoneIcon size={24} className="text-primary" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
            </div>
          </div>
          <SheetTitle className="text-base">
            {step === "install" ? "앱으로 설치하시겠어요?" : "알림을 받으시겠어요?"}
          </SheetTitle>
          <SheetDescription>
            {step === "install"
              ? "홈 화면에 추가하면 더 빠르고 편하게 사용할 수 있어요"
              : "일정 변경, 대진표 생성 등 중요한 알림을 받을 수 있어요"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 p-4 pt-2">
          {step === "install" && (
            <>
              {isAndroid() && canInstallNatively ? (
                <button
                  onClick={handleInstall}
                  className="w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90"
                >
                  앱 설치하기
                </button>
              ) : isIOS() ? (
                <button
                  onClick={handleGoToGuide}
                  className="w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90"
                >
                  설치 방법 보기
                </button>
              ) : (
                <button
                  onClick={handleGoToGuide}
                  className="w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90"
                >
                  설치 방법 보기
                </button>
              )}
            </>
          )}

          {step === "notification" && (
            <button
              onClick={handleAllowNotification}
              className="w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-colors hover:bg-primary/90"
            >
              알림 허용하기
            </button>
          )}

          <button
            onClick={handleSkip}
            className="w-full p-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            나중에
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
