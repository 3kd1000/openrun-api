import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserGuideSlide, {
  type UserGuideStep,
} from "../../components/common/UserGuideSlide";
import "./UserGuidePage.css";

interface GuideSlideData {
  id: string; // unique identifier
  title: string;
  description: string;
  imageSrc: string;
  steps: UserGuideStep[];
}

const UserGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Data Definition (Multi-slide) ---
  const guideSlides: GuideSlideData[] = [
    {
      id: "more-guide2",
      title: "더보기 화면 가이드",
      description: "내 정보 관리와 앱 설정을 위한 공간입니다.",
      imageSrc: "/assets/images/guide-01-schedule-calendar.jpeg",
      steps: [
        {
          number: 1,
          text: "프로필 카드: 내 사진과 이름을 확인하고, 클릭하여 프로필을 수정할 수 있습니다.",
          badgePosition: { top: "15%", left: "50%" },
        },
        {
          number: 2,
          text: "내 정보: 연동된 소셜 계정을 관리하거나 내가 가입한 클럽 목록을 볼 수 있습니다.",
          badgePosition: { top: "35%", left: "50%" },
        },
        {
          number: 3,
          text: "서비스 메뉴: 이용약관, 오픈소스 라이센스 확인 및 문의하기 기능을 제공합니다.",
          badgePosition: { top: "60%", left: "50%" },
        },
        {
          number: 4,
          text: "로그아웃: 앱에서 현재 계정의 접속을 종료합니다.",
          badgePosition: { top: "85%", left: "50%" },
        },
      ],
    },
    // Future slides can be added here
  ];

  const currentSlide = guideSlides[currentSlideIndex];

  // --- Handlers ---
  const scrollToTop = useCallback(() => {
    // Scroll to top of content area
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Fallback: scroll window
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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

  // Auto scroll to top when slide changes
  useEffect(() => {
    scrollToTop();
  }, [currentSlideIndex, scrollToTop]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
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

    // Calculate % position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const topPercent = Math.round((y / rect.height) * 100);
    const leftPercent = Math.round((x / rect.width) * 100);

    const positionStr = `top: "${topPercent}%", left: "${leftPercent}%"`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(positionStr)
      .then(() => {
        alert(
          `✅ 좌표 복사 완료!\n\n${positionStr}\n\nUserGuidePage.tsx에 붙여넣으세요.`
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
          aria-label="Go Back"
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
      <div className="ug-content" ref={contentRef}>
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

        {/* Carousel Controls (Only show if multiple slides) */}
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
                  className={`ug-dot ${
                    idx === currentSlideIndex ? "active" : ""
                  }`}
                  onClick={() => setCurrentSlideIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dev Mode Toggle */}
        <button
          className={`ug-dev-mode-toggle ${isDevMode ? "active" : ""}`}
          onClick={() => setIsDevMode(!isDevMode)}
        >
          {isDevMode
            ? "🛠️ 좌표 찾기 켜짐 (이미지를 클릭하세요)"
            : "🛠️ 좌표 찾기 꺼짐 (개발자용)"}
        </button>
      </div>
    </div>
  );
};

export default UserGuidePage;
