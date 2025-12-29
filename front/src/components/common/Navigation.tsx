import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { auth, clearLoginSession } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import './Navigation.css';

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/schedules', label: '일정관리', icon: '📅' },
    { path: '/draws', label: '대진목록', icon: '📋' },
    { path: '/scoreboard', label: '스코어보드', icon: '🏆' },
  ];

  const handleLogout = async () => {
    try {
      // Firebase 로그아웃
      await signOut(auth);
    } catch (error) {
      console.error('❌ Firebase signOut 실패:', error);
    }

    // localStorage 클리어 (Firebase 세션 + 일반 세션)
    clearLoginSession();

    console.log('✅ 로그아웃 완료');

    // 로그인 페이지로 이동
    navigate('/login');
  };

  // 로그인 여부 확인 (간단히)
  const userName = localStorage.getItem('user_name') || localStorage.getItem('devUserName');

  return (
    <>
      {/* Footer 링크 (네비게이션 바 위에 배치) */}
      <div className="navigation-footer">
        <Link to="/terms" className="nav-footer-link">
          서비스 이용약관
        </Link>
        <span className="nav-footer-separator">|</span>
        <a href="mailto:dev.openrun@gmail.com" className="nav-footer-link">
          문의하기
        </a>
      </div>
      <nav className="navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {userName && (
          <div className="nav-user-section">
            <span className="nav-user-name">{userName}</span>
            <button onClick={handleLogout} className="nav-logout-btn">
              로그아웃
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
