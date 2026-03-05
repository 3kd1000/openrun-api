import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, clearLoginSession } from "../../services/firebase";
import { signOut } from "firebase/auth";
import type {
  UserProfile,
  OAuthProvider,
  WithdrawalCheckResponse,
} from "../../services/api/userApi";
import {
  getCurrentUser,
  getOAuthProviders,
  checkWithdrawal,
  withdrawUser,
} from "../../services/api/userApi";
import {
  EditIcon,
  FileTextIcon,
  LinkIcon,
  MegaphoneIcon,
  ScaleIcon,
  ShieldIcon,
  UsersIcon,
  UserIcon,
  PhoneIcon,
  CompassIcon,
} from "../../components/common/Icons";
import { AppHeader } from "../../components/common/AppHeader";
import { ClubSelector } from "../../components/ClubSelector";
import { useClubSelectorState } from "../../hooks/useClubSelectorState";
import { useNotification } from "../../contexts/NotificationContext";
import { usePwaInstall } from "../../contexts/PwaInstallContext";
import { isMobile, isAndroid } from "../../utils/platformDetection";
import { setOpenRunSession } from "../../utils/openrunSession";
const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthReady, user: firebaseUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const {
    clubs: myClubs,
    selectedClubId,
    isLoading: clubSelectorLoading,
    handleClubChange: handleSelectorClubChange,
    isLoggedIn: selectorLoggedIn,
  } = useClubSelectorState();

  // 회원 탈퇴 관련 state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalCheck, setWithdrawalCheck] = useState<WithdrawalCheckResponse | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const { needsPermission, permissionRevoked, requestPushPermission } = useNotification();
  const { isPwa, canInstallNatively, triggerInstall } = usePwaInstall();

  // 모바일 비-PWA 상태에서 설치 배너 표시
  const showInstallBanner = !isPwa && isMobile();

  const isLoggedIn = isAuthReady && firebaseUser;

  useEffect(() => {
    if (!isAuthReady) return;

    if (firebaseUser) {
      fetchUserData();
      loadOAuthProviders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthReady, firebaseUser]);

  // 프로필 수정 페이지에서 돌아올 때 re-fetch
  useEffect(() => {
    const handleFocus = () => { if (firebaseUser) fetchUserData(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [firebaseUser]);

  const fetchUserData = async () => {
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

  // 회원 탈퇴 모달 열기 (탈퇴 가능 여부 체크)
  const handleOpenWithdrawModal = async () => {
    setWithdrawError(null);
    setWithdrawalCheck(null);
    setShowWithdrawModal(true);

    try {
      const result = await checkWithdrawal();
      setWithdrawalCheck(result);
    } catch (error) {
      console.error("탈퇴 가능 여부 체크 실패:", error);
      setWithdrawError("탈퇴 가능 여부를 확인할 수 없습니다. 다시 시도해주세요.");
    }
  };

  // 회원 탈퇴 실행
  const handleWithdraw = async () => {
    if (!withdrawalCheck?.canWithdraw) return;

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      await withdrawUser();

      // Firebase 로그아웃
      try {
        await signOut(auth);
      } catch (error) {
        console.error("❌ Firebase signOut 실패:", error);
      }

      // localStorage 클리어
      clearLoginSession();

      alert("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
      navigate("/login");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      setWithdrawError("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 인증 상태 확인 전에는 로딩 표시
  if (!isAuthReady) {
    return (
      <div className="min-h-[calc(100vh-140px)]">
        <div className="max-w-[600px] mx-auto p-4">
          <div className="text-center p-5 text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <div className="shrink-0 sticky top-0 z-[100]">
        <AppHeader>
          {selectorLoggedIn && (
            <ClubSelector
              selectedClubId={selectedClubId}
              onClubChange={handleSelectorClubChange}
              clubs={myClubs}
              isLoading={clubSelectorLoading}
            />
          )}
        </AppHeader>
      </div>
      <div className="max-w-[600px] mx-auto p-4">
        {/* 프로필 카드 - 로그인 시에만 표시 */}
        {isLoggedIn && !isLoading && user && (
          <div
            className="bg-background border border-border rounded-lg p-4 mb-5 cursor-pointer transition-all flex justify-between items-center min-h-[92px] hover:bg-muted hover:border-primary hover:-translate-y-0.5 hover:shadow-md group"
            onClick={() => navigate('/more/profile/edit')}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-[52px] h-[52px] rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                <UserIcon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-foreground mb-1 truncate">{user.name}</div>
                {user.email && (
                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                )}
              </div>
            </div>
            <div className="text-muted-foreground transition-all shrink-0 inline-flex items-center justify-center group-hover:text-primary [&_svg]:group-hover:scale-110">
              <EditIcon size={20} />
            </div>
          </div>
        )}

        {/* 내 정보 섹션 - 로그인 시에만 표시 */}
        {isLoggedIn && (
          <div className="mb-5">
            <div className="text-lg font-bold text-foreground mb-3">내 정보</div>

            <div
              className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
              onClick={() => navigate("/more/oauth-providers")}
            >
              <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
                <LinkIcon size={20} />
              </span>
              <div className="flex-1 flex items-center gap-2">
                <span className="flex-1 text-sm text-foreground no-underline font-medium">연동된 계정</span>
                {oauthProviders.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold shrink-0">
                    {oauthProviders.length}
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
              onClick={() => navigate("/more/my-clubs")}
            >
              <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
                <UsersIcon size={20} />
              </span>
              <div className="flex-1 flex items-center gap-2">
                <span className="flex-1 text-sm text-foreground no-underline font-medium">가입한 클럽</span>
                {myClubs.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold shrink-0">
                    {myClubs.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PWA 미설치 + 모바일 → 앱 설치 안내 배너 */}
        {showInstallBanner && (
          <div
            className="flex items-center gap-3 p-3 mb-5 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg cursor-pointer text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)]"
            onClick={() => {
              if (isAndroid() && canInstallNatively) {
                triggerInstall();
              } else {
                navigate("/install-guide");
              }
            }}
          >
            <span className="flex items-center justify-center w-11 h-11 bg-white/20 rounded-full shrink-0">
              <PhoneIcon size={24} />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold mb-0.5">앱으로 설치하기</span>
              <span className="block text-xs opacity-90">
                설치하면 푸시 알림을 받을 수 있어요
              </span>
            </div>
            <span className="text-2xl opacity-70 shrink-0">›</span>
          </div>
        )}

        {/* 푸시 알림 권한 요청 배너 (PWA에서 아직 허용하지 않은 경우) */}
        {isLoggedIn && !showInstallBanner && needsPermission && (
          <div
            className="flex items-center gap-3 p-3 mb-5 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg cursor-pointer text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)]"
            onClick={requestPushPermission}
          >
            <span className="flex items-center justify-center w-11 h-11 bg-white/20 rounded-full shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold mb-0.5">푸시 알림 받기</span>
              <span className="block text-xs opacity-90">
                일정, 대진표 등 중요한 알림을 받으려면 허용해주세요
              </span>
            </div>
            <span className="text-2xl opacity-70 shrink-0">›</span>
          </div>
        )}

        {/* PWA에서 알림 권한이 해제된 경우 재설정 안내 배너 */}
        {isLoggedIn && !showInstallBanner && permissionRevoked && (
          <div
            className="flex items-center gap-3 p-3 mb-5 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg cursor-pointer text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)]"
            onClick={() => navigate("/notifications")}
          >
            <span className="flex items-center justify-center w-11 h-11 bg-white/20 rounded-full shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold mb-0.5">알림이 꺼져있습니다</span>
              <span className="block text-xs opacity-90">
                기기 설정에서 알림을 다시 켜주세요
              </span>
            </div>
            <span className="text-2xl opacity-70 shrink-0">›</span>
          </div>
        )}

        {/* 서비스 섹션 - 항상 표시 */}
        <div className="mb-5">
          <div className="text-lg font-bold text-foreground mb-3">서비스</div>
          <div
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
            onClick={() => navigate("/intro")}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
              <MegaphoneIcon size={20} />
            </span>
            <span className="flex-1 text-sm text-foreground no-underline font-medium">서비스 소개</span>
          </div>
          <div
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
            onClick={() => navigate("/install-guide")}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
              <CompassIcon size={20} />
            </span>
            <span className="flex-1 text-sm text-foreground no-underline font-medium">시작 가이드</span>
          </div>
          {isLoggedIn && (
            <>
              <div
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
                onClick={() => navigate("/more/notification-settings")}
              >
                <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="flex-1 text-sm text-foreground no-underline font-medium">알림 설정</span>
              </div>
              <div
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
                onClick={() => navigate("/more/calendar-settings")}
              >
                <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="flex-1 text-sm text-foreground no-underline font-medium">외부 캘린더 연동</span>
              </div>
            </>
          )}
          <div
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
            onClick={() => navigate("/more/terms")}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
              <FileTextIcon size={20} />
            </span>
            <span className="flex-1 text-sm text-foreground no-underline font-medium">이용약관</span>
          </div>
          <div
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
            onClick={() => navigate("/privacy")}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
              <ShieldIcon size={20} />
            </span>
            <span className="flex-1 text-sm text-foreground no-underline font-medium">개인정보처리방침</span>
          </div>
          <div
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-md mb-2 transition-all cursor-pointer min-h-[52px] hover:bg-muted hover:border-primary hover:-translate-y-px"
            onClick={() => navigate("/more/license")}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground shrink-0">
              <ScaleIcon size={20} />
            </span>
            <span className="flex-1 text-sm text-foreground no-underline font-medium">오픈소스 라이센스</span>
          </div>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        {isLoggedIn ? (
          <>
            <button
              onClick={handleLogout}
              className="w-full p-3 mt-4 bg-primary/10 text-primary border border-primary/30 rounded-md text-sm font-medium cursor-pointer transition-all min-h-10 hover:bg-primary/20 hover:border-primary/50"
            >
              로그아웃
            </button>
            <button
              onClick={handleOpenWithdrawModal}
              className="w-full p-3 mt-2 bg-destructive/10 text-destructive/70 border border-destructive/20 rounded-md text-sm font-medium cursor-pointer transition-all min-h-10 hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive"
            >
              회원 탈퇴
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full p-3 mt-4 bg-primary text-primary-foreground border-none rounded-md text-sm font-semibold cursor-pointer transition-all min-h-12 hover:bg-primary/90 hover:-translate-y-px hover:shadow-sm active:translate-y-0"
          >
            로그인
          </button>
        )}
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
          onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
        >
          <div
            className="bg-background rounded-xl p-5 max-w-[400px] w-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-foreground mb-4 text-center">회원 탈퇴</div>

            {/* 로딩 중 */}
            {!withdrawalCheck && !withdrawError && (
              <div className="text-center p-5 text-muted-foreground">
                탈퇴 가능 여부를 확인하고 있습니다...
              </div>
            )}

            {/* 에러 */}
            {withdrawError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-xs mb-3">
                {withdrawError}
              </div>
            )}

            {/* 탈퇴 불가 (양도 필요한 클럽 있음) */}
            {withdrawalCheck && !withdrawalCheck.canWithdraw && (
              <div className="text-left">
                <p className="text-sm text-foreground mb-3 font-medium">{withdrawalCheck.reason}</p>
                <div className="bg-secondary rounded-md p-3 mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">소유권 양도가 필요한 클럽:</p>
                  <ul className="m-0 pl-4">
                    {withdrawalCheck.ownedClubsWithMembers?.map((club) => (
                      <li key={club.clubId} className="text-xs text-foreground mb-1">
                        {club.clubName} (멤버 {club.memberCount}명)
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  클럽 관리 → 소유권 양도 메뉴에서 다른 멤버에게 소유권을 양도한 후 탈퇴할 수 있습니다.
                </p>
              </div>
            )}

            {/* 탈퇴 가능 */}
            {withdrawalCheck?.canWithdraw && (
              <div className="text-left">
                <p className="text-sm text-destructive font-medium mb-3">
                  정말 탈퇴하시겠습니까? 탈퇴 후에는 복구할 수 없습니다.
                </p>

                {/* 삭제될 클럽 안내 */}
                {withdrawalCheck.ownedClubsToDelete && withdrawalCheck.ownedClubsToDelete.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">탈퇴 시 삭제될 클럽:</p>
                    <ul className="m-0 pl-4">
                      {withdrawalCheck.ownedClubsToDelete.map((club) => (
                        <li key={club.clubId} className="text-xs text-foreground mb-1">{club.clubName}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-muted rounded-md p-3 mb-3">
                  <p className="text-xs text-foreground/70 mb-1 leading-relaxed">• 모든 클럽 멤버십이 삭제됩니다</p>
                  <p className="text-xs text-foreground/70 mb-1 leading-relaxed">• 경기 기록은 익명화되어 유지됩니다</p>
                  <p className="text-xs text-foreground/70 mb-0 leading-relaxed">• 작성한 게시글/댓글은 익명으로 표시됩니다</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 p-3 bg-secondary text-white border border-border rounded-md text-sm font-medium cursor-pointer transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
              >
                취소
              </button>
              {withdrawalCheck?.canWithdraw && (
                <button
                  className="flex-1 p-3 bg-destructive text-white border-none rounded-md text-sm font-semibold cursor-pointer transition-all hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "처리 중..." : "탈퇴하기"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorePage;
