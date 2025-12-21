import React from 'react';
import './DrawListPage.css';

const DrawListPage: React.FC = () => {
  return (
    <div className="draw-list-page">
      <div className="page-header">
        <h1>대진 목록</h1>
        <p className="page-description">일정별로 생성된 대진표를 확인하고 경기 결과를 입력하세요</p>
      </div>

      <div className="draw-list-container">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>생성된 대진표가 없습니다</h3>
          <p>일정 관리에서 참가자가 모인 일정의 대진표를 생성해보세요</p>
        </div>
      </div>
    </div>
  );
};

export default DrawListPage;
