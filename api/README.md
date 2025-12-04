# OpenRun API

테니스 클럽 코트 예약 및 대진표 생성 서비스의 백엔드 API입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [환경 설정](#환경-설정)
- [API 엔드포인트](#api-엔드포인트)
- [프로젝트 구조](#프로젝트-구조)
- [데이터베이스](#데이터베이스)

## 🎯 주요 기능

- **클럽 관리**: 클럽 생성, 조회, 삭제 및 멤버 관리
- **사용자 인증**: Firebase Authentication, 소셜 로그인 (Kakao, Naver, Google)
- **개발용 인증**: 로컬 개발을 위한 더미 데이터 로그인
- **대진표 생성**: 한울 KDK 알고리즘, 무작위, 수동 방식 지원
- **코트 일정 관리**: 코트별 일정 조회 및 관리
- **Spring Actuator**: 헬스 체크 및 모니터링

## 🛠 기술 스택

### Framework & Runtime
- **Java**: OpenJDK 17
- **Spring Boot**: 3.3.2
- **Build Tool**: Gradle

### Database & Migration
- **Database**: PostgreSQL 15
- **ORM**: JPA/Hibernate
- **Migration**: Flyway

### Authentication & Security
- **Firebase Admin SDK**: Firebase 토큰 검증
- **Spring Security**: 인증 및 인가
- **OAuth2**: 소셜 로그인

### Additional Libraries
- **Lombok**: 보일러플레이트 코드 제거
- **Jackson**: JSON 직렬화/역직렬화

## 📦 설치 및 실행

### 필수 요구사항

- Java 17 이상
- PostgreSQL 15 이상
- Gradle (선택사항 - gradlew 사용)

### 로컬 개발 환경

```bash
# 1. PostgreSQL 시작 (Docker Compose)
docker compose -f docker-compose.local.yml up -d

# 2. 환경 변수 설정
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/openrun"
export SPRING_DATASOURCE_USERNAME="openrun"
export SPRING_DATASOURCE_PASSWORD="openrun123#"
export SPRING_PROFILES_ACTIVE="local"

# 3. API 서버 시작
./gradlew :api:bootRun
# 또는
./run_api.sh

# 4. 서버 확인
curl http://localhost:8080/actuator/health
```

### 개발 서버 실행

```bash
# 환경 변수와 함께 실행
./run_api.sh
```

### 빌드

```bash
# 테스트 제외 빌드
./gradlew :api:build -x test

# 전체 빌드 (테스트 포함)
./gradlew :api:build

# JAR 파일 생성
./gradlew :api:bootJar
```

### 테스트

```bash
# 전체 테스트 실행
./gradlew :api:test

# 특정 테스트 클래스만 실행
./gradlew :api:test --tests com.example.openrunapi.domain.user.*
```

## 🔧 환경 설정

### 환경 변수

```bash
# 데이터베이스
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/openrun
SPRING_DATASOURCE_USERNAME=openrun
SPRING_DATASOURCE_PASSWORD=openrun123#

# Spring Profile
SPRING_PROFILES_ACTIVE=local  # local, dev, prod

# JPA/Hibernate
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=true

# Firebase (프로덕션만)
firebase.enabled=false  # 로컬: false, dev/prod: true
firebase.config.path=config/firebase-service-account.json

# OAuth2 설정
spring.security.oauth2.client.registration.kakao.client-id=...
spring.security.oauth2.client.registration.kakao.client-secret=...
```

### 프로파일별 설정

#### 로컬 개발 (`local`)

```properties
firebase.enabled=false
spring.jpa.show-sql=true
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/openrun
```

#### 개발 서버 (`dev`)

```properties
firebase.enabled=true
spring.jpa.show-sql=false
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-service:5432/dev_db
```

#### 프로덕션 (`prod`)

```properties
firebase.enabled=true
spring.jpa.show-sql=false
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-service:5432/prod_db
```

## 📡 API 엔드포인트

### 인증 관련

#### Firebase 로그인
```http
POST /api/v1/auth/login/kakao
Content-Type: application/json

{
  "code": "authorization_code"
}

Response:
{
  "firebaseCustomToken": "eyJhbGc..."
}
```

#### 개발용 로그인 (로컬만)
```http
POST /api/v1/dev/login
Content-Type: application/json

{
  "uid": "test-user-123"
}

Response:
{
  "firebaseCustomToken": "dummy_token_..."
}
```

### 클럽 관련

#### 클럽 목록 조회
```http
GET /api/clubs
```

#### 클럽 상세 조회
```http
GET /api/clubs/{clubId}
Authorization: Bearer {token}
```

#### 클럽 생성
```http
POST /api/clubs
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "테니스 클럽",
  "description": "설명"
}
```

#### 클럽 멤버 조회
```http
GET /api/clubs/{clubId}/members
Authorization: Bearer {token}
```

### 대진 생성

#### 대진표 생성
```http
POST /api/draw/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "playerNames": ["플레이어1", "플레이어2", ...],
  "algorithmType": "RANDOM"  # KDAK, RANDOM, MANUAL
}
```

### Health Check (무인증)

```http
GET /actuator/health
GET /actuator/health/liveness
GET /actuator/health/readiness
```

## 📁 프로젝트 구조

```
api/
├── src/
│   ├── main/
│   │   ├── java/com/example/openrunapi/
│   │   │   ├── config/                 # 설정 클래스
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── FirebaseConfig.java
│   │   │   │   └── auth/               # 인증 필터
│   │   │   ├── domain/                 # 비즈니스 로직
│   │   │   │   ├── user/               # 사용자 관련
│   │   │   │   ├── club/               # 클럽 관련
│   │   │   │   ├── auth/               # 인증 관련
│   │   │   │   └── draw/               # 대진표 생성
│   │   │   └── OpenRunApiApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       └── db/migration/           # Flyway 마이그레이션
│   │           ├── V1__create_draw_statistics_table.sql
│   │           ├── V2__create_club_table.sql
│   │           ├── V3__create_user_table.sql
│   │           ├── V4__add_foreign_key_to_club_table.sql
│   │           ├── V5__add_socialid_to_user_and_modify_email.sql
│   │           └── V6__create_club_member_table.sql
│   └── test/
│       └── java/...                    # 테스트 코드
├── build.gradle
└── README.md
```

## 🗄 데이터베이스

### 마이그레이션

Flyway를 사용하여 데이터베이스 스키마를 관리합니다.

```bash
# 마이그레이션 자동 실행 (애플리케이션 시작 시)
./gradlew :api:bootRun

# 마이그레이션 파일 위치
api/src/main/resources/db/migration/
```

### 테이블 구조

#### users (사용자)
- `id`: 사용자 ID (PK)
- `uid`: Firebase UID
- `email`: 이메일
- `name`: 사용자 이름
- `social_id`: 소셜 로그인 ID (Kakao 등)
- `image_url`: 프로필 이미지
- `created_at`, `updated_at`: 타임스탬프

#### clubs (클럽)
- `id`: 클럽 ID (PK)
- `name`: 클럽 이름
- `description`: 설명
- `owner_id`: 소유자 ID (FK)
- `created_at`, `updated_at`: 타임스탬프

#### club_member (클럽 멤버)
- `id`: 멤버 ID (PK)
- `club_id`: 클럽 ID (FK)
- `user_id`: 사용자 ID (FK)
- `status`: 멤버 상태
- `joined_at`: 가입 일시

#### draw_statistics (대진표 통계)
- `id`: 통계 ID (PK)
- `player_count`: 플레이어 수
- `algorithm_type`: 알고리즘 종류
- `created_at`: 생성 일시

## 🔐 인증 및 보안

### 인증 흐름

1. **Firebase Auth (프로덕션/개발)**
   - 클라이언트에서 Firebase로 로그인
   - Firebase ID Token 획득
   - 백엔드에서 ID Token 검증 (`FirebaseTokenFilter`)

2. **Dev Auth (로컬)**
   - `/api/v1/dev/login`으로 더미 토큰 발급
   - `DevAuthenticationFilter`에서 처리

### Security Config

```java
// /api로 시작하는 모든 API는 인증 필요
.requestMatchers("/api/**").authenticated()

// 다음 경로는 무조건 허용
.requestMatchers("/api/v1/auth/**").permitAll()
.requestMatchers("/api/v1/dev/**").permitAll()
.requestMatchers("/api/draw/**").permitAll()
.requestMatchers("/actuator/health/**").permitAll()
```

## 🚀 배포

### Docker 빌드

```bash
# 멀티 플랫폼 빌드 (amd64, arm64)
docker build -f Dockerfile -t openrun:latest .
```

### Kubernetes 배포

```bash
# 개발 서버 배포
helm upgrade --install openrun-dev helm/openrun -f helm/openrun/values-dev.yaml -n openrun

# 프로덕션 배포
helm upgrade --install openrun-prod helm/openrun -f helm/openrun/values-prod.yaml -n openrun
```

### 자동 배포 (GitHub Actions)

```bash
# develop 브랜치에 push
git push origin develop
# → GitHub Actions 자동 실행
# → Docker 빌드 및 푸시
# → Kubernetes 배포
```

## 📝 개발 가이드

### 새로운 엔드포인트 추가

1. Controller 클래스 생성
2. Service 클래스에서 비즈니스 로직 구현
3. Repository 인터페이스로 데이터 접근
4. SecurityConfig에서 권한 설정

### 데이터베이스 마이그레이션

1. `api/src/main/resources/db/migration/` 폴더에 SQL 파일 생성
2. 파일명: `VX__description.sql` (X는 버전 번호)
3. 애플리케이션 시작 시 자동 실행

### 로컬 테스트

```bash
# PostgreSQL 초기화
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d

# 서버 실행
./run_api.sh
```

## 🐛 문제 해결

### Firebase 설정 오류

```
Error initializing Firebase: config/firebase-service-account.json not found
```

해결:
- 로컬: `firebase.enabled=false`로 설정
- 서버: Firebase 서비스 계정 파일을 `/app/config/` 디렉토리에 배치

### 데이터베이스 연결 오류

```
Unable to connect to database
```

해결:
```bash
# PostgreSQL 상태 확인
docker ps | grep postgres

# 다시 시작
docker compose -f docker-compose.local.yml restart postgres-db
```

### 포트 충돌

```
Port 8080 is already in use
```

해결:
```bash
# 포트 변경
./gradlew :api:bootRun --args='--server.port=8081'
```

## 📞 지원

문제가 발생하면 프로젝트 저장소의 Issues에 보고해주세요.
# Trigger deploy
