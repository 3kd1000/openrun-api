# OpenRun 기능 백로그 (2026-01)

**최종 업데이트**: 2026-01-20
**우선순위**: 높음(P0) > 중간(P1) > 낮음(P2)

---

## 📊 최근 완료된 작업 (2026-01-17 ~ 2026-01-20)

### ✅ 클럽 메인 페이지 리팩토링
- [x] 게시판 기능 제거 (화면 밀도 감소)
- [x] 나의 최근 전적 위젯 (MyRecentMatchesWidget) - 4명 플레이어 표시, 내 이름 하이라이팅
- [x] 내 다가오는 일정 위젯 (MyUpcomingSchedulesWidget)
- [x] 외부 요청 위젯 (ExternalRequestsWidget) - 운영진 전용
- [x] 위젯 간 구분선 추가
- [x] "위젯" 타이틀 제거, "순서편집" 버튼만 유지

### ✅ 일정 관리 URL 개선
- [x] `/schedules/club` - 클럽 일정
- [x] `/schedules/my` - 내 개인 일정
- [x] 기존 `/schedules` 라우트 제거
- [x] 하단 네비게이션 연동

### ✅ 외부 요청 페이지 디자인 개선
- [x] 필터 칩 스타일 개선 (부드러운 색상)
- [x] 승인/거절 버튼 스타일 개선

### ✅ 테스트 데이터 스크립트 개선
- [x] 환경 검증 추가 (프로덕션 실행 방지)
- [x] 트랜잭션 래핑
- [x] 멱등성 (ON CONFLICT) 추가
- [x] 개발 유저 6명 ADMIN 권한 부여
- [x] match 테이블 cleanup 추가

---

## 🔴 P0 - 즉시 진행 (운영진 요청)

### 1. 클럽장 권한 양도 기능 ⭐ 우선
**목적**: 클럽장이 부재하거나 교체가 필요한 경우 대응

**⚠️ 신중한 설계 필요**:
- 양도 후 되돌릴 수 없음 → 확인 프로세스 강화
- 2단계 확인 (비밀번호 재입력 또는 확인 메시지)

- [ ] **Backend**
  - [ ] ClubService에 `transferOwnership(clubId, toUserId)` 메서드
  - [ ] 검증: 현재 사용자가 OWNER인지, 대상자가 클럽 멤버인지
  - [ ] 트랜잭션: OWNER → ADMIN, 대상자 → OWNER
  - [ ] 감사 로그 기록

- [ ] **Frontend**
  - [ ] ClubManagePage에 "클럽장 양도" 버튼 추가
  - [ ] ClubOwnerTransferModal 컴포넌트
    - 클럽 멤버 목록 (OWNER 제외)
    - 대상자 선택
    - 확인 메시지 + 재확인 버튼
  - [ ] 양도 완료 후 페이지 새로고침

**예상 작업량**: 1-2일

---

### 2. 신규회원 모집 OPEN 시 안내문 등록 ⭐ 우선
**목적**: 모집 시 구체적인 조건과 안내 제공

**UI 플로우** (ScheduleDetailModal 게스트 모집 패턴 재사용):
```
운영정책 > 신규회원 모집
  → CLOSE → OPEN 전환 시
  → TextArea 표시 (모집 안내문 입력)
  → "등록" / "취소" 버튼
```

- [ ] **Backend**
  - [ ] Club 테이블에 `member_recruitment_note` 컬럼 추가
    ```sql
    ALTER TABLE club ADD COLUMN member_recruitment_note TEXT;
    COMMENT ON COLUMN club.member_recruitment_note IS '신규회원 모집 안내문';
    ```
  - [ ] ClubController: PATCH /api/clubs/{id}/recruitment-status
    - `{ status: "OPEN", note: "모집 안내문..." }`
  - [ ] ClubResponse에 recruitmentNote 필드 추가

- [ ] **Frontend**
  - [ ] ClubManagePolicyPage 수정
    - OPEN 선택 시 TextArea 표시
    - Placeholder: "예시) 초급자 환영, 주 1회 이상 참여 가능한 분"
  - [ ] RecruitClubsPage 카드에 모집 안내문 표시

**예상 작업량**: 1일

---

### 3. 클럽 초대 링크 생성 기능 ⭐ 우선
**목적**: 기존 회원이 새 회원을 쉽게 초대

- [ ] **Backend**
  - [ ] Entity: ClubInviteToken
    ```sql
    CREATE TABLE club_invite_token (
        id BIGSERIAL PRIMARY KEY,
        club_id BIGINT NOT NULL REFERENCES club(id),
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_by BIGINT NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_count INT DEFAULT 0
    );
    ```
  - [ ] POST /api/clubs/{id}/invite-tokens (토큰 생성, 7일 만료)
  - [ ] GET /api/clubs/join-by-invite?token=xxx (토큰으로 가입)
  - [ ] 검증: 만료 여부, 클럽 존재 여부

- [ ] **Frontend**
  - [ ] ClubInviteLinkModal 컴포넌트
    - "초대 링크 생성" 버튼
    - 링크 표시 + 복사 버튼
    - 만료일 표시
  - [ ] InviteJoinPage (/clubs/join?token=xxx)
    - 클럽 정보 표시
    - "가입하기" 버튼

