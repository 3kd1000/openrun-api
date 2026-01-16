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
  BookOpenIcon,
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

  useEffect(() => {
    loadUserProfile();
    loadOAuthProviders();
    loadMyClubs();
  }, [isAuthReady, firebaseUser]);

  const loadUserProfile = async () => {
    // Firebase 인증 상태 복원이 완료될 때까지 대기
    if (!isAuthReady) {
      return;
    }

    // Firebase 사용자가 없으면 로그인 페이지로 리다이렉트
    if (!firebaseUser) {
      console.warn("⚠️ Firebase 사용자 없음 → 로그인 페이지로 리다이렉트");
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      // API 호출하여 사용자 프로필 가져오기
      console.log("🚀 App v2 실행"); // ← 이거!
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      // 세션에도 저장 (다른 화면에서 사용)
      setOpenRunSession({ userName: userProfile.name });
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      // API 호출 실패 시 로그인 페이지로 리다이렉트 (localStorage fallback 제거)
      console.warn("⚠️ API 호출 실패 → 세션 클리어 및 로그인 페이지로 리다이렉트");
      clearLoginSession();
      navigate("/login");
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

  return (
    <div className="more-page">
      <div className="more-content">

        {/* 프로필 카드 */}
        {!isLoading && user && (
          <div
            className="profile-card"
            onClick={() => setIsEditModalOpen(true)}
          >
            <div className="profile-info">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="프로필"
                  className="profile-image"
                />
              ) : (
                <div className="profile-icon">
                  <UserIcon size={28} />
                </div>
              )}
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

        {/* 내 정보 섹션 */}
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

        {/* 서비스 섹션 */}
        <div className="more-section">
          <h2>서비스</h2>
          <div
            className="more-item"
            onClick={() => navigate("/more/user-guide")}
          >
            <span className="more-icon">
              <BookOpenIcon size={20} />
            </span>
            <span className="more-link">이용 가이드</span>
          </div>
          <div className="more-item">
            <span className="more-icon">
              <FileTextIcon size={20} />
            </span>
            <div onClick={() => navigate("/more/terms")} className="more-link cursor-pointer">
              이용약관
            </div>
          </div>
          <div className="more-item">
            <span className="more-icon">
              <ScaleIcon size={20} />
            </span>
            <div onClick={() => navigate("/more/license")} className="more-link cursor-pointer">
              오픈소스 라이센스
            </div>
          </div>
          <div className="more-item">
            <span className="more-icon">
              <MailIcon size={20} />
            </span>
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
