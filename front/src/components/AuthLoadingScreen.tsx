import React from "react";

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="text-center animate-[fadeIn_0.3s_ease-out]">
        <div className="mb-10">
          <span className="text-[64px] max-[425px]:text-[48px] min-[426px]:max-[768px]:text-[56px] block mb-4 animate-bounce">
            🎾
          </span>
          <h1 className="text-[32px] max-[425px]:text-[24px] min-[426px]:max-[768px]:text-[28px] font-bold text-white m-0 tracking-[2px] [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">
            OpenRun
          </h1>
        </div>
        <div className="mb-6">
          <div className="w-10 h-10 max-[425px]:w-8 max-[425px]:h-8 mx-auto border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-base max-[425px]:text-sm text-white/90 m-0 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
