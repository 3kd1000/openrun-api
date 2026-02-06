import React from "react";
import "./AuthLoadingScreen.css";

interface AuthLoadingScreenProps {
  message?: string;
}

/**
 * Firebase 인증 상태 확인 중 표시되는 스플래시 화면
 * - 앱 시작 시 Firebase 세션 복원 대기
 * - 로그인 페이지 접근 시 이미 로그인되어 있는지 확인 대기
 */
const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "로그인 정보 확인 중...",
}) => {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-screen__content">
        <div className="auth-loading-screen__logo">
          <span className="auth-loading-screen__logo-icon">🎾</span>
          <h1 className="auth-loading-screen__title">OpenRun</h1>
        </div>
        <div className="auth-loading-screen__spinner-container">
          <div className="auth-loading-screen__spinner" />
        </div>
        <p className="auth-loading-screen__message">{message}</p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
