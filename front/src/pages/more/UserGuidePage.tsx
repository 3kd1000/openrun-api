import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserGuidePage.css";

interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const guideCategories: GuideCategory[] = [
  {
    id: "getting-started",
    title: "처음 시작하기",
    description: "회원가입부터 클럽 가입까지",
    icon: "🚀",
  },
  {
    id: "club-activities",
    title: "클럽 활동하기",
    description: "일정 참가, 스코어보드, 게시판 이용",
    icon: "🎾",
  },
  {
    id: "club-management",
    title: "클럽 운영하기",
    description: "일정 생성, 대진표 관리, 클럽 설정",
    icon: "⚙️",
  },
];

const UserGuidePage: React.FC = () => {
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/more/user-guide/${categoryId}`);
  };

  return (
    <div className="ug-page">
      {/* Header */}
      <header className="ug-header">
        <button
          onClick={() => navigate(-1)}
          className="ug-back-btn"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ug-title">이용 가이드</h1>
      </header>

      {/* Content */}
      <div className="ug-content">
        <div className="ug-intro">
          <h2>어떤 가이드를 볼까요?</h2>
          <p>원하시는 가이드를 선택해주세요.</p>
        </div>

        <div className="ug-category-list">
          {guideCategories.map((category) => (
            <button
              key={category.id}
              className="ug-category-card"
              onClick={() => handleCategorySelect(category.id)}
            >
              <span className="ug-category-icon">{category.icon}</span>
              <div className="ug-category-text">
                <span className="ug-category-title">{category.title}</span>
                <span className="ug-category-desc">{category.description}</span>
              </div>
              <svg
                className="ug-category-arrow"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        <p className="ug-note">
          각 가이드는 해당 단계에서 새롭게 이용 가능한 기능을 설명합니다.
          <br />
          이전 단계의 내용은 생략되어 있습니다.
        </p>
      </div>
    </div>
  );
};

export default UserGuidePage;
