import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, clearLoginSession } from "../../services/firebase";
import { signOut } from "firebase/auth";
import type {
  UserProfile,
  OAuthProvider,
  MyClub,
} from "../../services/api/userApi";
import {
  getCurrentUser,
  getOAuthProviders,
  getMyClubs,
} from "../../services/api/userApi";
import {
  EditIcon,
  FileTextIcon,
  LinkIcon,
  MailIcon,
  ScaleIcon,
  UsersIcon,
  UserIcon,
} from "../../components/common/Icons";
import ProfileEditModal from "../../components/ProfileEditModal";
import { setOpenRunSession } from "../../utils/openrunSession";
import "./MorePage.css";

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthReady, user: firebaseUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);

  const isLoggedIn = isAuthReady && firebaseUser;

  useEffect(() => {
    if (!isAuthReady) return;

    if (firebaseUser) {
      loadUserProfile();
      loadOAuthProviders();
      loadMyClubs();
    } else {
      setIsLoading(false);
    }
  }, [isAuthReady, firebaseUser]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      // API 호출하여 사용자 프로필 가져오기
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      // 세션에도 저장 (다른 화면에서 사용)
      setOpenRunSession({ userName: userProfile.name });
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      // API 호출 실패해도 로그인 페이지로 리다이렉트하지 않음
      // 서비스 섹션은 볼 수 있어야 함
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

  const handleLogin = () => {
    navigate("/login");
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  // 인증 상태 확인 전에는 로딩 표시
  if (!isAuthReady) {
    return (
      <div className="more-page">
        <div className="more-content">
          <div className="more-loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="more-page">
      <div className="more-content">
        {/* 프로필 카드 - 로그인 시에만 표시 */}
        {isLoggedIn && !isLoading && user && (
          <div
            className="profile-card"
            onClick={() => setIsEditModalOpen(true)}
          >
            <div className="profile-info">
              <div className="profile-icon">
                <UserIcon size={28} />
              </div>
              <div className="profile-text">
                <div className="profile-name">{user.name}</div>
                {user.email && (
                  <div className="profile-email">{user.email}</div>
                )}
              </div>
            </div>
            <div className="profile-edit-icon">
              <EditIcon size={20} />
            </div>
          </div>
        )}

        {/* 내 정보 섹션 - 로그인 시에만 표시 */}
        {isLoggedIn && (
          <div className="more-section">
            <h2>내 정보</h2>

            <div
              className="more-item"
              onClick={() => navigate("/more/oauth-providers")}
            >
              <span className="more-icon">
                <LinkIcon size={20} />
              </span>
              <div className="more-link-container">
                <span className="more-link">연동된 계정</span>
                {oauthProviders.length > 0 && (
                  <span className="more-badge">{oauthProviders.length}</span>
                )}
              </div>
            </div>

            <div className="more-item" onClick={() => navigate("/more/my-clubs")}>
              <span className="more-icon">
                <UsersIcon size={20} />
              </span>
              <div className="more-link-container">
                <span className="more-link">가입한 클럽</span>
                {myClubs.length > 0 && (
                  <span className="more-badge">{myClubs.length}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 서비스 섹션 - 항상 표시 */}
        <div className="more-section">
          <h2>서비스</h2>
          {/* <div
            className="more-item"
            onClick={() => navigate("/more/user-guide")}
          >
            <span className="more-icon">
              <BookOpenIcon size={20} />
            </span>
            <span className="more-link">이용 가이드</span>
          </div>
          {import.meta.env.DEV && (
            <div
              className="more-item"
              onClick={() => navigate("/more/guide-editor")}
            >
              <span className="more-icon">
                <EditIcon size={20} />
              </span>
              <span className="more-link">가이드 에디터 (개발용)</span>
            </div>
          )} */}
          <div className="more-item">
            <span className="more-icon">
              <FileTextIcon size={20} />
            </span>
            <div
              onClick={() => navigate("/more/terms")}
              className="more-link cursor-pointer"
            >
              이용약관
            </div>
          </div>
          <div className="more-item">
            <span className="more-icon">
              <ScaleIcon size={20} />
            </span>
            <div
              onClick={() => navigate("/more/license")}
              className="more-link cursor-pointer"
            >
              오픈소스 라이센스
            </div>
          </div>
          <div className="more-item" onClick={() => navigate("/more/inquiry")}>
            <span className="more-icon">
              <MailIcon size={20} />
            </span>
            <span className="more-link">문의하기</span>
          </div>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        ) : (
          <button onClick={handleLogin} className="login-btn">
            로그인
          </button>
        )}
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
