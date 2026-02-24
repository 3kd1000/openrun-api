/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isPWA } from "../utils/platformDetection";

/**
 * beforeinstallprompt 이벤트 타입 (Web API 표준에 없어 직접 정의)
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * 모듈 레벨에서 beforeinstallprompt 이벤트 캡처
 * React 마운트보다 먼저 발생할 수 있으므로 window 리스너로 선행 등록
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
});

interface PwaInstallContextType {
  /** 현재 PWA(standalone)로 실행 중인지 */
  isPwa: boolean;
  /** beforeinstallprompt로 네이티브 설치 가능한지 (Android Chrome) */
  canInstallNatively: boolean;
  /** 네이티브 설치 프롬프트 트리거. accepted면 true 반환 */
  triggerInstall: () => Promise<boolean>;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return context;
};

interface PwaInstallProviderProps {
  children: React.ReactNode;
}

export const PwaInstallProvider: React.FC<PwaInstallProviderProps> = ({ children }) => {
  const [pwaState, setPwaState] = useState(isPWA());
  const [canInstall, setCanInstall] = useState(deferredPrompt !== null);

  useEffect(() => {
    // 모듈 레벨에서 이미 캡처된 경우 반영
    if (deferredPrompt) {
      setCanInstall(true);
    }

    // Provider 마운트 이후 발생하는 beforeinstallprompt 처리
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setPwaState(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        deferredPrompt = null;
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[PWA] 설치 프롬프트 실패:", error);
      return false;
    }
  }, []);

  return (
    <PwaInstallContext.Provider
      value={{
        isPwa: pwaState,
        canInstallNatively: canInstall,
        triggerInstall,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};
