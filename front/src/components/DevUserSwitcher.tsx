import React, { useState, useEffect } from 'react';
import './DevUserSwitcher.css';

// 테스트 사용자 목록 (V8 마이그레이션 데이터)
export const DEV_USERS = [
  { id: 1, name: '정주상' },
  { id: 2, name: '최승연' },
  { id: 3, name: '김영준' },
  { id: 4, name: '서영재' },
  { id: 5, name: '권종근' },
  { id: 6, name: '송명우' },
  { id: 7, name: '김형준' },
  { id: 8, name: '안현우' },
  { id: 9, name: '김민표' },
  { id: 10, name: '장석원' }
];

const DevUserSwitcher: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('devUserId');
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  const handleUserChange = (userId: number) => {
    localStorage.setItem('devUserId', userId.toString());
    setCurrentUserId(userId);
    setIsOpen(false);
    // 페이지 새로고침하여 변경사항 반영
    window.location.reload();
  };

  const currentUser = DEV_USERS.find(u => u.id === currentUserId);

  // localhost가 아니면 표시하지 않음
  if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return null;
  }

  return (
    <div className="dev-user-switcher">
      <button
        className="dev-user-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="개발용 사용자 전환"
      >
        <span className="user-icon">👤</span>
        <span className="user-name">
          {currentUser ? currentUser.name : '로그인 필요'}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="dev-user-switcher-dropdown">
          <div className="dropdown-header">사용자 전환 (개발용)</div>
          {DEV_USERS.map(user => (
            <button
              key={user.id}
              className={`dropdown-item ${currentUserId === user.id ? 'active' : ''}`}
              onClick={() => handleUserChange(user.id)}
            >
              <span className="user-id">#{user.id}</span>
              <span className="user-name">{user.name}</span>
              {currentUserId === user.id && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevUserSwitcher;
