import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const videos = [
  {
    src: "/intro/video/03_schedule_quick.mp4",
    title: "일정 & 참가 신청",
    description: "일정 확인부터 참가 신청까지 한 번에",
  },
  {
    src: "/intro/video/01_draw_ranking.mp4",
    title: "대진표 & 랭킹",
    description: "대진표 자동 생성, 경기 결과 입력, 랭킹 확인",
  },
  {
    src: "/intro/video/02_club.mp4",
    title: "클럽 관리",
    description: "클럽 관리, 멤버 초대, 공용구 관리",
  },
];

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
          className="absolute top-3 right-3 w-9 h-9 bg-white/85 border-none rounded-full text-[#333] text-lg cursor-pointer z-10 flex items-center justify-center hover:bg-white"
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
          <h3 className="text-xl font-semibold text-[#212529] mb-2 mt-0">{video.title}</h3>
          <p className="text-sm text-[#6c757d] m-0">{video.description}</p>
        </div>
      </div>
    </div>
  );
};

const IntroPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);

  const features = [
    {
      image: "/intro/01_일정조회.png",
      title: "일정 관리",
      description: "클럽 일정을 캘린더와 리스트로 한눈에 확인",
    },
    {
      image: "/intro/02_참가신청.png",
      title: "참가 신청",
      description: "원하는 일정에 터치 한 번으로 참가 신청",
    },
    {
      image: "/intro/03_일정상세.png",
      title: "일정 상세",
      description: "참가자 목록, 코트 정보, 모집 현황, 대기순번 등 확인",
    },
    {
      image: "/intro/04_대진생성_결과입력.png",
      title: "대진표 생성",
      description: "한울방식 / 수동대진 생성, 경기결과 입력",
    },
    {
      image: "/intro/05_랭킹_기록.png",
      title: "랭킹 & 기록",
      description: "개인별/시즌별 경기 기록과 랭킹 자동 집계",
    },
    {
      image: "/intro/06_클럽탐색.png",
      title: "클럽 탐색",
      description: "지역별, 코트별, 모집 현황 확인",
    },
    {
      image: "/intro/07_클럽메인.png",
      title: "클럽 홈",
      description: "클럽 현황, 공지사항, 멤버 조회 등 한눈에",
    },
    {
      image: "/intro/08_공용구관리.png",
      title: "공용구 관리",
      description: "공용구 입고, 배분, 재고 현황 관리",
    },
  ];

  /* Shared section card classes */
  const sectionCard = "bg-white rounded-2xl p-8 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] max-md:p-5 max-md:px-5 max-md:mb-4";
  const sectionH2 = "text-2xl font-bold text-[#212529] mt-0 mb-5 pb-3 border-b-2 border-[#667eea] max-md:text-xl";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]">
      <div className="max-w-[900px] mx-auto px-6 py-10 max-md:px-4 max-md:py-5">

        {/* 헤더 */}
        <header className="text-center pt-10 pb-15 max-md:pt-6 max-md:pb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl max-md:text-4xl">🎾</span>
            <h1 className="text-5xl font-extrabold text-white m-0 [text-shadow:0_2px_10px_rgba(0,0,0,0.2)] max-md:text-4xl">
              OpenRun
            </h1>
          </div>
          <p className="text-xl text-white/90 m-0 font-medium max-md:text-base">
            테니스 클럽을 위한 일정 관리 & 대진표 서비스
          </p>
        </header>

        {/* 소개 섹션 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>안녕하세요!</h2>
          <div>
            <p className="text-base leading-[1.8] text-[#495057] mb-4 max-md:text-[15px]">
              저는 테니스를 즐기는 5년차 동호인이자 개발자로 일하고 있는 직장인입니다.
              저희 클럽에서 겪었던 불편함들을 해결해 보고자 테니스 클럽 관리 서비스인{" "}
              <strong className="text-[#667eea]">OpenRun</strong>을 개발했습니다.
            </p>
            <p className="text-base leading-[1.8] text-[#495057] mb-4 max-md:text-[15px]">
              단체 카톡방, 네이버 밴드, 소모임 등의 어플로 참가 확인하고, 엑셀이나 구글문서로 대진표 만들고,
              수기로 기록 관리하는 번거로움... 다들 비슷하게 겪고 계시지 않나요?
            </p>
            <p className="text-base leading-[1.8] text-[#495057] mb-4 max-md:text-[15px]">
              현재 저희 클럽에서는 2026년 1월부터 일정등록, 참가신청, 대진생성, 경기기록 입력 등의 기능을 OpenRun을 통해 활용하고 있습니다.
              저희 클럽에서만 쓰기에는 아쉽다는 생각이 들어, 비슷한 고민을 하고 계신 다른 클럽들에게도 제공하기로 했습니다.
            </p>
            <p className="text-base leading-[1.8] text-[#495057] mb-4 max-md:text-[15px]">
              OpenRun은 무료로 이용할 수 있는 <strong className="text-[#667eea]">웹서비스</strong>입니다. <br />
              앱 설치 없이 스마트폰 또는 PC 브라우저로 접속할 수 있고, 홈화면에 바로가기 추가하면 걸리적거리는 주소창 없이 전체화면으로 사용할 수 있습니다.
            </p>
            <p className="text-base leading-[1.8] text-[#495057] mb-0 max-md:text-[15px]">
              클럽 관리 서비스이다보니, 클럽을 개설 및 가입까지 되어야 전체 기능을 제대로 체험해보실 수 있습니다.
              따라서, 저희 클럽에서 사용 중인 실제 화면을 영상과 이미지로 준비했습니다.
              아래 주요 기능을 살펴보시고, 클럽 개설이나 운영에 궁금한 점이 있으시면 편하게 문의해 주세요.
            </p>
          </div>
        </section>

        {/* 사용 예시 영상 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>사용 예시</h2>
          <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-4">
            {videos.map((video, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-xl overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(102,126,234,0.2)]"
                onClick={() => setSelectedVideo(index)}
              >
                <div className="relative w-full aspect-[9/16] overflow-hidden bg-[#e9ecef]">
                  <video
                    src={`${video.src}#t=0.001`}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover object-top block pointer-events-none"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-[background] duration-200 group-hover:bg-black/5">
                    <span className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-[22px] text-[#667eea] shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-110 max-md:w-12 max-md:h-12 max-md:text-lg">
                      ▶
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[#212529] mt-0 mb-1.5">{video.title}</h3>
                  <p className="text-sm text-[#6c757d] m-0 leading-[1.5]">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 기능 소개 갤러리 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>주요 기능</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 max-md:grid-cols-2 max-md:gap-3 max-[400px]:grid-cols-1">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-xl overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(102,126,234,0.2)]"
                onClick={() => setSelectedImage(index)}
              >
                <div className="w-full aspect-[9/16] overflow-hidden bg-[#e9ecef]">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 max-md:p-3">
                  <h3 className="text-lg font-semibold text-[#212529] mt-0 mb-2 max-md:text-sm">{feature.title}</h3>
                  <p className="text-sm text-[#6c757d] m-0 leading-[1.5] max-md:text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 왜 무료인가 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>왜 무료인가요?</h2>
          <ul className="list-none p-0 m-0">
            {[
              <>테니스 클럽 관리 서비스에 대한 <strong className="text-[#667eea]">재능기부</strong>입니다</>,
              <>서버 비용은 제가 부담합니다. (사용자가 많아지면 최소한의 광고가 추가될 수 있어요)</>,
              <>유료화 계획 없음, <strong className="text-[#667eea]">개인정보 최소 수집, 암호화 저장</strong></>,
              <>1인 개발 프로젝트로 부족한 점이 많습니다. 피드백은 언제나 환영합니다.</>,
            ].map((item, i, arr) => (
              <li
                key={i}
                className={`flex items-start gap-3.5 py-4 text-base text-[#495057] leading-[1.6] max-md:text-[15px] max-md:py-3${i < arr.length - 1 ? ' border-b border-[#e9ecef]' : ''}`}
              >
                <span
                  className="shrink-0 w-2 h-2 mt-2 rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] shadow-[0_2px_4px_rgba(102,126,234,0.3)] max-md:w-1.5 max-md:h-1.5 max-md:mt-[7px]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 시작하기 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>시작하기</h2>
          <div className="text-center">
            <p className="text-base text-[#495057] leading-[1.8] mb-6 max-md:text-[15px]">
              Google, 카카오 계정으로 간편하게 시작할 수 있습니다.
              <br />
              클럽을 만들고 멤버들을 초대해 보세요!
            </p>
            <div className="flex gap-4 justify-center flex-wrap max-md:flex-col max-md:gap-3">
              <Link
                to="/login"
                className="inline-block px-8 py-3.5 rounded-lg text-base font-semibold no-underline transition-all duration-200 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(102,126,234,0.4)] max-md:w-full max-md:text-center max-md:py-4 max-md:px-6"
              >
                지금 시작하기
              </Link>
              <Link
                to="/more/user-guide"
                className="inline-block px-8 py-3.5 rounded-lg text-base font-semibold no-underline transition-all duration-200 bg-[#f8f9fa] text-[#667eea] border-2 border-[#667eea] hover:bg-[#667eea] hover:text-white max-md:w-full max-md:text-center max-md:py-4 max-md:px-6"
              >
                이용 가이드 (준비중)
              </Link>
            </div>
          </div>
        </section>

        {/* 홈화면 추가 안내 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>홈 화면에 추가하기</h2>
          <p className="text-base text-[#495057] leading-[1.8] mb-5 max-md:text-[15px]">
            앱 설치 없이, 홈 화면에 추가하면 주소창 없이 전체 화면으로 사용할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div className="bg-[#f8f9fa] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#667eea] mt-0 mb-3">iPhone (Safari)</h3>
              <ol className="m-0 pl-5">
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm">Safari에서 OpenRun 접속</li>
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm">하단 <strong className="text-[#212529]">공유 버튼</strong> (네모+화살표) 탭</li>
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm"><strong className="text-[#212529]">"홈 화면에 추가"</strong> 선택</li>
              </ol>
            </div>
            <div className="bg-[#f8f9fa] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#667eea] mt-0 mb-3">Android (Chrome)</h3>
              <ol className="m-0 pl-5">
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm">Chrome에서 OpenRun 접속</li>
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm">우측 상단 <strong className="text-[#212529]">메뉴 (⋮)</strong> 탭</li>
                <li className="text-[15px] text-[#495057] leading-[1.8] max-md:text-sm"><strong className="text-[#212529]">"홈 화면에 추가"</strong> 선택</li>
              </ol>
            </div>
          </div>
        </section>

        {/* 문의 */}
        <section className={sectionCard}>
          <h2 className={sectionH2}>문의하기</h2>
          <p className="text-base text-[#495057] leading-[1.8] m-0">
            궁금한 점이나 피드백이 있으시면 편하게 연락 주세요.
            <br />
            <a
              href="https://open.kakao.com/o/s2uaa3ei"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-[#667eea] font-semibold no-underline hover:underline"
            >
              카카오톡 오픈채팅으로 문의하기 →
            </a>
          </p>
        </section>

        {/* 푸터 */}
        <footer className="text-center py-8 text-white/80">
          <div className="flex gap-3 justify-center text-sm">
            <Link to="/more/terms" className="text-white/80 no-underline hover:text-white hover:underline">이용약관</Link>
            <span className="text-white/50">|</span>
            <Link to="/" className="text-white/80 no-underline hover:text-white hover:underline">대진표 생성 (비회원용)</Link>
          </div>
        </footer>
      </div>

      {/* 이미지 모달 */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-5"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-[400px] w-full bg-white rounded-2xl overflow-hidden max-md:max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 border-none rounded-full text-white text-lg cursor-pointer z-10 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img
              src={features[selectedImage].image}
              alt={features[selectedImage].title}
              className="w-full block"
            />
            <div className="p-5 text-center">
              <h3 className="text-xl font-semibold text-[#212529] mt-0 mb-2">{features[selectedImage].title}</h3>
              <p className="text-sm text-[#6c757d] m-0">{features[selectedImage].description}</p>
            </div>
            <div className="flex justify-between items-center px-5 py-4 border-t border-[#e9ecef] bg-[#f8f9fa]">
              <button
                className="bg-none border-none text-[#667eea] text-sm font-semibold cursor-pointer px-4 py-2 rounded-md transition-[background] duration-200 hover:bg-[#e9ecef]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(
                    selectedImage === 0 ? features.length - 1 : selectedImage - 1
                  );
                }}
              >
                ← 이전
              </button>
              <span className="text-sm text-[#6c757d]">
                {selectedImage + 1} / {features.length}
              </span>
              <button
                className="bg-none border-none text-[#667eea] text-sm font-semibold cursor-pointer px-4 py-2 rounded-md transition-[background] duration-200 hover:bg-[#e9ecef]"
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

      {/* 비디오 모달 */}
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
