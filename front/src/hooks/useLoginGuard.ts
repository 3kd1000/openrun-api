import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 로그인이 필요한 액션에 대한 가드 훅
 *
 * 비로그인 상태에서 로그인이 필요한 버튼 클릭 시
 * confirm 안내 → 로그인 페이지 이동을 처리합니다.
 *
 * @returns requireLogin() - 로그인 상태면 true, 비로그인이면 confirm 후 false
 *
 * @example
 * const requireLogin = useLoginGuard();
 *
 * const handleClick = () => {
 *   if (!requireLogin()) return;
 *   // 로그인된 상태에서만 실행되는 로직
 * };
 */
export function useLoginGuard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireLogin = (): boolean => {
    if (user) return true;

    if (confirm('로그인이 필요합니다. 로그인 페이지로 이동할까요?')) {
      sessionStorage.setItem('returnUrl', location.pathname + location.search);
      navigate('/login');
    }
    return false;
  };

  return requireLogin;
}
