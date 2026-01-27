# OpenRun 클럽 기능 개발 Todo List

**작성일**: 2025-01-13
**예상 기간**: Phase 1-5 약 2-3주, Phase 6 추가 1주

---

## Phase 1: 클럽 기본 관리 (필수 기능)

### 1-1. 클럽 수정 및 삭제 (Backend) ✅ 완료
- [x] ClubService: updateClub(id, dto), deleteClub(id)
- [x] ClubController: PUT /api/clubs/{id}, DELETE /api/clubs/{id}
- [x] SecurityConfig: 위 엔드포인트에 authenticated() 추가
- [x] 권한 검증: OWNER만 수정/삭제 가능
- [x] JUnit 테스트 (80% 커버리지)

### 1-2. 클럽 수정 및 삭제 (Frontend) ✅ 완료
- [x] API 클라이언트: updateClub, deleteClub
- [x] ClubEditModal 컴포넌트
- [x] ClubDeleteConfirmModal 컴포넌트
- [x] CSS (BEM + 반응형)
- [x] React Testing Library 테스트

### 1-3. 클럽 회칙 기능 (Backend) ✅ 완료
- [x] Entity: ClubRule
- [x] Repository: ClubRuleRepository
- [x] Service: ClubRuleService (CRUD)
- [x] Controller: ClubRuleController
- [x] SecurityConfig 업데이트 (이미 authenticated)
- [x] JUnit 테스트 (작성 필요)

### 1-4. 클럽 회칙 기능 (Frontend) ✅ 완료
- [x] Types: ClubRule
- [x] API 클라이언트 (clubService에 추가)
- [x] ClubRulesPage 컴포넌트 (인라인 편집 모드, 드래그앤드롭)
- [x] ClubRulesPage.css (반응형 디자인, 전체 breakpoint 지원)
- [ ] React Testing Library 테스트 (필요시 추가)

---

## Phase 2: 커뮤니티 기능 (게시판, 공지사항)

### 2-1. 게시판 기능 (Backend) ✅ 완료
- [x] Entity: Post (category: GENERAL, NOTICE, QUESTION)
- [x] Entity: Comment
- [x] Entity: PostLike
- [x] Entity: CommentLike (댓글 좋아요 추가)
- [x] Repositories (PostRepository, CommentRepository, PostLikeRepository, CommentLikeRepository)
- [x] Services: PostService, CommentService
- [x] Controllers: PostController, CommentController
- [x] SecurityConfig 업데이트
- [x] JUnit 테스트 (PostServiceTest, CommentServiceTest, PostIntegrationTest)

### 2-2. 게시판 기능 (Frontend) ✅ 완료
- [x] Types: Post, Comment, PostCategory 추가 (club.ts)
- [x] API 클라이언트 (clubService.ts에 10개 함수 추가)
- [x] PostListPage 컴포넌트 (카테고리 필터링 포함)
- [x] PostDetailPage 컴포넌트 (댓글, 좋아요 기능 포함)
- [x] PostEditorPage 컴포넌트 (작성/수정)
- [x] CSS (BEM 네이밍, 전체 반응형 지원)
- [x] App.tsx 라우팅 추가

### 2-3. 공지사항 기능 ✅ 완료 (PostListPage 카테고리 필터로 구현됨)
- [x] Backend: category = 'NOTICE'로 필터링 (PostRepository에 구현됨)
- [x] Frontend: PostListPage에서 카테고리 탭으로 공지사항 필터링 가능
- [x] 카테고리 뱃지로 시각적 구분 (공지는 빨간색)

---

## Phase 3: 회원 관리 (가입, 권한, 명부)

### 3-1. 회원 역할 시스템 업데이트 (Backend)
- [ ] ClubRole ENUM 수정: OWNER, ADMIN, REGULAR_MEMBER, ASSOCIATE_MEMBER
- [ ] 계층적 권한 검증 로직 구현
- [ ] 기존 MEMBER → REGULAR_MEMBER 마이그레이션 스크립트
- [ ] JUnit 테스트

### 3-2. 회원명부 조회 (Frontend)
- [ ] MemberList 컴포넌트 (4단계 역할 표시)
- [ ] CSS + 테스트

### 3-3. 가입신청 및 권한관리 (Backend)
- [ ] Entity: JoinRequest (status: PENDING, APPROVED, REJECTED)
- [ ] Club Entity에 autoApprove 필드 추가
- [ ] Repository, Service, Controller
- [ ] PATCH /api/clubs/{id}/members/{memberId}/role (역할 변경)
- [ ] POST /api/clubs/{id}/join-requests (가입 신청)
- [ ] PATCH /api/clubs/{id}/join-requests/{requestId} (승인/거부, ADMIN 이상)
- [ ] SecurityConfig 업데이트
- [ ] JUnit 테스트

