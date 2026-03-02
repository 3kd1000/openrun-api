import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Trophy, Users, Search } from "lucide-react";

const videos = [
  {
    src: "/intro/video/04_create_pwa.mp4",
    title: "PWA 앱 설치",
    description: "알림기능, 주소창 없는 전체화면",
  },
  {
    src: "/intro/video/01_create_club.mp4",
    title: "클럽 관리",
    description: "클럽 생성, 멤버 초대, 공용구 관리",
  },
  {
    src: "/intro/video/02_create_schedule.mp4",
    title: "일정 & 참가 신청",
    description: "일정 확인부터 참가 신청까지 한 번에",
  },
  {
    src: "/intro/video/03_create_draw.mp4",
      title: "대진표 생성",
      description: "대진표 자동 생성, 수동 편집, 경기 결과 입력",
  },

];

const features = [
  {
    image: "/intro/intro_01.png",
    title: "일정 관리",
    description: "클럽 일정을 캘린더와 리스트로 한눈에 확인",
  },
  {
    image: "/intro/intro_02.png",
    title: "참가 신청",
    description: "원하는 일정에 터치 한 번으로 참가 신청",
  },
  {
    image: "/intro/intro_03.png",
    title: "일정 상세",
    description: "참가자 목록, 코트 정보, 모집 현황 확인",
  },
  {
    image: "/intro/intro_04.png",
    title: "대진표 생성",
    description: "한울방식 / 수동대진 생성, 경기결과 입력",
  },
  {
    image: "/intro/intro_05.png",
    title: "랭킹 & 기록",
    description: "개인별/시즌별 경기 기록과 랭킹 자동 집계",
  },
  {
    image: "/intro/intro_07.png",
    title: "클럽 탐색",
    description: "지역별, 코트별, 모집 현황 확인",
  },
  {
    image: "/intro/intro_06.png",
    title: "클럽 홈",
    description: "클럽 현황, 공지사항, 멤버 조회 등 한눈에",
  },
  {
    image: "/intro/intro_08.png",
    title: "공용구 관리",
    description: "공용구 입고, 배분, 재고 현황 관리",
  },
];

const featureCards = [
  {
    icon: CalendarDays,
    title: "일정 & 참가",
    desc: "등록부터 신청, 대기순번까지",
  },
  {
    icon: Trophy,
    title: "대진표 & 기록",
    desc: "자동 생성, 결과 입력, 랭킹",
  },
  {
    icon: Users,
    title: "클럽 관리",
    desc: "멤버, 공지, 공용구 관리",
  },
  {
    icon: Search,
    title: "클럽 탐색",
    desc: "지역별 검색, 게스트 모집",
  },
];

