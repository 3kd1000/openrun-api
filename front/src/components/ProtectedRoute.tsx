import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTokenValid, clearLoginSession } from '../services/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 *
 * 사용법:
 * <Route path="/schedules" element={<ProtectedRoute><ScheduleListPage /></ProtectedRoute>} />
 *
 * AuthContext의 isAuthReady와 user를 사용하여 인증 상태를 확인하고,
 * Firebase 토큰 유효성을 검증하여 localStorage에 정보가 있어도
 * 토큰이 유효하지 않으면 미로그인으로 처리합니다.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthReady, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Firebase 인증 상태 복원이 완료될 때까지 대기
      if (!isAuthReady) {
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
          // 토큰이 유효하지 않으면 세션 클리어 및 미로그인 처리
          console.warn('⚠️ Firebase 토큰이 유효하지 않음 → 세션 클리어 및 로그인 페이지로 리다이렉트');
          clearLoginSession();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        clearLoginSession();
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [isAuthReady, user]);

  // Firebase 인증 상태 복원 대기 또는 토큰 검증 중에는 로딩 상태
  if (!isAuthReady || isChecking) {
    return null; // 또는 <LoadingSpinner /> 등
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
