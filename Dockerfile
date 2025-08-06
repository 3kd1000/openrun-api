# --- Stage 1: Frontend 빌드 스테이지 ---
# 이 스테이지의 목적은 Node.js 환경에서 React 프로젝트를 빌드하여
# 순수한 HTML, CSS, JavaScript 파일 묶음(정적 파일)을 만드는 것입니다.
# 빌드 서버의 환경이 바뀌어도 항상 동일한 결과를 얻기 위해 구체적인 버전을 명시합니다. (예: node:22)
# 'as front-builder'는 이 스테이지에 'front-builder'라는 별명을 붙여, 나중에 이 스테이지의 결과물을 쉽게 참조할 수 있게 합니다.
FROM node:22 as front-builder

# --- 작업 디렉토리 설정 ---
# 컨테이너 내부에 /app/front 라는 작업 공간을 만듭니다.
# 앞으로 실행되는 모든 명령어(COPY, RUN 등)는 이 디렉토리를 기준으로 실행됩니다.
WORKDIR /app/front

# --- 의존성 설치 (효율적인 캐싱 전략) ---
# 소스 코드를 전부 복사하기 전에, 의존성 정의 파일(package.json)만 먼저 복사합니다.
# Docker는 각 라인을 캐시(저장)하는데, 만약 소스 코드만 바뀌고 의존성은 그대로라면,
# 이 부분은 캐시된 레이어를 재사용하여 'npm install'을 다시 실행하지 않으므로 빌드 속도가 매우 빨라집니다.
COPY front/package.json front/package-lock.json ./
RUN npm install

# --- 소스코드 복사 및 빌드 ---
# 이제 프론트엔드 소스코드 전체를 작업 디렉토리로 복사합니다.
COPY front/ .
ARG BUILD_COMMAND="npm run build"
# package.json에 정의된 'build' 스크립트를 실행합니다. (예: vite build)
# 이 명령이 실행되면, 최적화된 정적 파일들이 기본적으로 'dist' 폴더에 생성됩니다.
RUN ${BUILD_COMMAND}


# --- Stage 2: Backend 빌드 스테이지 ---
# 이 스테이지의 목적은 Java와 Gradle 환경에서 Spring Boot 프로젝트를 빌드하여
# 실행 가능한 .jar 파일을 만드는 것입니다.
# 'as api-builder'로 이 스테이지에 별명을 붙입니다.
FROM gradle:jdk17 as api-builder

# --- 작업 디렉토리 설정 ---
WORKDIR /app

# --- 의존성 다운로드 (효율적인 캐싱 전략) ---
# API 빌드 역시, 전체 소스코드를 복사하기 전에 빌드 설정 파일들을 먼저 복사합니다.
# 이를 통해 Gradle이 의존성을 먼저 다운로드하게 되며, 소스코드 변경 시 이 과정을 건너뛸 수 있습니다.
COPY build.gradle settings.gradle ./
COPY api/build.gradle ./api/

# --- 소스코드 복사 및 빌드 ---
# API 서버의 소스코드를 복사합니다.
COPY api/src ./api/src

# Gradle wrapper를 사용해 API 서버를 빌드합니다.
# '-x test' 옵션은 빌드 과정에서 시간이 오래 걸리는 유닛 테스트를 제외하여 CI/CD 파이프라인의 속도를 높입니다.
# (테스트는 별도의 'test' 스테이지에서 따로 실행하는 것이 일반적입니다.)
# 빌드가 성공하면 실행 가능한 .jar 파일이 /app/api/build/libs/ 경로에 생성됩니다.
RUN gradle :api:build -x test


# --- Stage 3: 최종 실행 이미지 생성 스테이지 ---
# 이 스테이지는 앞선 빌드 스테이지들에서 만들어진 결과물(artifact)들을 가져와
# 실제 운영 환경에서 실행될 최종 이미지를 만듭니다.
# Java 실행 환경(JRE)만 포함된 가벼운 이미지를 사용하여 이미지 크기를 최소화합니다.
FROM eclipse-temurin:17-jre

# --- 작업 디렉토리 설정 ---
WORKDIR /app

# --- 빌드 결과물 복사 ---
# 'api-builder' 스테이지의 /app/api/build/libs/ 경로에서 생성된 .jar 파일을
# 현재 스테이지의 작업 디렉토리(/app)로 'app.jar'라는 이름으로 복사합니다.
COPY --from=api-builder /app/api/build/libs/*.jar ./app.jar

# 'front-builder' 스테이지의 /app/front/dist/ 경로에 있던 빌드된 프론트엔드 정적 파일들을
# 컨테이너의 /app/static 디렉토리로 복사합니다.
COPY --from=front-builder /app/front/dist /app/static

# --- 포트 노출 및 애플리케이션 실행 ---
# 이 컨테이너가 외부와 통신하기 위해 8080 포트를 사용한다는 것을 명시적으로 알려줍니다.
# (실제 포트 매핑은 'docker run' 또는 'docker-compose.yml'에서 이루어집니다.)
EXPOSE 8080

# 컨테이너가 시작될 때 Spring Boot 애플리케이션을 구동합니다.
# -Dspring.web.resources.static-locations 옵션을 추가하여
# Spring Boot에게 기본 경로 외에, 파일 시스템의 /app/static 폴더도
# 정적 리소스를 제공하는 위치로 사용하라고 알려줍니다.
ENTRYPOINT ["java", "-Dspring.web.resources.static-locations=classpath:/META-INF/resources/,classpath:/resources/,classpath:/static/,classpath:/public/,file:/app/static/", "-jar", "app.jar"]
