import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 *
 * 사용법:
 * <Route path="/schedules" element={<ProtectedRoute><ScheduleListPage /></ProtectedRoute>} />
 *
 * TODO: SecurityConfig에서 API 인증을 켜면 이 컴포넌트도 활성화
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // localStorage에서 로그인 정보 확인
  const userId = localStorage.getItem('user_id');
  const firebaseToken = localStorage.getItem('firebase_token');

  // OAuth 로그인 확인
  const isAuthenticated = !!userId || !!firebaseToken;

  if (!isAuthenticated) {
    console.warn('⚠️ 로그인이 필요합니다. /login으로 리다이렉트');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
