import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithGooglePopup,
  auth,
  setLoginExpiry,
} from "../../services/firebase";
import { signInWithCustomToken } from "firebase/auth";
import axiosInstance from "../../services/api/axiosInstance";
import { webauthnService } from "../../services/webauthnService";
import { getOpenRunSession, setOpenRunSession } from "../../utils/openrunSession";
import { getMyClubs } from "../../services/api/userApi";

interface UserInfo {
  id: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  createdAt: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kakaoAuthCode, setKakaoAuthCode] = useState<string | null>(null);
  const [showWebAuthnModal, setShowWebAuthnModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(true); // 기본값: 자동 로그인 사용

  // 로그인 후 원래 페이지로 돌아가기 (returnUrl이 있으면 그곳으로, 가입한 클럽이 없으면 /clubs/explore, 있으면 /schedules/club)
  const navigateAfterLogin = async () => {
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      console.log(`✅ 저장된 URL로 이동: ${returnUrl}`);
      sessionStorage.removeItem('returnUrl'); // 사용 후 제거
      navigate(returnUrl, { replace: true });
      return;
    }

    // 가입한 클럽이 있는지 확인
    try {
      const clubs = await getMyClubs();
      if (clubs.length === 0) {
        console.log(`✅ 가입한 클럽 없음 → 클럽 탐색 페이지(신규회원 모집 탭)로 이동`);
        navigate("/clubs/explore", { replace: true, state: { defaultTab: "member" } });
      } else {
        console.log(`✅ 가입한 클럽 있음 → 기본 페이지(/schedules/club)로 이동`);
        navigate("/schedules/club", { replace: true });
      }
    } catch (err) {
      console.error("클럽 목록 조회 실패:", err);
      // 에러가 나도 기본 페이지로 이동
      console.log(`⚠️ 클럽 조회 실패 → 기본 페이지(/schedules/club)로 이동`);
      navigate("/schedules/club", { replace: true });
    }
  };

  // 이미 로그인되어있는지 체크 (PWA 시작 시 자동 로그인)
  useEffect(() => {
    const checkAndNavigate = async () => {
      const session = getOpenRunSession();
      const firebaseToken = session.firebaseToken;
      const userId = session.userId;

      // 이미 로그인되어있으면 원래 페이지 또는 메인 화면으로 이동
      if (firebaseToken && userId) {
        console.log("✅ 이미 로그인되어 있음 → 원래 페이지 또는 /schedules/club로 자동 이동");
        await navigateAfterLogin();
      }
    };
    checkAndNavigate();
  }, [navigate]);

  // Kakao SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
      console.log("Kakao SDK initialized:", window.Kakao.isInitialized());
    }

    // URL에서 인가 코드 추출 (카카오 로그인 리다이렉트 후)
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
          currentClubId: "1", // openrun 클럽 ID (향후 동적 변경)
          autoLoginEnabled,
        });

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
        currentClubId: "1", // openrun 클럽 ID (향후 동적 변경)
        autoLoginEnabled,
      });

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

  // 카카오 로그인 버튼 클릭
  const handleKakaoSignIn = () => {
    if (window.Kakao) {
      window.Kakao.Auth.authorize({
        redirectUri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
      });
    } else {
      setError("Kakao SDK가 로드되지 않았습니다.");
    }
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
        currentClubId: "1",
        autoLoginEnabled,
      });

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>OpenRun</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          테니스 클럽 관리 서비스
        </p>

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>

        <button
          onClick={handleKakaoSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            backgroundColor: "#fee500",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "로그인 중..." : "Kakao로 로그인"}
        </button>

        {/* 구분선 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
          <span
            style={{
              padding: "0 10px",
              fontSize: "12px",
              color: "#999",
            }}
          >
            또는
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
        </div>

        {/* WebAuthn 생체인증 로그인 버튼 */}
        <button
          onClick={handleWebAuthnSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#6c5ce7",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🔐</span>
          {loading ? "로그인 중..." : "생체인증으로 로그인"}
        </button>

        {/* 생체인증 안내 */}
        <p
          style={{
            fontSize: "12px",
            color: "#6c757d",
            textAlign: "center",
            marginTop: "8px",
            marginBottom: "12px",
            lineHeight: "1.4",
          }}
        >
          ℹ️ 처음 방문하신 경우 Google 또는 Kakao 로그인이 필요합니다.
        </p>

        {/* 자동 로그인 안내 */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <input
              type="checkbox"
              id="autoLoginCheckbox"
              checked={autoLoginEnabled}
              onChange={(e) => setAutoLoginEnabled(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="autoLoginCheckbox"
              style={{
                fontSize: "14px",
                color: "#495057",
                fontWeight: "600",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              자동 로그인 사용
            </label>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6c757d",
              lineHeight: "1.5",
              margin: 0,
            }}
          >
            {autoLoginEnabled
              ? "이 기기에 로그인 정보를 안전하게 저장하여 30일간 자동으로 로그인 상태를 유지합니다."
              : "로그인 후 1시간 동안만 로그인 상태를 유지합니다. 앱을 종료하면 재로그인이 필요합니다."}
          </p>
          <ul
            style={{
              fontSize: "12px",
              color: "#6c757d",
              marginTop: "8px",
              marginBottom: 0,
              paddingLeft: "20px",
            }}
          >
            {autoLoginEnabled ? (
              <>
                <li>마지막 접속일로부터 30일간 유효</li>
                <li>언제든지 로그아웃 가능</li>
              </>
            ) : (
              <>
                <li>최대 1시간 동안만 유효</li>
                <li>보안이 더 강화됩니다</li>
              </>
            )}
          </ul>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12px",
            color: "#999",
          }}
        >
          로그인하면{" "}
          <Link
            to="/terms"
            style={{
              color: "#007bff",
              textDecoration: "underline",
            }}
          >
            서비스 이용약관
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>

      {/* WebAuthn 등록 권장 모달 */}
      {showWebAuthnModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "10px",
                fontSize: "24px",
              }}
            >
              🔐 생체인증 설정
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "#666",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              다음 로그인부터 Face ID, Touch ID, 또는 패스키로 간편하게
              로그인하실 수 있습니다.
            </p>

            {error && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fee",
                  color: "#c33",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleSkipWebAuthn}
                disabled={registering}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: registering ? "not-allowed" : "pointer",
                  opacity: registering ? 0.6 : 1,
                }}
              >
                나중에
              </button>
              <button
                onClick={handleWebAuthnRegistration}
                disabled={registering}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#6c5ce7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: registering ? "not-allowed" : "pointer",
                  opacity: registering ? 0.6 : 1,
                }}
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
