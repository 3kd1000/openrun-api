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
- FCM 푸시 알림 시스템 (일정/대진표/클럽 알림)
- 1:1 메시지 시스템 (일정 연관 대화, 운영자 DM)
- Admin 백오피스 (통계 대시보드, 배치 관리, 감사 로그, DM 관리)

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
├── admin/            # Admin 백오피스 (React + Vite)
├── k8s/              # Kubernetes 매니페스트
│   └── cronjobs/    # K8s CronJob 배치 작업
├── docs/             # 모든 문서 저장소 (git submodule)
│   ├── guides/      # 작업 가이드 (문서화, 배포 등)
│   ├── infra/       # 인프라 관련
│   ├── backend/     # 백엔드 관련
│   └── frontend/    # 프론트엔드 관련
└── claude.md         # 이 파일
```

## 🚀 다음 작업 예정

- [ ] 이용 가이드 페이지 콘텐츠 작성
- [ ] Front UI Stage 4: DrawCreateModal/DrawViewModal shadcn 전환
- [ ] 공개일정(Open Schedule) 기능 착수 (`docs/side-projects/openrun/decisions/open-schedule-design.md`)

### ✅ 최근 완료

- [x] FCM 푸시 알림 시스템 구축 (Phase 1: 인프라 + 인앱 UI)
- [x] 일별 통계 수집 배치 + 차트 대시보드 (Recharts)
- [x] K8s CronJob 기반 배치 시스템 (중복 실행 방지)
- [x] 서비스 소개 페이지 (/intro)
- [x] 클럽 멤버 역할 관리 기능
- [x] 대진표 생성 알고리즘 개선
- [x] Front shadcn/ui 점진 전환 Stage 1~3 (Emerald/Charcoal 4색 시스템)
- [x] 메시지 시스템 고도화 (일정 배너 링크, 운영자 DM 3개 진입점, Admin DM 관리)
- [x] Admin 백오피스 shadcn/Tailwind v4 전체 마이그레이션 (인디고 테마)

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

### CSS 레이아웃 가이드

신규 페이지 또는 CSS 작업 시 **`docs/frontend/css-layout-guidelines.md`를 반드시 참고**하여:

- **기존 페이지 구조 참고 필수** (ClubMainPage, ScheduleListPage, ScoreboardPage)
- 최대한 심플하고 유사한 계층구조 유지
- 페이지 컨테이너는 **항상 `padding-top: 0`**
- 공통 wrapper 클래스 우선 사용 (`.page-club-selector-container` 등)
- 미디어쿼리에서 상단 padding 덮어쓰지 않기

⚠️ **중요**: 각 페이지마다 고유한 wrapper 구조를 만들지 말 것!

자세한 내용: `@docs/frontend/css-layout-guidelines.md`

## 🔄 개발 패턴

- **최소 변경으로 기능 구현**: 기존 아키텍처 유지하면서 점진적 개선
- **환경별 분리**: 개발/운영 환경 철저히 분리
- **자동화 우선**: CI/CD 파이프라인을 통한 배포 자동화
- **문서화**: 모든 설정 변경과 새로운 기능은 docs/에 문서화

---

**프로젝트 상태**: 운영 중 (Production Ready)
**마지막 업데이트**: 2026-02-24 (Admin shadcn 마이그레이션, 메시징 시스템 고도화, Front UI Stage 1~3)