**예상 작업량**: 2일

---

## 🟡 P1 - 핵심 기능 개선

### 4. 성별 정보 추가 및 필터링
**목적**: 여성 전용 클럽, 게스트 모집 시 성별 필터링 지원

**확정 사항**:
- 성별 선택지: **남자 / 여자 / 비공개** (3개)
- CTA 페이지에서 **필수 항목**으로 선택
- 기존 우리클럽 회원 전원 **MALE로 강제 설정**

- [ ] **Backend**
  - [ ] users 테이블에 `gender` 컬럼 추가 (MALE, FEMALE, PRIVATE)
  - [ ] Flyway 마이그레이션 스크립트
  - [ ] User 엔티티 및 DTO 수정
  - [ ] 회원가입 API에 성별 입력 추가

- [ ] **Frontend**
  - [ ] CTA 페이지에 성별 선택 필수 항목 추가 (라디오 버튼 3개)
  - [ ] 프로필 수정 모달에 성별 선택 UI 추가

- [ ] **게스트 모집 성별 필터** (추후)
  - [ ] Schedule 테이블에 `guest_gender_filter` 컬럼
  - [ ] ScheduleDetailModal에 성별 필터 선택 UI

- [ ] **모임 타입 추가** (추후)
  - [ ] Schedule 테이블에 `match_type` 컬럼 (남복/여복/혼복/단식)
  - [ ] ScheduleFormSection에 모임 타입 선택 UI

**예상 작업량**: 4-5일

---

### 5. 클럽 탐색 - 활동성 지표 추가
**목적**: 신규회원 모집 중인 클럽의 활동성을 한눈에 파악

**확정 사항**:
- 배치 실행: 새벽 3시
- 지표 형식: **"생성된 00개의 일정에 총 000명이 참여했습니다"**

- [ ] **Backend - 배치 작업**
  - [ ] `club_statistics` 테이블 생성
    ```sql
    CREATE TABLE club_statistics (
        club_id BIGINT PRIMARY KEY REFERENCES club(id),
        total_members INT DEFAULT 0,
        schedules_count_3months INT DEFAULT 0,
        participants_count_3months INT DEFAULT 0,
        last_updated_at TIMESTAMP
    );
    ```
  - [ ] 배치 작업: 매일 새벽 3시 실행
  - [ ] `/clubs` API 응답에 통계 정보 추가

- [ ] **Frontend - UI 개선**
  - [ ] RecruitClubsPage 카드에 표시:
    - "최근 3개월 00개 일정 / 총 000명 참여"
    - 클럽 개설일, 현재 인원수

**예상 작업량**: 2-3일

---

### 6. 게스트/교류전 모집 안내문 placeholder 개선
**목적**: 사용자가 무엇을 입력해야 할지 명확히 제시

- [ ] **ScheduleDetailModal - 게스트 모집**
  - [ ] Placeholder: "예시) NTRP 3.5 이상, 구력 2년 이상, 주차 가능"

- [ ] **ScheduleDetailModal - 교류전 모집**
  - [ ] Placeholder: "예시) 4vs4 교류전, 평균 구력 3년, 오후 2시~6시 예정"

**예상 작업량**: 0.5일

---

## 🟢 P2 - UX 개선 (여유 있을 때)

### 7. 비로그인 사용자 경험 개선
- [ ] 비로그인 시 접근 가능한 페이지 정의
- [ ] 로그인 유도 전략 설계

### 8. OTA (Onboarding Tour) 점검 및 개선
- [ ] 첫 로그인 시 OTA 자동 실행 확인
- [ ] 신규 기능 가이드 추가

### 9. 일정 초대 링크 (클럽 초대 후 구현)
- [ ] ScheduleInviteToken 엔티티
- [ ] 일정 초대 링크 생성/참가 기능

---

## 📋 우선순위 요약

| 우선순위 | 작업 항목 | 예상 기간 | 상태 |
|---------|----------|----------|------|
| **P0** | 클럽장 권한 양도 | 1-2일 | 📝 대기 |
| **P0** | 신규회원 모집 안내문 등록 | 1일 | 📝 대기 |
| **P0** | 클럽 초대 링크 생성 | 2일 | 📝 대기 |
| P1 | 성별 정보 추가 | 4-5일 | 📝 계획 |
| P1 | 클럽 활동성 지표 | 2-3일 | 📝 계획 |
| P1 | placeholder 개선 | 0.5일 | 📝 계획 |
| P2 | 비로그인 UX | 3-4일 | 🔮 나중에 |
| P2 | OTA 개선 | 2-3일 | 🔮 나중에 |
| P2 | 일정 초대 링크 | 2일 | 🔮 나중에 |

**P0 총 예상 작업량**: 4-5일

---

## 💡 권장 진행 순서

1. **클럽장 권한 양도** - 운영에 필수적인 기능
2. **신규회원 모집 안내문** - 게스트 모집 패턴 재사용 가능
3. **클럽 초대 링크** - 회원 확보에 유용
4. **placeholder 개선** - 작은 노력으로 즉각적인 효과
5. 이후 P1 기능 순차 진행

---

**마지막 업데이트**: 2026-01-20
