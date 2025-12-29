import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGooglePopup,
  auth,
  setLoginExpiry,
} from "../services/firebase";
import { signInWithCustomToken } from "firebase/auth";
import axiosInstance from "../services/api/axiosInstance";

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

      setLoading(true);
      setError(null);

      try {
        // 1. 백엔드로 인가 코드 전송 → Firebase Custom Token + isNewUser 받기
        const response = await axiosInstance.post(
          `/auth/login/kakao?code=${kakaoAuthCode}`
        );
        const firebaseCustomToken = response.data.firebaseCustomToken;
        const isNewUser = response.data.newUser;

        // 2. Firebase Custom Token으로 Firebase 로그인 → ID Token 받기
        const userCredential = await signInWithCustomToken(
          auth,
          firebaseCustomToken
        );
        const idToken = await userCredential.user.getIdToken();
        const firebaseUser = userCredential.user;

        // 3. Firebase token을 localStorage에 저장
        localStorage.setItem("firebase_token", idToken);
        localStorage.setItem("firebase_uid", firebaseUser.uid);

        // 4. 백엔드에서 사용자 정보 조회
        const userInfo = await fetchUserInfo(firebaseUser.uid);

        // 5. 사용자 정보를 localStorage에 저장
        localStorage.setItem("user_id", userInfo.id.toString());
        localStorage.setItem("user_name", userInfo.name);
        if (userInfo.email) {
          localStorage.setItem("user_email", userInfo.email);
        }
        if (userInfo.imageUrl) {
          localStorage.setItem("user_image_url", userInfo.imageUrl);
        }

        console.log("✅ 카카오 로그인 성공:", userInfo);

        // 6. 로그인 세션 만료 시간 설정 (7일 후)
        setLoginExpiry(true);

        // 7. 신규 사용자 판단 (백엔드에서 받은 isNewUser 사용)
        if (isNewUser) {
          console.log("🆕 신규 사용자 감지 → 프로필 설정 페이지로 이동");
          // token을 state로 전달 (ID Token 사용)
          navigate("/setup-profile", {
            state: {
              token: idToken,
              userInfo: userInfo,
            },
          });
        } else {
          console.log("✅ 기존 사용자 → 메인 화면으로 이동");
          navigate("/schedules");
        }
      } catch (err: unknown) {
        console.error("카카오 로그인 실패:", err);
        if (err instanceof Error) {
          setError(`카카오 로그인 실패: ${err.message}`);
        } else {
          setError("카카오 로그인 중 오류가 발생했습니다.");
        }
      } finally {
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

      // 3. Firebase token을 localStorage에 저장
      localStorage.setItem("firebase_token", idToken);
      localStorage.setItem("firebase_uid", firebaseUser.uid);

      console.log("🔵 [3/4] 사용자 정보 조회...");
      // 4. 백엔드에서 사용자 정보 조회
      const userInfo = await fetchUserInfo(firebaseUser.uid);

      // 5. 사용자 정보를 localStorage에 저장
      localStorage.setItem("user_id", userInfo.id.toString());
      localStorage.setItem("user_name", userInfo.name);
      if (userInfo.email) {
        localStorage.setItem("user_email", userInfo.email);
      }
      if (userInfo.imageUrl) {
        localStorage.setItem("user_image_url", userInfo.imageUrl);
      }
      console.log("✅ [3/4] localStorage 저장 완료");

      console.log("🔵 [4/4] 로그인 세션 만료 시간 설정...");
      // 6. 로그인 세션 만료 시간 설정 (7일 후)
      setLoginExpiry(true);

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
        console.log("✅ 기존 사용자 → 메인 화면으로 이동");
        navigate("/schedules");
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

  // 백엔드에서 사용자 정보 조회
  const fetchUserInfo = async (firebaseUid: string): Promise<UserInfo> => {
    try {
      // GET /api/users/me 호출
      const response = await axiosInstance.get("/users/me");
      return response.data as UserInfo;
    } catch (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      throw new Error("사용자 정보를 가져올 수 없습니다.");
    }
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

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12px",
            color: "#999",
          }}
        >
          로그인하면 서비스 약관에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
