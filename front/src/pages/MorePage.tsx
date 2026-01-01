import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, clearLoginSession } from "../services/firebase";
import { signOut } from "firebase/auth";
import type { UserProfile, OAuthProvider, MyClub } from "../services/api/userApi";
import { getCurrentUser, getOAuthProviders, getMyClubs } from "../services/api/userApi";
import ProfileEditModal from "../components/ProfileEditModal";
import "./MorePage.css";

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadOAuthProviders();
    // loadMyClubs(); // 클럽 메뉴 비활성화로 인해 임시 주석처리
  }, []);

  const loadUserProfile = async () => {
    try {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      // localStorage에도 저장 (다른 화면에서 사용)
      localStorage.setItem("user_name", userProfile.name);
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      // 로컬스토리지에서 fallback
      const name = localStorage.getItem("user_name") || localStorage.getItem("devUserName");
      if (name) {
        setUser({
          id: 0,
          email: "",
          name,
          imageUrl: null,
          createdAt: "",
          updatedAt: "",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOAuthProviders = async () => {
    try {
      const providers = await getOAuthProviders();
      setOAuthProviders(providers);
    } catch (error) {
      console.error("OAuth 제공자 목록 조회 실패:", error);
    }
  };

  const loadMyClubs = async () => {
    try {
      const clubs = await getMyClubs();
      setMyClubs(clubs);
    } catch (error) {
      console.error("내 클럽 목록 조회 실패:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Firebase 로그아웃
      await signOut(auth);
    } catch (error) {
      console.error("❌ Firebase signOut 실패:", error);
    }

    // localStorage 클리어 (Firebase 세션 + 일반 세션)
    clearLoginSession();

    console.log("✅ 로그아웃 완료");

    // 로그인 페이지로 이동
    navigate("/login");
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const getProviderDisplayName = (provider: string): string => {
    switch (provider.toUpperCase()) {
      case "GOOGLE":
        return "Google";
      case "KAKAO":
        return "카카오";
      case "NAVER":
        return "네이버";
      default:
        return provider;
    }
  };

  return (
    <div className="more-page">
      <div className="more-content">
        <h1>더보기</h1>

        {/* 프로필 카드 */}
        {!isLoading && user && (
          <div className="profile-card" onClick={() => setIsEditModalOpen(true)}>
            <div className="profile-info">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="프로필" className="profile-image" />
              ) : (
                <div className="profile-icon">👤</div>
              )}
              <div className="profile-text">
                <div className="profile-name">{user.name}</div>
                {user.email && <div className="profile-email">{user.email}</div>}
              </div>
            </div>
            <div className="profile-edit-icon">✏️</div>
          </div>
        )}

        {/* 내 정보 섹션 */}
        <div className="more-section">
          <h2>내 정보</h2>

          <div className="more-item" onClick={() => navigate("/more/oauth-providers")}>
            <span className="more-icon">🔗</span>
            <div className="more-link-container">
              <span className="more-link">연동된 계정</span>
              {oauthProviders.length > 0 && (
                <span className="more-badge">{oauthProviders.length}</span>
              )}
            </div>
          </div>

          {/* 가입한 클럽 메뉴 - 클럽 가입 기능 구현 전까지 임시 비활성화 */}
          {/* <div className="more-item" onClick={() => navigate("/more/my-clubs")}>
            <span className="more-icon">🏟️</span>
            <div className="more-link-container">
              <span className="more-link">가입한 클럽</span>
              {myClubs.length > 0 && (
                <span className="more-badge">{myClubs.length}</span>
              )}
            </div>
          </div> */}
        </div>

        {/* 서비스 섹션 */}
        <div className="more-section">
          <h2>서비스</h2>
          <div className="more-item">
            <span className="more-icon">📄</span>
            <a href="/terms" className="more-link">
              이용약관
            </a>
          </div>
          <div className="more-item">
            <span className="more-icon">⚖️</span>
            <a href="/license" className="more-link">
              오픈소스 라이센스
            </a>
          </div>
          <div className="more-item">
            <span className="more-icon">✉️</span>
            <a href="mailto:dev.openrun@gmail.com" className="more-link">
              문의하기
            </a>
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <button onClick={handleLogout} className="logout-btn">
          로그아웃
        </button>
      </div>

      {/* 프로필 수정 모달 */}
      {isEditModalOpen && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default MorePage;
