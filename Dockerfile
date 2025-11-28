# --- Stage 1: Frontend 빌드 스테이지 ---
# Node.js 환경에서 React 프로젝트를 빌드하여 정적 파일을 생성합니다.
FROM node:22 as front-builder

WORKDIR /app/front

# --- 의존성 설치 (효율적인 캐싱 전략) ---
# package.json만 먼저 복사하여 npm install 캐시 활용
COPY front/package.json front/package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# --- 환경 파일 복사 ---
# Vite 빌드에 필요한 환경 변수 파일
COPY front/.env .
COPY front/.env.localhost .env.localhost
COPY front/.env.develop .env.develop
COPY front/.env.production .env.production

# --- 소스코드 복사 및 빌드 ---
COPY front/ .

# 빌드 커맨드 (CI/CD에서 덮어씀: npm run build:develop)
ARG BUILD_COMMAND="npm run build"
RUN ${BUILD_COMMAND}

# 빌드 결과물 확인
RUN ls -la /app/front/dist 2>/dev/null || echo "dist 폴더 없음 - 빌드 실패 가능성"


# --- Stage 2: Backend 빌드 스테이지 ---
FROM gradle:jdk17 as api-builder

WORKDIR /app

# --- 의존성 다운로드 (효율적인 캐싱 전략) ---
COPY build.gradle settings.gradle ./
COPY api/build.gradle ./api/

COPY gradlew .
COPY gradle gradle
RUN chmod +x ./gradlew

# Gradle 의존성 캐시 활용
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# --- 소스코드 복사 및 빌드 ---
COPY api/src ./api/src

# Gradle 빌드 (테스트 제외, 캐시 최대 활용)
RUN ./gradlew :api:build -x test --no-daemon --build-cache


# --- Stage 3: 최종 실행 이미지 생성 스테이지 ---
FROM eclipse-temurin:17-jre

WORKDIR /app

# --- 빌드 결과물 복사 ---
COPY --from=api-builder /app/api/build/libs/*.jar ./app.jar
COPY --from=front-builder /app/front/dist /app/static

# --- 포트 노출 및 애플리케이션 실행 ---
EXPOSE 8080

ENTRYPOINT ["java", "-Dspring.web.resources.static-locations=classpath:/META-INF/resources/,classpath:/resources/,classpath:/static/,classpath:/public/,file:/app/static/", "-jar", "app.jar"]
