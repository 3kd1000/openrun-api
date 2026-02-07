import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserGuideSlide, {
  type UserGuideStep,
} from "../../components/common/UserGuideSlide";
import "./UserGuidePage.css";

interface GuideSlideData {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  steps: UserGuideStep[];
}

interface CategoryData {
  title: string;
  slides: GuideSlideData[];
}

// 카테고리별 가이드 데이터
const guideCategoryData: Record<string, CategoryData> = {
  "getting-started": {
    title: "처음 시작하기",
    slides: [
      {
        id: "gs-1",
        title: "앱 시작하기",
        description: "OpenRun에 오신 것을 환영합니다!",
        imageSrc: "/getting-started/01_로그인.png",
        steps: [
          {
            number: 1,
            text: "Google, 카카오 계정으로 간편하게 로그인하세요.",
            badgePosition: { top: "29%", left: "21%" }
          },
        ],
      },
      // 추가 슬라이드는 이미지 준비 후 작성
    ],
  },
  "club-activities": {
    title: "클럽 활동하기",
    slides: [
      {
        id: "ca-1",
        title: "일정 확인하기",
        description: "클럽의 일정을 캘린더와 리스트로 확인할 수 있습니다.",
        imageSrc: "/assets/images/guide-club-activities-01.png",
        steps: [
          {
            number: 1,
            text: "상단에서 캘린더뷰와 리스트뷰를 전환할 수 있습니다.",
            badgePosition: { top: "15%", left: "50%" },
          },
        ],
      },
      // 추가 슬라이드는 이미지 준비 후 작성
    ],
  },
  "club-management": {
    title: "클럽 운영하기",
    slides: [
      {
        id: "cm-1",
        title: "일정 생성하기",
        description: "운영자는 새로운 일정을 생성할 수 있습니다.",
        imageSrc: "/assets/images/guide-club-management-01.png",
        steps: [
          {
            number: 1,
            text: "우측 하단의 + 버튼을 눌러 새 일정을 생성하세요.",
            badgePosition: { top: "85%", left: "85%" },
          },
        ],
      },
      // 추가 슬라이드는 이미지 준비 후 작성
    ],
  },
};

const UserGuideDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const categoryData = category ? guideCategoryData[category] : null;
  const slides = categoryData?.slides ?? [];
  const title = categoryData?.title ?? "";
  const currentSlide = slides[currentSlideIndex];

  // --- Handlers (모든 훅은 early return 이전에 선언) ---
  const scrollToTop = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  const handleBadgeClick = useCallback((stepNumber: number) => {
    const element = document.getElementById(`step-desc-${stepNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("active");
      setTimeout(() => element.classList.remove("active"), 2000);
    }
  }, []);

  // 잘못된 카테고리 접근 시 가이드 메인으로 리다이렉트
  useEffect(() => {
    if (category && !guideCategoryData[category]) {
      navigate("/more/user-guide", { replace: true });
    }
  }, [category, navigate]);

  // Auto scroll to top when slide changes
  useEffect(() => {
    scrollToTop();
  }, [currentSlideIndex, scrollToTop]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // 잘못된 카테고리면 렌더링 하지 않음
  if (!categoryData) {
    return null;
  }

  return (
    <div className="ug-page">
      {/* Header */}
      <header className="ug-header">
        <button
          onClick={() => navigate("/more/user-guide")}
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
        <h1 className="ug-title">{title}</h1>
      </header>

      {/* Content */}
      <div className="ug-content" ref={contentRef}>
        {currentSlide && (
          <UserGuideSlide
            imageSrc={currentSlide.imageSrc}
            title={currentSlide.title}
            description={currentSlide.description}
            steps={currentSlide.steps}
            onBadgeClick={handleBadgeClick}
            onSwipeLeft={handleNext}
            onSwipeRight={handlePrev}
          />
        )}

        {/* Carousel Controls (Only show if multiple slides) */}
        {slides.length > 1 && (
          <div className="ug-carousel-controls">
            <div className="ug-nav-buttons">
              <button
                className="ug-nav-btn"
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
              >
                이전
              </button>
              <button
                className="ug-nav-btn"
                onClick={handleNext}
                disabled={currentSlideIndex === slides.length - 1}
              >
                다음
              </button>
            </div>
            <div className="ug-dots">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`ug-dot ${idx === currentSlideIndex ? "active" : ""}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 다른 가이드 보기 링크 */}
        <button
          className="ug-other-guide-btn"
          onClick={() => navigate("/more/user-guide")}
        >
          다른 가이드 보기
        </button>
      </div>
    </div>
  );
};

export default UserGuideDetailPage;
