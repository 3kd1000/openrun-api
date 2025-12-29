# OpenRun - 테니스 클럽 관리 서비스

## 👤 개발자 정보

**상세한 개인 프로필, 작업 스타일, 문서화 규칙은 @docs/PROFILE.md 참조**
모든 답변은 공손하게 존댓말로 생성합니다.

## 🎯 프로젝트 개요

**OpenRun**은 테니스 클럽을 위한 코트 예약 및 대진표 생성 서비스입니다.

### 기술 스택

- **Backend**: Spring Boot (Kotlin/Java), PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Infrastructure**:
  - Docker Compose → Kubernetes (K3s) 마이그레이션 완료
  - Oracle Cloud Infrastructure (OCI) Always Free Tier
  - Cloudflare Tunnel
  - GitHub Actions (CI/CD)
- **Authentication**: Firebase Authentication

### 주요 기능

- 클럽 관리 및 멤버 초대
- 코트 일정 관리 (캘린더/리스트뷰)
- 대진표 자동 생성 (한울 KDK, 무작위, 수동)
- 소셜 로그인 (Google, Kakao, Naver)

## 🔧 개발 환경

### 로컬 개발

```bash
# Backend (Spring Boot)
./gradlew :api:bootRun

# Frontend (Vite)
cd front && npm run localhost
```

### 운영 환경

- **Production**: `api.openrun.app`, `front.openrun.app`
- **Development**: `dev-api.openrun.app`, `dev-front.openrun.app`
- **배포**: GitHub Actions → GHCR → Kubernetes 자동 배포

### 데이터베이스

- **K8s PostgreSQL**: `prod_db`, `dev_db` (환경별 분리)
- **접속**: `kubectl port-forward -n openrun svc/postgres-service 15432:5432`

## 📂 주요 디렉토리

```
openrun/
├── api/              # Spring Boot 백엔드
├── front/            # React 프론트엔드
├── k8s/              # Kubernetes 매니페스트
├── docs/             # 모든 문서 저장소 (git submodule)
│   ├── guides/      # 작업 가이드 (문서화, 배포 등)
│   ├── infra/       # 인프라 관련
│   ├── backend/     # 백엔드 관련
│   └── frontend/    # 프론트엔드 관련
└── claude.md         # 이 파일
```

## 🚀 다음 작업 예정

- [ ] 클럽 멤버 역할 관리 기능
- [ ] 대진표 생성 알고리즘 개선
- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 모바일 반응형 UI 개선

## ⚠️ Claude Code 작업 가이드라인

**중요**: Claude Code와 작업할 때는 반드시 **`@docs/guides/claude-code-guidelines.md`**를 준수할 것

### 핵심 원칙
- **중요한 로직 결정은 반드시 사전 동의 필요**
- 여러 옵션 제시 → 사용자 선택 → 구현 시작
- 임의로 판단하지 말 것 (API 비용 낭비 방지)

자세한 내용: `@docs/guides/claude-code-guidelines.md`

## 📚 문서화 가이드

### 문서 생성 시

작업 중 문서를 생성할 때는 **`docs/guides/documentation-guide.md`를 참고**하여:

- 적절한 위치에 저장 (`docs/infra/k8s/`, `docs/backend/spring/` 등)
- 소문자-하이픈 형식의 파일명 사용
- 필수 메타데이터 포함 (작성일, 목적, 예제)

자세한 내용: `@docs/guides/documentation-guide.md`

## 🔄 개발 패턴

- **최소 변경으로 기능 구현**: 기존 아키텍처 유지하면서 점진적 개선
- **환경별 분리**: 개발/운영 환경 철저히 분리
- **자동화 우선**: CI/CD 파이프라인을 통한 배포 자동화
- **문서화**: 모든 설정 변경과 새로운 기능은 docs/에 문서화

---

**프로젝트 상태**: 운영 중 (Production Ready)  
**마지막 업데이트**: 2025-11-20
