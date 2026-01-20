# OpenRun 기능 백로그 (2026-01)

**작성일**: 2026-01-17
**우선순위**: 높음(P0) > 중간(P1) > 낮음(P2)

---

## 🔴 P0 - 핵심 기능 개선

### 1. 성별 정보 추가 및 필터링
**목적**: 여성 전용 클럽, 게스트 모집 시 성별 필터링 지원

**✅ 확정 사항**:
- 성별 선택지: **남자 / 여자 / 비공개** (3개)
- CTA 페이지에서 **필수 항목**으로 선택 (비공개 포함)
- 비공개를 하나의 타입으로 취급

**✅ 기존 데이터 마이그레이션 전략**:
- 우리클럽 회원 전원 **MALE로 강제 설정**
- 이후 본인이 원하면 PRIVATE로 변경 가능 (프로필 수정)

- [ ] **Backend**
  - [ ] users 테이블에 `gender` 컬럼 추가 (MALE, FEMALE, PRIVATE)
  - [ ] Flyway 마이그레이션 스크립트 작성 (V49)
    ```sql
    -- 1. 컬럼 추가 (기본값 PRIVATE)
    ALTER TABLE users ADD COLUMN gender VARCHAR(10) NOT NULL DEFAULT 'PRIVATE';
    COMMENT ON COLUMN users.gender IS '성별 (MALE, FEMALE, PRIVATE)';

    -- 2. 기존 우리클럽 회원 전원 MALE로 설정
    UPDATE users SET gender = 'MALE' WHERE id IN (
        SELECT user_id FROM club_member WHERE club_id = 1
    );
    ```
  - [ ] User 엔티티 및 DTO 수정
  - [ ] 회원가입 API에 성별 입력 추가

- [ ] **Frontend**
  - [ ] CTA 페이지에 성별 선택 필수 항목 추가 (라디오 버튼 3개)
  - [ ] 프로필 수정 모달에 성별 선택 UI 추가
  - [ ] 신규 사용자만 CTA에서 선택 (기존 사용자는 MALE 고정)

- [ ] **게스트 모집 성별 필터**
  - [ ] Schedule 테이블에 `guest_gender_filter` 컬럼 추가 (MALE_ONLY, FEMALE_ONLY, MIXED)
  - [ ] ScheduleDetailModal에 성별 필터 선택 UI 추가
  - [ ] 게스트 신청 시 성별 검증 로직 추가

- [ ] **클럽 성별 제한**
  - [ ] Club 테이블에 `gender_restriction` 컬럼 추가 (NONE, MALE_ONLY, FEMALE_ONLY)
  - [ ] 클럽 가입 신청 시 성별 검증 로직 추가

- [ ] **Schedule 모임 타입 추가**
  - [ ] Schedule 테이블에 `match_type` 컬럼 추가
    ```sql
    ALTER TABLE schedule ADD COLUMN match_type VARCHAR(20) DEFAULT NULL;
    COMMENT ON COLUMN schedule.match_type IS '모임 타입 (MENS_DOUBLES, WOMENS_DOUBLES, MIXED_DOUBLES, SINGLES, NULL=선택 안 함)';
    ```
  - [ ] ScheduleFormSection에 모임 타입 선택 UI 추가 (드롭다운 또는 라디오)
    - 선택 안 함 (기본값)
    - 남복 (MENS_DOUBLES)
    - 여복 (WOMENS_DOUBLES)
    - 혼복 (MIXED_DOUBLES)
    - 단식 (SINGLES)
  - [ ] ScheduleDetailModal에 모임 타입 표시

**예상 작업량**: 4-5일
**기술 스택**: PostgreSQL, Spring Boot, React

---

### 2. 모집 안내문 작성 가이드 개선
**목적**: 게스트/교류전/신규회원 모집 시 구체적인 안내문 작성 유도