### 3-4. 가입신청 및 권한관리 (Frontend)
- [ ] JoinRequestList 컴포넌트
- [ ] MemberRoleChangeModal 컴포넌트 (4단계 역할)
- [ ] JoinRequestButton 컴포넌트
- [ ] CSS + 테스트

---

## Phase 4: 다중 클럽 지원

### 4-1. 다른 클럽 조회 및 가입 신청 (Backend)
- [ ] Club Entity에 isPublic 필드 추가
- [ ] GET /api/clubs/public (공개 클럽 목록)
- [ ] POST /api/clubs/{id}/join-requests (재사용)
- [ ] 비공개 클럽은 초대 링크 없이 가입 불가 검증

### 4-2. 다른 클럽 조회 및 가입 신청 (Frontend)
- [ ] PublicClubList 컴포넌트
- [ ] ClubSearchBar 컴포넌트
- [ ] JoinRequestButton (외부 클럽용)
- [ ] CSS + 테스트

### 4-3. 클럽 전환 기능 (Frontend)
- [ ] ClubContext 수정 (currentClubId 관리)
- [ ] ClubSwitcher 컴포넌트
- [ ] localStorage에 currentClubId 저장
- [ ] CSS + 테스트

### 4-4. 클럽 공개 여부 관리 (Backend + Frontend)
- [ ] Backend: OWNER + ADMIN 권한 검증
- [ ] Backend: ClubAuditLog Entity (변경 이력)
- [ ] Frontend: ClubPublicStatusToggle 컴포넌트
- [ ] Frontend: ClubAutoApproveToggle 컴포넌트
- [ ] CSS + 테스트

---

## Phase 5: 초대 링크 (부가 기능)

### 5-1. 클럽 초대 링크 (Backend)
- [ ] Entity: ClubInviteToken (expiresAt: 7일)
- [ ] Repository, Service, Controller
- [ ] POST /api/clubs/{id}/invite-tokens (생성)
- [ ] GET /api/clubs/join-by-invite?token=xxx (토큰으로 가입)
- [ ] SecurityConfig 업데이트
- [ ] JUnit 테스트

### 5-2. 클럽 초대 링크 (Frontend)
- [ ] InviteLinkGenerator 컴포넌트
- [ ] InviteLinkJoinPage 컴포넌트
- [ ] CSS + 테스트

### 5-3. 일정 초대 링크 (Backend)
- [ ] Entity: ScheduleInviteToken (expiresAt: 7일)
- [ ] Repository, Service, Controller
- [ ] POST /api/schedules/{id}/invite-tokens (생성)
- [ ] GET /api/schedules/join-by-invite?token=xxx (토큰으로 참가)
- [ ] SecurityConfig 업데이트
- [ ] JUnit 테스트

### 5-4. 일정 초대 링크 (Frontend)
- [ ] ScheduleInviteLinkGenerator 컴포넌트
- [ ] ScheduleInviteLinkJoinPage 컴포넌트
- [ ] CSS + 테스트

---

## Phase 6: 푸시 알림 (선택사항)

### 6-1. FCM 인프라 구축
- [ ] Firebase 프로젝트 설정
- [ ] Service Worker 등록 (firebase-messaging-sw.js)
- [ ] VAPID 키 생성
- [ ] Backend: Firebase Admin SDK 추가

### 6-2. 토큰 관리 (Backend)
- [ ] User Entity에 fcmToken 필드 추가
- [ ] POST /api/users/me/fcm-token (토큰 저장)
- [ ] DELETE /api/users/me/fcm-token (로그아웃 시)

### 6-3. 알림 발송 (Backend)
- [ ] NotificationService 구현
- [ ] 새 공지 등록 시 알림
- [ ] 일정 변경 시 알림
- [ ] 가입 신청 승인/거부 시 알림

### 6-4. 알림 수신 (Frontend)
- [ ] 포그라운드 메시지 리스너
- [ ] 백그라운드 메시지 처리 (Service Worker)
- [ ] 알림 설정 페이지
- [ ] CSS + 테스트

---

## 📊 주요 결정 사항

### 역할 시스템
- **4단계 계층 구조**: OWNER > ADMIN > REGULAR_MEMBER > ASSOCIATE_MEMBER
- **권한 상속**: 상위 역할은 하위 역할의 모든 권한 포함

### 클럽 공개 설정
- **공개 여부 변경**: OWNER + ADMIN (감사 로그 기록)
- **자동 승인 설정**: OWNER + ADMIN
- **생성 시 기본값**: 비공개 (isPublic = false), 수동 승인 (autoApprove = false)

### 가입 정책
- **공개 클럽**: 누구나 조회 가능, 가입 신청 가능 (autoApprove 설정에 따라 자동/수동 승인)
- **비공개 클럽**: 초대 링크를 통해서만 가입 신청 가능
- **승인 권한**: ADMIN 이상 (OWNER, ADMIN)

