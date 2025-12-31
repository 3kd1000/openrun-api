# Changelog

All notable changes to the OpenRun project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-31

### 🎉 First Production Release

OpenRun 테니스 클럽 관리 서비스의 첫 번째 프로덕션 배포입니다.

### Added

#### 🔐 Authentication & Security
- Firebase 소셜 로그인 (Google, Kakao, Naver)
- WebAuthn 패스키 인증 (생체인증 지원)
- 클럽별 권한 관리 및 멤버 초대 시스템

#### 📅 Schedule Management
- 코트 일정 생성 및 관리
- 캘린더 뷰 / 리스트 뷰 전환
- 일정별 참가 신청 및 관리
- 참가자 현황 실시간 확인

#### 🎯 Draw System
- 한울 KDK 알고리즘 대진표 생성
- 무작위 대진표 생성
- 수동 대진표 생성
- 대진표 복사 및 재생성 기능
- 경기 결과 입력 및 수정

#### 📊 Scoreboard & Statistics
- 실시간 순위 집계
- 개인별 승/패/득실점 통계
- 클럽별 시즌 통계

#### 👥 Club Management
- 클럽 생성 및 설정
- 멤버 초대 및 관리
- 클럽별 데이터 격리

#### 📱 User Experience
- PWA 지원 (모바일 설치 가능)
- 반응형 디자인 (데스크톱/모바일)
- 다크모드 대응
- 모바일 최적화 UI (320px ~ 768px)

### Infrastructure

#### ☁️ Cloud & Container
- Oracle Cloud Infrastructure Always Free Tier
- Kubernetes (K3s) 운영 환경
- PostgreSQL 데이터베이스 (dev/prod 분리)
- Cloudflare Tunnel (보안 네트워크)

#### 🔄 CI/CD
- GitHub Actions 자동 배포
- GitHub Container Registry (GHCR)
- Helm Chart 기반 배포
- 환경별 설정 분리 (dev/prod)

#### 🛡️ Security & Monitoring
- Firebase Admin SDK 서버 검증
- WebAuthn RP ID 설정
- CORS 정책 적용
- 프로덕션 로그 최적화

### Technical Stack

**Backend**
- Spring Boot 3.x (Kotlin/Java)
- PostgreSQL 16
- Firebase Admin SDK
- Yubico WebAuthn Server

**Frontend**
- React 18
- TypeScript
- Vite
- React Router
- Firebase SDK

**Infrastructure**
- Kubernetes (K3s)
- Docker
- Helm
- GitHub Actions
- Cloudflare

### Known Issues

- 모바일 브라우저에서 WebAuthn 패스키 호환성 차이 (Chrome vs Safari vs Samsung Internet)
- 일부 모달 레이아웃 미세 조정 필요 (진행 중)

### Notes

- 이 릴리즈는 Early Access 버전입니다
- 프로덕션 환경: https://front.openrun.app
- 개발 환경: https://dev-front.openrun.app

---

## Version History

- **v0.1.0** (2025-12-31): First Production Release
