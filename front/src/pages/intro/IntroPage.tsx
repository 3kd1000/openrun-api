import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./IntroPage.css";

const IntroPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

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
      description: "한울방식 KDK, 수동 대진 방식, 경기결과 입력",
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

  return (
    <div className="intro-page">
      <div className="intro-container">
        {/* 헤더 */}
        <header className="intro-header">
          <div className="intro-logo">
            <span className="logo-icon">🎾</span>
            <h1>OpenRun</h1>
          </div>
          <p className="intro-tagline">테니스 클럽을 위한 일정 관리 & 대진표 서비스</p>
        </header>

        {/* 소개 섹션 */}
        <section className="intro-about">
          <h2>안녕하세요!</h2>
          <div className="about-content">
            <p>
              저는 테니스를 즐기는 5년차 동호인이자 개발자로 일하고 있는 직장인입니다.
              저희 클럽에서 겪었던 불편함들을 해결해 보고자 테니스 클럽 관리 서비스인 <strong>OpenRun</strong>을 개발했습니다. 
            </p>
            <p>
              단체 카톡방, 네이버 밴드, 소모임 등의 어플로 참가 확인하고, 엑셀이나 구글문서로 대진표 만들고,
              수기로 기록 관리하는 번거로움... 다들 비슷하게 겪고 계시지 않나요?
            </p>
            <p>
              현재 저희 클럽에서는 2026년 1월부터 일정등록, 참가신청, 대진생성, 경기기록 입력 등의 기능을 OpenRun을 통해 활용하고 있습니다.
              저희 클럽에서만 쓰기에는 아쉽다는 생각이 들어, 비슷한 고민을 하고 계신 다른 클럽들에게도 제공하기로 했습니다.
            </p>
            <p>
              OpenRun은 무료로 이용할 수 있는 <strong>웹서비스</strong>입니다. <br />
              앱 설치 없이 스마트폰 또는 PC 브라우저로 접속할 수 있고, 홈화면에 바로가기 추가하면 걸리적거리는 주소창 없이 전체화면으로 사용할 수 있습니다.
            </p>
            <p>
              아래 주요 기능을 살펴보시고, 클럽 개설이나 운영에 궁금한 점이 있으시면 편하게 문의해 주세요.
            </p>
          </div>
        </section>

        {/* 기능 소개 갤러리 */}
        <section className="intro-features">
          <h2>주요 기능</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                onClick={() => setSelectedImage(index)}
              >
                <div className="feature-image-wrapper">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="feature-image"
                  />
                </div>
                <div className="feature-info">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 왜 무료인가 */}
        <section className="intro-why-free">
          <h2>왜 무료인가요?</h2>
          <div className="why-free-content">
            <ul>
              <li>
                <span>테니스 클럽 관리 서비스에 대한 <strong>재능기부</strong>입니다</span>
              </li>
              <li>
                <span>서버 비용은 제가 부담합니다. (사용자가 많아지면 최소한의 광고가 추가될 수 있어요)</span>
              </li>
              <li>
                <span>유료화 계획 없음, <strong>개인정보 최소 수집, 암호화 저장</strong></span>
              </li>
              <li>
                <span>1인 개발 프로젝트로 부족한 점이 많습니다. 피드백은 언제나 환영합니다.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 시작하기 */}
        <section className="intro-cta">
          <h2>시작하기</h2>
          <div className="cta-content">
            <p>
              Google, 카카오 계정으로 간편하게 시작할 수 있습니다.
              <br />
              클럽을 만들고 멤버들을 초대해 보세요!
            </p>
            <div className="cta-buttons">
              <Link to="/login" className="cta-button primary">
                지금 시작하기
              </Link>
              <Link to="/more/user-guide" className="cta-button secondary">
                이용 가이드 (준비중)
              </Link>
            </div>
          </div>
        </section>

        {/* 문의 */}
        <section className="intro-contact">
          <h2>문의하기</h2>
          <p>
            궁금한 점이나 피드백이 있으시면 편하게 연락 주세요.
            <br />
            <a
              href="https://open.kakao.com/o/s2uaa3ei"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              카카오톡 오픈채팅으로 문의하기 →
            </a>
          </p>
        </section>

        {/* 푸터 */}
        <footer className="intro-footer">
          <div className="footer-links">
            <Link to="/more/terms">이용약관</Link>
            <span>|</span>
            <Link to="/">대진표 생성 (비회원용)</Link>
          </div>
        </footer>
      </div>

      {/* 이미지 모달 */}
      {selectedImage !== null && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img
              src={features[selectedImage].image}
              alt={features[selectedImage].title}
            />
            <div className="modal-caption">
              <h3>{features[selectedImage].title}</h3>
              <p>{features[selectedImage].description}</p>
            </div>
            <div className="modal-nav">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(
                    selectedImage === 0 ? features.length - 1 : selectedImage - 1
                  );
                }}
              >
                ← 이전
              </button>
              <span>
                {selectedImage + 1} / {features.length}
              </span>
              <button
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
    </div>
  );
};

export default IntroPage;
