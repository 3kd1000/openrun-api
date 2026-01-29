import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

/**
 * 가이드 에디터 (개발용)
 * - 이미지 클릭 시 좌표(%)를 클립보드에 복사
 * - UserGuideDetailPage.tsx에 붙여넣어 마커 위치 설정
 * - 개발 환경에서만 접근 가능
 */
const GuideEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDevMode, setIsDevMode] = useState(true); // 기본 켜짐
  const contentRef = useRef<HTMLDivElement>(null);

  // --- 편집할 슬라이드 데이터 (여기에 이미지 경로와 임시 step 추가) ---
  const guideSlides: GuideSlideData[] = [
    {
      id: "editor-slide-1",
      title: "가이드 이미지 편집",
      description: "이미지를 클릭하면 해당 위치의 좌표가 복사됩니다.",
      imageSrc: "/assets/images/guide-01-schedule-calendar.jpeg", // 편집할 이미지 경로
      steps: [
        {
          number: 1,
          text: "샘플 마커입니다. 이미지를 클릭하여 새 좌표를 추가하세요.",
          badgePosition: { top: "50%", left: "50%" },
        },
      ],
    },
    // 추가 이미지를 여기에 넣어서 편집
  ];

  const currentSlide = guideSlides[currentSlideIndex];

  const scrollToTop = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlideIndex < guideSlides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [currentSlideIndex, guideSlides.length]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  useEffect(() => {
    scrollToTop();
  }, [currentSlideIndex, scrollToTop]);

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

  const handleBadgeClick = (stepNumber: number) => {
    const element = document.getElementById(`step-desc-${stepNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("active");
      setTimeout(() => element.classList.remove("active"), 2000);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDevMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const topPercent = Math.round((y / rect.height) * 100);
    const leftPercent = Math.round((x / rect.width) * 100);

    const positionStr = `badgePosition: { top: "${topPercent}%", left: "${leftPercent}%" }`;

    navigator.clipboard
      .writeText(positionStr)
      .then(() => {
        alert(
          `✅ 좌표 복사 완료!\n\n${positionStr}\n\nUserGuideDetailPage.tsx의 steps 배열에 붙여넣으세요.`
        );
      })
      .catch(() => {
        alert(`좌표 확인: ${positionStr}`);
      });
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
        <h1 className="ug-title">가이드 에디터 (개발용)</h1>
      </header>

      {/* Content */}
      <div className="ug-content" ref={contentRef}>
        <div className="ug-editor-notice">
          <p>이 페이지는 <strong>개발 환경에서만</strong> 접근 가능합니다.</p>
          <p>이미지를 클릭하면 해당 위치의 좌표(%)가 클립보드에 복사됩니다.</p>
        </div>

        <UserGuideSlide
          imageSrc={currentSlide.imageSrc}
          title={currentSlide.title}
          description={currentSlide.description}
          steps={currentSlide.steps}
          onBadgeClick={handleBadgeClick}
          onImageClick={handleImageClick}
          onSwipeLeft={handleNext}
          onSwipeRight={handlePrev}
          isDevMode={isDevMode}
        />

        {guideSlides.length > 1 && (
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
                disabled={currentSlideIndex === guideSlides.length - 1}
              >
                다음
              </button>
            </div>
            <div className="ug-dots">
              {guideSlides.map((_, idx) => (
                <div
                  key={idx}
                  className={`ug-dot ${idx === currentSlideIndex ? "active" : ""}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          className={`ug-dev-mode-toggle ${isDevMode ? "active" : ""}`}
          onClick={() => setIsDevMode(!isDevMode)}
        >
          {isDevMode
            ? "🛠️ 좌표 찾기 켜짐 (이미지를 클릭하세요)"
            : "🛠️ 좌표 찾기 꺼짐"}
        </button>
      </div>
    </div>
  );
};

export default GuideEditorPage;
