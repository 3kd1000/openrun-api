import React from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/common/AppHeader";

const LicensePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="오픈소스 라이센스" onBack={() => navigate(-1)} />
      <div className="max-w-[800px] mx-auto p-6 max-[425px]:p-3 max-[359px]:p-3">

        <section className="mb-8 max-[425px]:mb-6 max-[359px]:mb-4">
          <p className="text-base max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground leading-relaxed m-0">
            OpenRun은 다음의 오픈소스 라이브러리를 사용하고 있습니다.
          </p>
        </section>

        <section className="mb-8 max-[425px]:mb-6 max-[359px]:mb-4">
          <h2 className="text-xl max-[768px]:text-lg max-[425px]:text-base max-[359px]:text-sm font-bold text-foreground mt-0 mb-4 pb-2 border-b border-border">Frontend</h2>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">React</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">MIT License</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">사용자 인터페이스 구축을 위한 JavaScript 라이브러리</p>
            <a href="https://github.com/facebook/react" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Vite</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">MIT License</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">빠른 개발 환경을 제공하는 빌드 도구</p>
            <a href="https://github.com/vitejs/vite" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">TypeScript</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">타입 안정성을 제공하는 JavaScript 슈퍼셋</p>
            <a href="https://github.com/microsoft/TypeScript" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">React Router</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">MIT License</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">React 애플리케이션을 위한 라우팅 라이브러리</p>
            <a href="https://github.com/remix-run/react-router" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Axios</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">MIT License</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">Promise 기반 HTTP 클라이언트</p>
            <a href="https://github.com/axios/axios" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Firebase</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">인증 및 백엔드 서비스 플랫폼</p>
            <a href="https://github.com/firebase/firebase-js-sdk" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>
        </section>

        <section className="mb-8 max-[425px]:mb-6 max-[359px]:mb-4">
          <h2 className="text-xl max-[768px]:text-lg max-[425px]:text-base max-[359px]:text-sm font-bold text-foreground mt-0 mb-4 pb-2 border-b border-border">Backend</h2>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Spring Boot</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">Java 기반 애플리케이션 프레임워크</p>
            <a href="https://github.com/spring-projects/spring-boot" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Kotlin</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">JVM 기반 프로그래밍 언어</p>
            <a href="https://github.com/JetBrains/kotlin" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">PostgreSQL JDBC Driver</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">BSD License</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">PostgreSQL 데이터베이스 연결 드라이버</p>
            <a href="https://github.com/pgjdbc/pgjdbc" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>
        </section>

        <section className="mb-8 max-[425px]:mb-6 max-[359px]:mb-4">
          <h2 className="text-xl max-[768px]:text-lg max-[425px]:text-base max-[359px]:text-sm font-bold text-foreground mt-0 mb-4 pb-2 border-b border-border">Infrastructure</h2>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Kubernetes (K3s)</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">경량 컨테이너 오케스트레이션 플랫폼</p>
            <a href="https://github.com/k3s-io/k3s" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>

          <div className="bg-card border border-border rounded-sm p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 mb-4 transition-all duration-200 hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm">
            <h3 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mt-0 mb-1">Docker</h3>
            <p className="text-sm font-medium text-primary mt-0 mb-2">Apache License 2.0</p>
            <p className="text-sm text-muted-foreground leading-[1.5] mt-0 mb-2">컨테이너화 플랫폼</p>
            <a href="https://github.com/moby/moby" target="_blank" rel="noopener noreferrer" className="text-sm text-primary no-underline font-medium transition-all duration-200 hover:underline">
              Repository
            </a>
          </div>
        </section>

        <section className="mb-8 max-[425px]:mb-6 max-[359px]:mb-4 bg-muted rounded-md p-6 max-[768px]:p-4 max-[425px]:p-3 max-[359px]:p-3">
          <h2 className="text-xl max-[768px]:text-lg max-[425px]:text-base max-[359px]:text-sm font-bold text-foreground mt-0 mb-4 border-b-0">라이센스 고지</h2>
          <p className="text-base max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground leading-relaxed mt-0 mb-4">
            위에 나열된 모든 오픈소스 소프트웨어는 각각의 라이센스 조항에 따라 사용됩니다.
            각 라이브러리의 상세한 라이센스 정보는 해당 Repository 링크에서 확인하실 수 있습니다.
          </p>
          <p className="text-base max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground leading-relaxed mt-0 mb-0">
            OpenRun은 이러한 훌륭한 오픈소스 프로젝트들에 감사드립니다.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LicensePage;
