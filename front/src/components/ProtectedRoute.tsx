import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTokenValid } from '../services/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 *
 * 사용법:
 * <Route path="/schedules" element={<ProtectedRoute><ScheduleListPage /></ProtectedRoute>} />
 *
 * AuthContext의 isAuthReady, isTokenRefreshing, user를 사용하여 인증 상태를 확인하고,
 * Firebase 토큰 유효성을 검증하여 localStorage에 정보가 있어도
 * 토큰이 유효하지 않으면 미로그인으로 처리합니다.
 *
 * 토큰 갱신 중에는 "인증 확인 중..." 대기 UI를 표시합니다.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthReady, isTokenRefreshing, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Firebase 인증 상태 복원이 완료될 때까지 대기
      if (!isAuthReady) {
        return;
      }

      // 토큰 갱신 중이면 검사 보류 (대기 UI 표시)
      if (isTokenRefreshing) {
        return;
      }

      // 사용자가 없으면 미로그인
      if (!user) {
        console.warn('⚠️ Firebase 사용자 없음 → 로그인 페이지로 리다이렉트');
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        // Firebase 토큰 유효성 검증
        const tokenValid = await isTokenValid();

        if (tokenValid) {
          setIsAuthenticated(true);
        } else {
          // 토큰이 유효하지 않으면 미로그인 처리 (세션 데이터는 보존)
          // clearLoginSession()은 명시적 로그아웃 시에만 호출
          console.warn('⚠️ Firebase 토큰이 유효하지 않음 → 로그인 페이지로 리다이렉트 (세션 보존)');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    // 아직 인증 확인이 안 된 경우에만 로딩 UI 표시
    // (이미 인증된 상태에서 45분 주기 토큰 갱신 시 화면 깜빡임 방지)
    if (!isAuthenticated) {
      setIsChecking(true);
    }
    checkAuth();
  }, [isAuthReady, user, isTokenRefreshing]);

  // Firebase 인증 상태 복원 대기 또는 토큰 검증 중에는 대기 UI 표시
  if (!isAuthReady || isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-9 h-9 border-[3px] border-gray-200 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm m-0">세션 복원 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 로그인 후 돌아올 URL 저장 (pathname + search)
    const returnUrl = location.pathname + location.search;
    sessionStorage.setItem('returnUrl', returnUrl);
    console.log(`🔗 로그인 후 돌아갈 URL 저장: ${returnUrl}`);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
