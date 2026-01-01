import React from "react";
import "./LicensePage.css";

const LicensePage: React.FC = () => {
  return (
    <div className="license-page">
      <div className="license-content">
        <h1>오픈소스 라이센스</h1>

        <section className="license-section">
          <p className="license-intro">
            OpenRun은 다음의 오픈소스 라이브러리를 사용하고 있습니다.
          </p>
        </section>

        <section className="license-section">
          <h2>Frontend</h2>

          <div className="license-item">
            <h3>React</h3>
            <p className="license-type">MIT License</p>
            <p className="license-desc">사용자 인터페이스 구축을 위한 JavaScript 라이브러리</p>
            <a href="https://github.com/facebook/react" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>Vite</h3>
            <p className="license-type">MIT License</p>
            <p className="license-desc">빠른 개발 환경을 제공하는 빌드 도구</p>
            <a href="https://github.com/vitejs/vite" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>TypeScript</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">타입 안정성을 제공하는 JavaScript 슈퍼셋</p>
            <a href="https://github.com/microsoft/TypeScript" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>React Router</h3>
            <p className="license-type">MIT License</p>
            <p className="license-desc">React 애플리케이션을 위한 라우팅 라이브러리</p>
            <a href="https://github.com/remix-run/react-router" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>Axios</h3>
            <p className="license-type">MIT License</p>
            <p className="license-desc">Promise 기반 HTTP 클라이언트</p>
            <a href="https://github.com/axios/axios" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>Firebase</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">인증 및 백엔드 서비스 플랫폼</p>
            <a href="https://github.com/firebase/firebase-js-sdk" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>
        </section>

        <section className="license-section">
          <h2>Backend</h2>

          <div className="license-item">
            <h3>Spring Boot</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">Java 기반 애플리케이션 프레임워크</p>
            <a href="https://github.com/spring-projects/spring-boot" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>Kotlin</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">JVM 기반 프로그래밍 언어</p>
            <a href="https://github.com/JetBrains/kotlin" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>PostgreSQL JDBC Driver</h3>
            <p className="license-type">BSD License</p>
            <p className="license-desc">PostgreSQL 데이터베이스 연결 드라이버</p>
            <a href="https://github.com/pgjdbc/pgjdbc" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>
        </section>

        <section className="license-section">
          <h2>Infrastructure</h2>

          <div className="license-item">
            <h3>Kubernetes (K3s)</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">경량 컨테이너 오케스트레이션 플랫폼</p>
            <a href="https://github.com/k3s-io/k3s" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>

          <div className="license-item">
            <h3>Docker</h3>
            <p className="license-type">Apache License 2.0</p>
            <p className="license-desc">컨테이너화 플랫폼</p>
            <a href="https://github.com/moby/moby" target="_blank" rel="noopener noreferrer">
              Repository
            </a>
          </div>
        </section>

        <section className="license-section license-notice">
          <h2>라이센스 고지</h2>
          <p>
            위에 나열된 모든 오픈소스 소프트웨어는 각각의 라이센스 조항에 따라 사용됩니다.
            각 라이브러리의 상세한 라이센스 정보는 해당 Repository 링크에서 확인하실 수 있습니다.
          </p>
          <p>
            OpenRun은 이러한 훌륭한 오픈소스 프로젝트들에 감사드립니다.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LicensePage;