/* ------------------------------------------------------------------ */
/*  VideoModal                                                          */
/* ------------------------------------------------------------------ */
const VideoModal: React.FC<{
  video: { src: string; title: string; description: string };
  onClose: () => void;
}> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play();
  }, [video.src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="relative max-w-[400px] max-h-[85vh] w-full bg-black rounded-2xl overflow-hidden flex flex-col max-md:max-w-[90vw] max-md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white/85 border-none rounded-full text-secondary text-lg cursor-pointer z-10 flex items-center justify-center hover:bg-white transition-colors"
          onClick={onClose}
        >
          ✕
        </button>
        <video
          ref={videoRef}
          src={video.src}
          controls
          controlsList="nodownload"
          playsInline
          onContextMenu={(e) => e.preventDefault()}
          className="w-full flex-1 min-h-0 object-contain block"
        />
        <div className="p-5 text-center bg-white shrink-0">
          <h3 className="text-xl font-semibold text-secondary mb-2 mt-0">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground m-0">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  IntroPage                                                           */
/* ------------------------------------------------------------------ */
const IntroPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">

      {/* ── 1. Hero ── */}
      <section className="bg-secondary px-6 pt-14 pb-12 text-center">
        <img
          src="/icon-192x192-v4.png"
          alt="OpenRun"
          className="w-20 h-20 mx-auto mb-3 rounded-2xl"
        />
        <h1 className="text-3xl font-extrabold text-white m-0 mb-2">OpenRun</h1>
        <p className="text-lg font-medium text-white mb-2">
          테니스 클럽 운영, 이제 한곳에서.
        </p>
        <p className="text-sm text-white/75 mb-8">
          일정 관리부터 대진표, 경기 기록까지
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/login"
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-sm no-underline hover:bg-primary/90 transition-colors"
          >
            지금 시작하기
          </Link>
          <Link
            to="/explore"
            className="px-6 py-2.5 bg-white/20 text-white font-medium rounded-full text-sm no-underline hover:bg-white/30 transition-colors"
          >
            둘러보기
          </Link>
        </div>
      </section>

      {/* ── 2. Pain Point ── */}
      <section className="px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed m-0">
          단톡방으로 참가 확인, 엑셀로 대진표, 수기로 기록 관리...
          <br />
          클럽 운영에 필요한 것들,{" "}
          <span className="font-semibold text-secondary">
            이제 한곳에서 해결하세요.
          </span>
        </p>
      </section>

      {/* ── 3. Feature Cards ── */}
      <section id="features" className="px-6 pb-8">
        <h2 className="text-base font-bold text-secondary mb-4">주요 기능</h2>
        <div className="grid grid-cols-2 gap-3">
          {featureCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-white border border-border rounded-xl p-4"
              >
                <Icon className="w-5 h-5 text-secondary mb-2" />
                <h3 className="text-sm font-bold text-secondary mb-1 mt-0">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4a. Media Carousel: Videos ── */}
      <section className="pb-8">
        <h2 className="text-base font-bold text-secondary mb-4 px-6">
          사용 예시
        </h2>
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {videos.map((video, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[200px] cursor-pointer"
              onClick={() => setSelectedVideo(i)}
            >
              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-muted">
                <video
                  src={`${video.src}#t=0.001`}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover object-top pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary text-lg shadow-lg">
                    ▶
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-secondary mt-2 mb-0.5">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                {video.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4b. Feature Screenshots Carousel ── */}
      <section className="pb-8">
        <h2 className="text-base font-bold text-secondary mb-4 px-6">
          주요 화면
        </h2>
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[200px] cursor-pointer"
              onClick={() => setSelectedImage(i)}
            >
              <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-muted">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="text-sm font-semibold text-secondary mt-2 mb-0.5">
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground m-0">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Free Service + CTA ── */}
      <section className="px-6 pb-8">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3">
            무료 웹서비스
          </span>
          <p className="text-sm text-secondary leading-relaxed mb-1">
            앱 설치 없이 브라우저로 바로 접속하세요.
          </p>
          <p className="text-sm text-secondary leading-relaxed mb-5">
            홈 화면에 추가하면 앱처럼 사용 가능합니다.
          </p>
          <Link
            to="/login"
            className="block w-full py-3.5 bg-primary text-white text-base font-bold rounded-xl text-center no-underline hover:bg-primary/90 transition-colors"
          >
            지금 시작하기
          </Link>
        </div>
      </section>

      {/* ── 6. Footer ── */}
      <footer className="bg-secondary px-6 py-8 text-center">
        <a
          href="https://open.kakao.com/o/s2uaa3ei"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white font-medium no-underline hover:underline"
        >
          카카오톡 오픈채팅으로 문의하기 →
        </a>
        <div className="flex gap-3 justify-center mt-4 text-xs text-white/60">
          <Link
            to="/more/terms"
            className="text-white/60 no-underline hover:text-white transition-colors"
          >
            이용약관
          </Link>
        </div>
      </footer>

      {/* ── Image Modal ── */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-5"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-[400px] w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden flex flex-col max-md:max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 border-none rounded-full text-white text-lg cursor-pointer z-10 flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img
              src={features[selectedImage].image}
              alt={features[selectedImage].title}
              className="w-full block min-h-0 object-contain flex-1"
            />
            <div className="p-5 text-center">
              <h3 className="text-xl font-semibold text-secondary mt-0 mb-2">
                {features[selectedImage].title}
              </h3>
              <p className="text-sm text-muted-foreground m-0">
                {features[selectedImage].description}
              </p>
            </div>
            <div className="flex justify-between items-center px-5 py-4 border-t border-border bg-muted">
              <button
                className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(
                    selectedImage === 0 ? features.length - 1 : selectedImage - 1
                  );
                }}
              >
                ← 이전
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedImage + 1} / {features.length}
              </span>
              <button
                className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(
                    selectedImage === features.length - 1 ? 0 : selectedImage + 1
                  );
                }}
              >
                다음 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Modal ── */}
      {selectedVideo !== null && (
        <VideoModal
          video={videos[selectedVideo]}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default IntroPage;