- [ ] **ScheduleDetailModal - 게스트 모집**
  - [ ] Placeholder 개선: "예시) NTRP 3.5 이상, 구력 2년 이상, 주차 가능"
  - [ ] 입력 가이드 텍스트 추가

- [ ] **ScheduleDetailModal - 교류전 모집**
  - [ ] Placeholder 개선: "예시) 4vs4 교류전, 평균 구력 3년, 오후 2시~6시 예정"
  - [ ] 입력 가이드 텍스트 추가

- [ ] **ClubManagePolicyPage - 신규회원 모집**
  - [ ] CLOSE → OPEN 전환 시 모집 안내문 입력 UI 추가
  - [ ] Club 테이블에 `member_recruitment_note` 컬럼 추가
  - [ ] Placeholder: "예시) 초급자 환영, 주 1회 이상 참여 가능한 분, 여성 회원 우대"
  - [ ] OPEN/OFF 토글 + TextArea + 등록/취소 버튼 (ScheduleDetailModal 패턴 재사용)

**예상 작업량**: 1-2일
**기술 스택**: React, Spring Boot

---

### 3. 클럽 탐색 - 활동성 지표 추가
**목적**: 신규회원 모집 중인 클럽의 활동성을 한눈에 파악

**✅ 확정 사항**:
- 배치 실행: 새벽 3시 (기존 "일정 자동 정리" 배치와 함께)
- 지표 형식: **"생성된 00개의 일정에 총 000명이 참여했습니다"**
- 유령 클럽 구분: 일정은 많은데 참여자 수가 적으면 자동 판단 가능

- [ ] **Backend - 배치 작업**
  - [ ] `club_statistics` 테이블 생성
    ```sql
    CREATE TABLE club_statistics (
        club_id BIGINT PRIMARY KEY REFERENCES club(id),
        total_members INT DEFAULT 0,
        schedules_count_3months INT DEFAULT 0,
        participants_count_3months INT DEFAULT 0,
        last_updated_at TIMESTAMP,
        CONSTRAINT fk_club FOREIGN KEY (club_id) REFERENCES club(id)
    );
    COMMENT ON COLUMN club_statistics.schedules_count_3months IS '최근 3개월 생성된 일정 수';
    COMMENT ON COLUMN club_statistics.participants_count_3months IS '최근 3개월 참여한 총 인원 수';
    ```
  - [ ] 배치 작업: 매일 새벽 3시 실행
    - 기존 배치와 통합 또는 별도 배치 생성
    - 최근 3개월 일정 수 집계
    - 최근 3개월 총 참여자 수 집계 (중복 포함)
  - [ ] `/clubs` API 응답에 통계 정보 추가

- [ ] **Frontend - UI 개선**
  - [ ] RecruitClubsPage 카드에 표시:
    - "최근 3개월 00개 일정 / 총 000명 참여"
    - 클럽 개설일
    - 현재 클럽 인원수
  - [ ] 활동성 뱃지 추가 (선택):
    - 🔥 활발: 참여자/일정 비율이 높음
    - 😴 조용: 비율이 낮음

**예상 작업량**: 2-3일
**기술 스택**: Spring Batch (or Scheduled Task), JPA Query, React

---

## 🟡 P1 - 관리 기능 개선

### 4. 클럽장 권한 양도 기능
**목적**: 클럽장이 부재하거나 교체가 필요한 경우 대응

**⚠️ 상태**: 고민 중 (2026-01-17) - 신중한 설계 필요

- [ ] **Backend**
  - [ ] ClubService에 `transferOwnership(clubId, fromUserId, toUserId)` 메서드 추가
  - [ ] 검증 로직:
    - 현재 사용자가 클럽장인지 확인
    - 대상 사용자가 클럽 멤버인지 확인
  - [ ] ClubMember 역할 업데이트 (OWNER → MANAGER, MANAGER → OWNER)

