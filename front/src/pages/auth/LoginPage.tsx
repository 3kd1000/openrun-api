import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGooglePopup,
  auth,
  setLoginExpiry,
} from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { signInWithCustomToken } from "firebase/auth";
import axiosInstance from "../../services/api/axiosInstance";
import { webauthnService } from "../../services/webauthnService";
import { syncClubList } from "../../services/api/userApi";
import { getOpenRunSession, setOpenRunSession, hasJoinedClub, setAutoLoginEnabled as saveAutoLoginSetting } from "../../utils/openrunSession";
import { getOpenRunUiSettings } from "../../utils/openrunUiSettings";
import AuthLoadingScreen from "../../components/AuthLoadingScreen";

interface UserInfo {
  id: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  createdAt: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthReady, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kakaoAuthCode, setKakaoAuthCode] = useState<string | null>(null);
  const [showWebAuthnModal, setShowWebAuthnModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(true); // 기본값: 자동 로그인 사용
  const [isCheckingSession, setIsCheckingSession] = useState(true); // 세션 확인 중 여부

  // 로그인 후 원래 페이지로 돌아가기
  const navigateAfterLogin = () => {
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      console.log(`✅ 저장된 URL로 이동: ${returnUrl}`);
      sessionStorage.removeItem('returnUrl'); // 사용 후 제거
      navigate(returnUrl, { replace: true });
      return;
    }

    // 시작 가이드 미확인 → 가이드 페이지로 우회
    const uiSettings = getOpenRunUiSettings();
    if (!uiSettings.startGuideSeen) {
      const destination = hasJoinedClub() ? "/schedules/club" : "/explore";
      console.log(`📖 시작 가이드 미확인 → /install-guide (destination: ${destination})`);
      navigate("/install-guide", { replace: true, state: { destination } });
      return;
    }

    // clubList 기반으로 가입한 클럽 여부 확인
    if (hasJoinedClub()) {
      console.log(`✅ 가입한 클럽 있음 → 클럽일정으로 이동`);
      navigate("/schedules/club", { replace: true });
    } else {
      console.log(`✅ 가입한 클럽 없음 → 클럽 탐색 페이지로 이동`);
      navigate("/explore", { replace: true, state: { defaultTab: "member" } });
    }
  };

  // 이미 로그인되어있는지 체크 (PWA 시작 시 자동 로그인)
  useEffect(() => {
    const checkAndNavigate = async () => {
      // Firebase 인증 상태 복원이 완료될 때까지 대기
      if (!isAuthReady) return;

      const session = getOpenRunSession();
      const firebaseToken = session.firebaseToken;
      const userId = session.userId;

      // 세션 데이터가 없으면 로그인 페이지 표시
      if (!firebaseToken || !userId) {
        console.log("ℹ️ 세션 데이터 없음 → 로그인 페이지 표시");
        setIsCheckingSession(false);
        return;
      }

      // 세션 데이터는 있지만 Firebase Auth 사용자가 없으면 → 로그인 폼 표시 (세션 데이터는 보존)
      // clearLoginSession()은 명시적 로그아웃 시에만 호출
      // 다음 로그인 시 세션 데이터가 자동으로 덮어쓰기됨
      if (!user) {
        console.warn("⚠️ 세션 데이터가 있지만 Firebase Auth 사용자 없음 → 로그인 폼 표시 (세션 보존)");
        setIsCheckingSession(false);
        return;
      }

      // Firebase Auth 사용자도 있고 세션 데이터도 있으면 → 자동 네비게이션
      console.log("✅ 이미 로그인되어 있음 → 원래 페이지 또는 /schedules/club로 자동 이동");
      await navigateAfterLogin();
      // navigateAfterLogin() 후에는 isCheckingSession을 false로 설정할 필요 없음 (다른 페이지로 이동됨)
    };
    checkAndNavigate();
  }, [isAuthReady, user, navigate]);

  // URL에서 카카오 인가 코드 추출 (카카오 로그인 리다이렉트 후)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setKakaoAuthCode(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 카카오 인가 코드로 로그인 처리
  useEffect(() => {
    const handleKakaoCallback = async () => {
      if (!kakaoAuthCode) return;

      const debugMode = localStorage.getItem("debug_login") === "true";

      console.log("🟡 [Kakao Login] Step 0: 카카오 인가 코드 감지됨, 로그인 처리 시작");

      // 중복 실행 방지: 즉시 kakaoAuthCode를 null로 설정
      const authCode = kakaoAuthCode;
      setKakaoAuthCode(null);

      setLoading(true);
      setError(null);

      try {
        // 1. 백엔드로 인가 코드 전송 → Firebase Custom Token + isNewUser 받기
        console.log("🟡 [Kakao Login] Step 1: 백엔드로 인가 코드 전송 중...");
        const response = await axiosInstance.post(
          `/auth/login/kakao?code=${authCode}`
        );
        const firebaseCustomToken = response.data.firebaseCustomToken;
        const isNewUser = response.data.newUser;
        console.log("✅ [Kakao Login] Step 1: 백엔드에서 Custom Token 받기 완료 (length:", firebaseCustomToken?.length, ")");
        if (debugMode) alert(`Step 1 완료: Custom Token 받음`);

        // 2. Firebase Custom Token으로 Firebase 로그인 → ID Token 받기
        console.log("🟡 [Kakao Login] Step 2: Firebase signInWithCustomToken 호출 중...");
        const userCredential = await signInWithCustomToken(
          auth,
          firebaseCustomToken
        );
        console.log("✅ [Kakao Login] Step 2: Firebase 로그인 성공");
        if (debugMode) alert(`Step 2 완료: Firebase 로그인 성공`);

        const idToken = await userCredential.user.getIdToken();
        const firebaseUser = userCredential.user;
        console.log("✅ [Kakao Login] Step 2-1: Firebase ID Token 받기 완료");

        // 3. Firebase token을 세션에 저장
        console.log("🟡 [Kakao Login] Step 3: 세션 저장 중...");
        const refreshTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
        setOpenRunSession({
          firebaseToken: idToken,
          firebaseUid: firebaseUser.uid,
          tokenLastRefresh: refreshTime,
        });
        console.log("✅ [Kakao Login] Step 3: 세션 저장 완료");

        // 3-1. axios 기본 헤더에 즉시 설정 (타이밍 이슈 방지)
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
        console.log("✅ [Kakao Login] Step 3-1: axios 기본 헤더 설정 완료");

        // 4. 백엔드에서 사용자 정보 조회
        console.log("🟡 [Kakao Login] Step 4: 사용자 정보 조회 중...");
        const userInfo = await fetchUserInfo();
        console.log("✅ [Kakao Login] Step 4: 사용자 정보 조회 완료");
        if (debugMode) alert(`Step 4 완료: 사용자 정보 조회 완료`);

        // 5~7. 세션 저장 (openrun_session_v1 + legacy keys 동기화)
        setOpenRunSession({
          userId: userInfo.id,
          userName: userInfo.name,
          userEmail: userInfo.email,
          userImageUrl: userInfo.imageUrl,
          autoLoginEnabled,
        });
        // 자동 로그인 설정을 별도 키에도 저장 (세션 삭제와 무관하게 유지)
        saveAutoLoginSetting(autoLoginEnabled);

        // 클럽 목록 동기화 (currentClubId 자동 설정)
        await syncClubList();

        console.log("✅ 카카오 로그인 성공:", userInfo);

        // 8. 로그인 세션 만료 시간 설정 (자동 로그인 여부에 따라 다르게)
        setLoginExpiry(autoLoginEnabled);

        // 7. 신규 사용자 판단 (백엔드에서 받은 isNewUser 사용)
        if (isNewUser) {
          console.log("🆕 신규 사용자 감지 → 프로필 설정 페이지로 이동");
          if (debugMode) alert("Step 5: 신규 사용자 → /setup-profile로 이동");
          // token을 state로 전달 (ID Token 사용)
          navigate("/setup-profile", {
            state: {
              token: idToken,
              userInfo: userInfo,
            },
          });
        } else {
          console.log("✅ 기존 사용자 → WebAuthn 등록 여부 확인");
          // WebAuthn 등록 여부 확인
          try {
            const hasWebAuthn = await webauthnService.hasWebAuthn();
            console.log("  └─ hasWebAuthn:", hasWebAuthn, ", isSupported:", webauthnService.isSupported());
            if (!hasWebAuthn && webauthnService.isSupported()) {
              console.log("🔐 WebAuthn 미등록 → 등록 권장 모달 표시");
              if (debugMode) alert("Step 5: WebAuthn 미등록 → 모달 표시");
              setShowWebAuthnModal(true);
            } else {
              console.log("✅ 메인 화면으로 이동");
              if (debugMode) alert("Step 5: /schedules/club로 이동");
              await navigateAfterLogin();
            }
          } catch (error) {
            console.error("WebAuthn 등록 여부 확인 실패:", error);
            if (debugMode) alert(`WebAuthn 확인 실패 → /schedules/club로 이동\n${error}`);
            // 에러가 나도 메인 화면으로 이동
            await navigateAfterLogin();
          }
        }
      } catch (err: unknown) {
        console.error("❌ [Kakao Login] 카카오 로그인 실패:", err);
        let errorMessage = "카카오 로그인 중 오류가 발생했습니다.";
        if (err instanceof Error) {
          errorMessage = `카카오 로그인 실패: ${err.message}`;
        }
        setError(errorMessage);

        // 디버그 모드일 때만 상세 정보 alert
        if (debugMode) {
          alert(`[카카오 로그인 실패]\n${errorMessage}\n\n상세: ${JSON.stringify(err, null, 2)}`);
        }
      } finally {
        console.log("🟡 [Kakao Login] 로그인 처리 종료");
        setLoading(false);
      }
    };

    handleKakaoCallback();
  }, [kakaoAuthCode]);

  // 구글 로그인 처리
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔵 [1/4] Google 팝업 로그인 시작...");
      // 1. Google 팝업 로그인 → Firebase ID Token 받기
      const result = await signInWithGooglePopup();
      if (!result) {
        throw new Error("구글 로그인에 실패했습니다.");
      }
      const { user: firebaseUser, idToken } = result;
      console.log("✅ [1/4] Firebase ID Token 받기 완료");

      console.log("🔵 [2/4] 백엔드 로그인 처리...");
      // 2. 백엔드로 ID Token 전송 → isNewUser 받기
      const loginResponse = await axiosInstance.post("/auth/login/google", {
        idToken: idToken,
      });
      const isNewUser = loginResponse.data.newUser;
      console.log("✅ [2/4] 백엔드 로그인 완료, isNewUser:", isNewUser);

      // 3. Firebase token을 세션에 저장
      const refreshTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      setOpenRunSession({
        firebaseToken: idToken,
        firebaseUid: firebaseUser.uid,
        tokenLastRefresh: refreshTime,
      });

      console.log("🔵 [3/4] 사용자 정보 조회...");
      // 4. 백엔드에서 사용자 정보 조회
      const userInfo = await fetchUserInfo();

      // 5~7. 세션 저장 (openrun_session_v1 + legacy keys 동기화)
      setOpenRunSession({
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userImageUrl: userInfo.imageUrl,
        autoLoginEnabled,
      });
      // 자동 로그인 설정을 별도 키에도 저장 (세션 삭제와 무관하게 유지)
      saveAutoLoginSetting(autoLoginEnabled);

      // 클럽 목록 동기화 (currentClubId 자동 설정)
      await syncClubList();

      console.log("✅ [3/4] localStorage 저장 완료");

      console.log("🔵 [4/4] 로그인 세션 만료 시간 설정...");
      // 8. 로그인 세션 만료 시간 설정 (자동 로그인 여부에 따라 다르게)
      setLoginExpiry(autoLoginEnabled);

      console.log("✅ [4/4] 로그인 플로우 완료");

      // 7. 신규 사용자 판단 (백엔드에서 받은 isNewUser 사용)
      if (isNewUser) {
        console.log("🆕 신규 사용자 감지 → 프로필 설정 페이지로 이동");
        // token을 state로 전달
        navigate("/setup-profile", {
          state: {
            token: idToken,
            userInfo: userInfo,
          },
        });
      } else {
        console.log("✅ 기존 사용자 → WebAuthn 등록 여부 확인");
        // WebAuthn 등록 여부 확인
        try {
          const hasWebAuthn = await webauthnService.hasWebAuthn();
          if (!hasWebAuthn && webauthnService.isSupported()) {
            console.log("🔐 WebAuthn 미등록 → 등록 권장 모달 표시");
            setShowWebAuthnModal(true);
          } else {
            console.log("✅ 메인 화면으로 이동");
            await navigateAfterLogin();
          }
        } catch (error) {
          console.error("WebAuthn 등록 여부 확인 실패:", error);
          // 에러가 나도 메인 화면으로 이동
          await navigateAfterLogin();
        }
      }
    } catch (err: unknown) {
      console.error("❌ 구글 로그인 실패:", err);
      if (err instanceof Error) {
        setError(`구글 로그인 실패: ${err.message}`);
      } else {
        setError("구글 로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 버튼 클릭 (SDK 없이 직접 OAuth URL 리다이렉트)
  const handleKakaoSignIn = () => {
    const clientId = import.meta.env.VITE_KAKAO_APP_KEY;
    const redirectUri = encodeURIComponent(import.meta.env.VITE_KAKAO_REDIRECT_URI);
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  // WebAuthn 생체인증 로그인
  const handleWebAuthnSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔐 [1/5] WebAuthn 생체인증 시작...");

      // 1. WebAuthn 브라우저 지원 확인
      if (!webauthnService.isSupported()) {
        throw new Error("이 브라우저는 생체인증을 지원하지 않습니다.");
      }

      // 2. WebAuthn 로그인 → Firebase Custom Token 받기
      const loginResponse = await webauthnService.loginWithWebAuthn();
      console.log("✅ [1/5] WebAuthn 인증 완료, Custom Token 받기 완료");

      console.log("🔐 [2/5] Firebase 로그인 처리...");
      // 3. Firebase Custom Token으로 Firebase 로그인
      const userCredential = await signInWithCustomToken(
        auth,
        loginResponse.customToken
      );
      const idToken = await userCredential.user.getIdToken();
      const firebaseUser = userCredential.user;
      console.log("✅ [2/5] Firebase 로그인 완료");

      // 4. Firebase token을 세션에 저장
      const refreshTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      setOpenRunSession({
        firebaseToken: idToken,
        firebaseUid: firebaseUser.uid,
        tokenLastRefresh: refreshTime,
      });

      console.log("🔐 [3/5] 사용자 정보 조회...");
      // 5. 백엔드에서 사용자 정보 조회
      const userInfo = await fetchUserInfo();

      console.log("🔐 [4/5] 세션 저장...");
      // 6~8. 세션 저장 (openrun_session_v1 + legacy keys 동기화)
      setOpenRunSession({
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userImageUrl: userInfo.imageUrl,
        autoLoginEnabled,
      });
      // 자동 로그인 설정을 별도 키에도 저장 (세션 삭제와 무관하게 유지)
      saveAutoLoginSetting(autoLoginEnabled);

      // 클럽 목록 동기화 (currentClubId 자동 설정)
      await syncClubList();

      console.log("✅ [4/5] 세션 저장 완료");

      console.log("🔐 [5/5] 로그인 세션 설정...");
      // 9. 로그인 세션 만료 시간 설정 (자동 로그인 여부에 따라 다르게)
      setLoginExpiry(autoLoginEnabled);

      console.log("✅ [5/5] WebAuthn 로그인 완료!");
      console.log("✅ 사용자 정보:", userInfo);

      // 9. 메인 화면으로 이동 (WebAuthn은 이미 등록된 사용자만 사용 가능)
      await navigateAfterLogin();
    } catch (err: unknown) {
      console.error("❌ WebAuthn 로그인 실패:", err);
      if (err instanceof Error) {
        // 사용자가 취소하거나 타임아웃된 경우
        if (
          err.message.includes("timed out") ||
          err.message.includes("not allowed")
        ) {
          setError("생체인증이 취소되었거나 지원되지 않습니다.");
        } else if (err.message.includes("등록되지 않은")) {
          setError(
            "등록된 생체인증이 없습니다. 먼저 소셜 로그인으로 로그인해주세요."
          );
        } else {
          setError(`생체인증 로그인 실패: ${err.message}`);
        }
      } else {
        setError("생체인증 로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 백엔드에서 사용자 정보 조회
  const fetchUserInfo = async (): Promise<UserInfo> => {
    try {
      // GET /api/users/me 호출
      const response = await axiosInstance.get("/users/me");
      return response.data as UserInfo;
    } catch (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      throw new Error("사용자 정보를 가져올 수 없습니다.");
    }
  };

  // WebAuthn 등록 처리
  const handleWebAuthnRegistration = async () => {
    setRegistering(true);
    setError(null);

    try {
      console.log("🔐 [1/2] WebAuthn 등록 시작...");

      // 1. 등록 challenge 받기
      const challenge = await webauthnService.registerStart();
      console.log("✅ [1/2] Challenge 받기 완료");

      console.log("🔐 [2/2] 생체인증 등록 중...");
      // 2. 기기 이름 생성 (브라우저 정보 사용)
      const deviceName = `${
        navigator.platform
      } - ${new Date().toLocaleDateString()}`;

      // 3. 생체인증 등록
      await webauthnService.registerFinish(challenge, deviceName);
      console.log("✅ [2/2] WebAuthn 등록 완료!");

      // 4. 모달 닫고 메인 화면으로 이동
      setShowWebAuthnModal(false);
      await navigateAfterLogin();
    } catch (err: unknown) {
      console.error("❌ WebAuthn 등록 실패:", err);
      if (err instanceof Error) {
        // 사용자가 취소한 경우
        if (
          err.message.includes("timed out") ||
          err.message.includes("not allowed")
        ) {
          setError("생체인증 등록이 취소되었습니다.");
        } else {
          setError(`생체인증 등록 실패: ${err.message}`);
        }
      } else {
        setError("생체인증 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setRegistering(false);
    }
  };

  // WebAuthn 등록 건너뛰기
  const handleSkipWebAuthn = async () => {
    setShowWebAuthnModal(false);
    await navigateAfterLogin();
  };

  // Firebase 인증 상태 확인 중 또는 기존 세션 확인 중이면 스플래시 화면 표시
  if (!isAuthReady || isCheckingSession) {
    return <AuthLoadingScreen message="로그인 정보 확인 중..." />;
  }

  return (
    <div className="fixed inset-0 bg-muted flex items-center justify-center p-4 overflow-y-auto">
      <main className="w-full max-w-[420px] bg-background rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Brand */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8">
          <img
            src="/icon-512x512-v4.png"
            alt="OpenRun"
            className="mb-4 w-20 h-20 rounded-2xl object-cover shadow-md"
          />
          <div className="text-3xl font-black tracking-tight mb-1 text-center text-foreground">
            OpenRun
          </div>
          <p className="text-muted-foreground text-base text-center">
            테니스 클럽 관리 서비스
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="w-full px-6 pb-4 flex flex-col gap-3">
          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full h-12 px-6 bg-background border border-border text-foreground font-bold text-sm cursor-pointer transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? "로그인 중..." : "Google로 계속하기"}
          </button>

          {/* Kakao */}
          <button
            onClick={handleKakaoSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full h-12 px-6 bg-[#fee500] text-[#3C1E1E] font-bold text-sm cursor-pointer transition-all hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 3C5.925 3 1 6.925 1 11.775c0 2.9 1.75 5.5 4.6 7.075-.2.725-.725 2.625-.825 3.025-.125.475.175.475.375.35.25-.175 2.925-1.975 4.075-2.775.575.075 1.175.125 1.775.125 6.075 0 11-3.925 11-8.775S18.075 3 12 3z" />
            </svg>
            {loading ? "로그인 중..." : "Kakao로 계속하기"}
          </button>

          {/* Divider */}
          <div className="flex items-center my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="px-3 text-xs text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* WebAuthn */}
          <button
            onClick={handleWebAuthnSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full h-12 px-6 bg-primary text-primary-foreground font-bold text-sm cursor-pointer transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {loading ? "로그인 중..." : "생체인증으로 로그인"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            첫 방문 시 소셜 로그인 필요
          </p>
        </div>

        {/* Auto-login */}
        <div className="px-6 pb-6">
          <div className="bg-muted rounded-xl p-4 border border-border">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                id="autoLoginCheckbox"
                checked={autoLoginEnabled}
                onChange={(e) => setAutoLoginEnabled(e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer accent-primary shrink-0"
              />
              <span className="text-sm text-foreground font-semibold">자동 로그인</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {autoLoginEnabled ? "30일 유지" : "1시간 유지"}
              </span>
            </label>
          </div>
        </div>
      </main>

      {/* WebAuthn 등록 권장 모달 */}
      {showWebAuthnModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
          onClick={() => !registering && setShowWebAuthnModal(false)}
        >
          <div
            className="bg-background rounded-2xl p-6 max-w-[400px] w-full shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="text-xl font-bold text-foreground mb-2">생체인증 설정</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                다음 로그인부터 Face ID, Touch ID, 또는 패스키로 간편하게 로그인하실 수 있습니다.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipWebAuthn}
                disabled={registering}
                className="flex-1 p-3 bg-muted text-foreground border border-border rounded-full text-base font-medium cursor-pointer transition-all hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                나중에
              </button>
              <button
                onClick={handleWebAuthnRegistration}
                disabled={registering}
                className="flex-1 p-3 bg-primary text-primary-foreground border-none rounded-full text-base font-semibold cursor-pointer transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
