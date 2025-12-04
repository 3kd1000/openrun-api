# OpenRun Frontend

테니스 클럽 코트 예약 및 대진표 생성 서비스의 프론트엔드입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [환경 설정](#환경-설정)
- [빌드](#빌드)
- [프로젝트 구조](#프로젝트-구조)

## 🎯 주요 기능

- **대진표 자동 생성**: 한울 KDK, 무작위, 수동 방식 지원
- **클럽 관리**: 클럽 생성 및 멤버 관리
- **코트 일정 관리**: 캘린더/리스트 뷰 제공
- **소셜 로그인**: Google, Kakao, Naver 지원
- **실시간 상태 업데이트**: React Query를 통한 효율적인 데이터 관리

## 🛠 기술 스택

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **API Communication**: React Query (TanStack Query)
- **Authentication**: Firebase Authentication

## 📦 설치 및 실행

### 필수 요구사항

- Node.js 22.x 이상
- npm 10.x 이상

### 로컬 개발 환경

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (http://localhost:5173)
npm run dev

# 3. localhost 모드 실행 (테스트용)
npm run localhost
```

### 개발 서버 배포 빌드

```bash
# 개발 서버용 빌드 (dev-front.openrun.app)
npm run build:develop
```

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build
```

### 코드 검사

```bash
# ESLint 실행
npm run lint
```

### 빌드 미리보기

```bash
# 빌드 결과물 미리보기
npm run preview
```

## 🔧 환경 설정

### 환경 변수 파일

프로젝트의 환경별 설정은 `.env*` 파일에서 관리됩니다.

#### `.env` - 기본 설정 (로컬 개발)

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_KAKAO_REDIRECT_URL=http://localhost:5173/auth-test
VITE_FIREBASE_API_KEY=AIzaSyBs5-OMmuj7ONsUosbyfwowjO-1diBhXoU
VITE_FIREBASE_AUTH_DOMAIN=openrun-ed7a1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=openrun-ed7a1
VITE_FIREBASE_STORAGE_BUCKET=openrun-ed7a1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=4793689059
VITE_FIREBASE_APP_ID=1:4793689059:web:282843d13c85bb7efb76d6
VITE_FIREBASE_MEASUREMENT_ID=G-YVKCQ514WS
```

#### `.env.localhost` - 로컬 테스트

로컬 개발 시 `.env`와 동일한 설정 사용

#### `.env.develop` - 개발 서버

```env
VITE_API_BASE_URL=https://dev-api.openrun.app/api
VITE_KAKAO_REDIRECT_URL=https://dev-front.openrun.app/auth-test
```

#### `.env.production` - 프로덕션

```env
VITE_API_BASE_URL=https://api.openrun.app/api
VITE_KAKAO_REDIRECT_URL=https://front.openrun.app/auth-test
```

### 빌드 모드 실행

```bash
# Vite는 --mode 옵션으로 환경을 지정합니다
vite --mode localhost      # .env.localhost 로드
vite --mode develop        # .env.develop 로드
npm run build:develop      # 개발 서버 빌드
npm run build              # 프로덕션 빌드
```

## 📁 프로젝트 구조

```
front/
├── src/
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── draw/           # 대진 생성 페이지
│   │   ├── club/           # 클럽 관리 페이지
│   │   ├── AuthTestPage.tsx    # Firebase 로그인 테스트
│   │   └── DevAuthPage.tsx     # 개발용 로그인
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 컴포넌트 (Header, Footer)
│   │   └── ...
│   ├── services/           # API 통신 및 서비스
│   │   ├── api/            # axios 인스턴스 및 API 함수
│   │   └── firebase.ts     # Firebase 설정
│   ├── types/              # TypeScript 타입 정의
│   ├── App.tsx             # 라우팅 설정
│   └── main.tsx            # 진입점
├── .env*                   # 환경 변수 파일
├── vite.config.ts          # Vite 설정
├── tsconfig.json           # TypeScript 설정
└── package.json            # 의존성 관리
```

## 🔐 인증 흐름

1. **로컬 개발**: DevAuthPage (`/dev/login`)에서 더미 데이터로 로그인
2. **개발/프로덕션**: Firebase + 소셜 로그인 (Google, Kakao, Naver)
3. 백엔드에서 JWT 또는 Firebase 토큰으로 검증

## 🚀 배포

### 자동 배포 (GitHub Actions)

```bash
# develop 브랜치에 push
git push origin develop
# → GitHub Actions 자동 실행
# → Docker 빌드
# → Kubernetes 배포
```

### 수동 빌드

```bash
# 개발 서버 빌드
npm run build:develop

# 프로덕션 빌드
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성되며, Docker의 Stage 1에서 정적 파일로 사용됩니다.

## 📝 개발 팁

### 환경별 테스트

```bash
# 로컬에서 개발 서버 환경 테스트
VITE_API_BASE_URL=https://dev-api.openrun.app/api npm run dev
```

### API 응답 확인

`src/services/api/axiosInstance.ts`에서 axios 인터셉터로 모든 요청/응답을 로깅할 수 있습니다.

### Firebase 설정 변경

`src/services/firebase.ts`에서 환경 변수를 통해 Firebase 설정을 로드합니다. `.env*` 파일을 수정하고 서버를 재시작하세요.

## 🐛 문제 해결

### 404 에러 (SPA 라우팅)

`/auth-test` 같은 라우팅이 404가 나는 경우:

- **로컬**: 자동으로 처리됨 (Vite)
- **서버**: Spring Boot의 SecurityConfig에서 SPA 라우팅 처리
  ```java
  // /api로 시작하지 않는 요청은 index.html로 포워드
  if (!requestUri.startsWith("/api")) {
    request.getRequestDispatcher("/index.html").forward(request, response);
  }
  ```

### CORS 에러

API 응답에서 CORS 에러가 나는 경우, 백엔드의 CORS 설정을 확인하세요.

### 환경 변수 미로드

```bash
# 캐시 삭제 후 재시작
rm -rf node_modules/.vite
npm run dev
```

## 📞 지원

문제가 발생하면 프로젝트 저장소의 Issues에 보고해주세요.