- [ ] **Frontend**
  - [ ] ClubManagePage에 "클럽장 양도" 버튼 추가
  - [ ] 모달 생성: 클럽 멤버 목록 → 선택 → 확인
  - [ ] 양도 후 자동 페이지 새로고침

**예상 작업량**: 1-2일
**기술 스택**: Spring Boot, React

---

### 5. 테스트 코드 업데이트
**목적**: ScheduleResponse 구조 변경에 따른 테스트 오류 수정

- [x] **즉시 수정 필요**
  - [x] ScheduleControllerDrawTest.java 수정

- [ ] **전반적인 테스트 업데이트** (우선순위 낮음)
  - [ ] 게스트/교류전 모집 기능 테스트 추가
  - [ ] 클럽 정책 관련 테스트 추가
  - [ ] 통합 테스트 검토

**예상 작업량**: 즉시 수정 30분, 전체 업데이트 2-3일
**기술 스택**: JUnit, Spring Boot Test

---

## 🟢 P2 - UX 개선

### 6. 비로그인 사용자 경험 개선
**목적**: 로그인하지 않은 사용자도 서비스 탐색 가능

- [ ] **분석 필요**
  - [ ] 비로그인 시 접근 가능한 페이지 정의
    - 클럽 탐색 (게스트/교류전/신규회원 모집)
    - 클럽 상세 (제한적 정보)
  - [ ] 로그인 유도 전략 설계
    - "로그인하고 참여하기" CTA 버튼
    - 일정 상세보기 제한

- [ ] **구현**
  - [ ] AuthContext에서 비로그인 상태 처리 개선
  - [ ] 각 페이지별 접근 제어 로직 추가
  - [ ] 로그인 유도 모달 컴포넌트 생성

**예상 작업량**: 3-4일
**기술 스택**: React, Firebase Auth

---

### 7. OTA (Onboarding Tour) 점검 및 개선
**목적**: 신규 사용자 온보딩 경험 개선

- [ ] **현재 상태 점검**
  - [ ] 첫 로그인 시 OTA 자동 실행 확인
  - [ ] 데스크탑/모바일 반응형 검수

- [ ] **테스트 모드 추가**
  - [ ] 개발자 도구: OTA 강제 실행 버튼 추가 (/dev 페이지)
  - [ ] localStorage에 `openrun_skip_ota` 플래그 추가
  - [ ] 모바일 디바이스에서도 테스트 가능하도록 개선

- [ ] **OTA 콘텐츠 업데이트**
  - [ ] 신규 기능 (게스트/교류전 모집) 가이드 추가
  - [ ] 클럽 탐색 사용법 추가

**예상 작업량**: 2-3일
**기술 스택**: React, localStorage

---

## 📋 우선순위 요약

| 우선순위 | 작업 항목 | 예상 기간 | 상태 |
|---------|----------|----------|------|
| P0 | 성별 정보 추가 및 필터링 | 3-4일 | 📝 계획 |
| P0 | 모집 안내문 작성 가이드 개선 | 1-2일 | 📝 계획 |
| P0 | 클럽 탐색 - 활동성 지표 추가 | 2일 | 📝 계획 |
| P1 | 클럽장 권한 양도 기능 | 1-2일 | 📝 계획 |
| P1 | 테스트 코드 업데이트 | 즉시~3일 | 🚧 진행 중 |
| P2 | 비로그인 사용자 경험 개선 | 3-4일 | 📝 계획 |
| P2 | OTA 점검 및 개선 | 2-3일 | 📝 계획 |

**총 예상 작업량**: 약 2-3주 (P0 우선, 순차 진행)

---

## 💡 다음 단계

1. **즉시 작업**: ScheduleControllerDrawTest.java 오류 수정 ✅
2. **우선 착수**: 성별 정보 추가 및 필터링 (DB 스키마 변경 먼저)
3. **병렬 작업 가능**: 모집 안내문 가이드 개선 (Frontend만 수정)

**마지막 업데이트**: 2026-01-17