### 게시판
- **카테고리**: GENERAL, NOTICE, QUESTION (ENUM으로 관리)
- **댓글**: 1depth만, 좋아요 기능 포함
- **사진/영상**: 제외 (Object Storage 미연동)

### 초대 링크
- **만료 기간**: 7일
- **대상**: 클럽, 일정

### 푸시 알림
- **구현 방식**: Service Worker + FCM
- **지원 범위**: iOS Safari 제외한 대부분 브라우저
- **알림 종류**: 새 공지, 일정 변경, 가입 승인/거부

---

## 🗂️ 신규 데이터베이스 스키마

```sql
-- clubs 테이블에 컬럼 추가
ALTER TABLE clubs
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_approve BOOLEAN NOT NULL DEFAULT false;

-- club_members 테이블의 role ENUM 업데이트
ALTER TYPE club_role ADD VALUE 'REGULAR_MEMBER';
ALTER TYPE club_role ADD VALUE 'ASSOCIATE_MEMBER';
-- 기존 MEMBER → REGULAR_MEMBER 마이그레이션 필요

-- 클럽 회칙
CREATE TABLE club_rules (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 게시판
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL, -- 'GENERAL', 'NOTICE', 'QUESTION'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE post_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 가입 신청
CREATE TABLE join_requests (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    UNIQUE(club_id, user_id)
);

-- 클럽 초대 링크
CREATE TABLE club_invite_tokens (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 일정 초대 링크
CREATE TABLE schedule_invite_tokens (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE club_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'CHANGE_PUBLIC_STATUS', 'CHANGE_AUTO_APPROVE' 등
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- users 테이블에 FCM 토큰 컬럼 추가 (Phase 6)
ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255);
```

---

## 🔌 신규 API 엔드포인트

### 클럽 관리
- `PUT /api/clubs/{id}` - 클럽 수정 (OWNER)
- `DELETE /api/clubs/{id}` - 클럽 삭제 (OWNER)
- `PATCH /api/clubs/{id}/public-status` - 공개 여부 변경 (OWNER + ADMIN)
- `PATCH /api/clubs/{id}/auto-approve` - 자동 승인 설정 (OWNER + ADMIN)
- `GET /api/clubs/{id}/audit-logs` - 변경 이력 조회 (OWNER + ADMIN)

### 클럽 회칙
- `GET /api/clubs/{id}/rules` - 회칙 조회
- `POST /api/clubs/{id}/rules` - 회칙 생성 (ADMIN 이상)
- `PUT /api/clubs/{id}/rules/{ruleId}` - 회칙 수정 (ADMIN 이상)
- `DELETE /api/clubs/{id}/rules/{ruleId}` - 회칙 삭제 (ADMIN 이상)

### 게시판
- `GET /api/clubs/{id}/posts` - 게시글 목록
- `POST /api/clubs/{id}/posts` - 게시글 작성
- `GET /api/clubs/{id}/posts/{postId}` - 게시글 상세
- `PUT /api/clubs/{id}/posts/{postId}` - 게시글 수정
- `DELETE /api/clubs/{id}/posts/{postId}` - 게시글 삭제
- `POST /api/clubs/{id}/posts/{postId}/comments` - 댓글 작성
- `POST /api/clubs/{id}/posts/{postId}/likes` - 게시글 좋아요
- `POST /api/clubs/{clubId}/posts/{postId}/comments/{commentId}/likes` - 댓글 좋아요
- `DELETE /api/clubs/{clubId}/posts/{postId}/comments/{commentId}/likes` - 댓글 좋아요 취소

### 회원 관리
- `GET /api/clubs/{id}/members` - 회원 명부
- `POST /api/clubs/{id}/join-requests` - 가입 신청
- `GET /api/clubs/{id}/join-requests` - 가입 신청 목록 (ADMIN 이상)
- `PATCH /api/clubs/{id}/join-requests/{requestId}` - 승인/거부 (ADMIN 이상)
- `PATCH /api/clubs/{id}/members/{memberId}/role` - 역할 변경 (ADMIN 이상)

### 다중 클럽
- `GET /api/clubs/public` - 공개 클럽 목록
- `GET /api/users/me/clubs` - 내가 가입한 클럽 목록

### 초대 링크
- `POST /api/clubs/{id}/invite-tokens` - 클럽 초대 링크 생성 (ADMIN 이상)
- `GET /api/clubs/join-by-invite?token=xxx` - 초대 링크로 가입
- `POST /api/schedules/{id}/invite-tokens` - 일정 초대 링크 생성
- `GET /api/schedules/join-by-invite?token=xxx` - 초대 링크로 참가

### 푸시 알림 (Phase 6)
- `POST /api/users/me/fcm-token` - FCM 토큰 저장
- `DELETE /api/users/me/fcm-token` - FCM 토큰 삭제

---

**최종 업데이트**: 2025-01-13
