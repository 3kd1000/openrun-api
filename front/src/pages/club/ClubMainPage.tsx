import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../../services/api/axiosInstance";
import { getMyClubs, type MyClub } from "../../services/api/userApi";
import { postService } from "../../services/postService";
import { commentService } from "../../services/commentService";
import type { Club } from "../../types/club";
import {
  PostType,
  type Post,
  type Comment,
  type PostType as PostTypeT,
} from "../../types/post";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import {
  CompassIcon,
  BookOpenIcon,
  ClipboardListIcon,
  SettingsIcon,
} from "../../components/common/Icons";
import { ChevronRightIcon } from "../../components/common/Icons";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageCircleIcon,
} from "../../components/common/Icons";
import {
  canManageClub,
  normalizeClubRole,
  type ClubRoleOrUnknown,
} from "../../utils/role";
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../../utils/openrunSession";
import {
  getClubSettings,
  migrateLegacyClubSettingsIfNeeded,
  setClubSettings,
} from "../../utils/openrunClubSettings";
import { CategoryTabs } from "./components/CategoryTabs";
import { PostCard } from "./components/PostCard";
import QuickPostInput from "./components/QuickPostInput";
import UpcomingSchedulesWidget from "./components/widgets/UpcomingSchedulesWidget";
import TopPlayersWidget from "./components/widgets/TopPlayersWidget";
import { ClubSelector } from "../../components/ClubSelector";
import "./ClubMainPage.css";
import { clubService } from "../../services/clubService";

const PAGE_SIZE = 30;
type ClubWidgetId = "upcomingSchedules" | "topPlayers" | "board";

const ClubMainPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId: clubIdParam } = useParams<{ clubId: string }>();

  // 클럽 정보
  const [club, setClub] = useState<Club | null>(null);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [isLoadingClub, setIsLoadingClub] = useState(true);

  // 게시판 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [selectedPostType, setSelectedPostType] = useState<PostTypeT | null>(
    null
  );
  const [expandedPostIds, setExpandedPostIds] = useState<Set<number>>(
    new Set()
  );
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [noticeUnreadCount, setNoticeUnreadCount] = useState<number>(0);

  // Infinite scroll observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const session = getOpenRunSession();
  const clubId = clubIdParam ?? session.currentClubId;
  const userIdStr = session.userId ? String(session.userId) : null;

  const [myRole, setMyRole] = useState<ClubRoleOrUnknown>(() => {
    const session = getOpenRunSession();
    return normalizeClubRole(session.currentClubRole);
  });
  const canManage = canManageClub(myRole);

  // 정회원/준회원은 "자유(GENERAL)"만: 탭 미노출 + 필터 고정
  useEffect(() => {
    if (!canManage) setSelectedPostType(PostType.GENERAL);
  }, [canManage]);

  // URL 기준 clubId를 session에 동기화 (클럽 내 라우팅 표준화)
  useEffect(() => {
    if (!clubIdParam) return;
    try {
      setOpenRunSession({ currentClubId: clubIdParam });
    } catch {
      // ignore
    }
  }, [clubIdParam]);
  // legacy key들 마이그레이션 (한 번만)
  useEffect(() => {
    if (!clubId) return;
    migrateLegacyClubSettingsIfNeeded({
      clubId: String(clubId),
      knownWidgetIds: ["upcomingSchedules", "topPlayers", "board"],
      defaultWidgetOrder: ["upcomingSchedules", "topPlayers", "board"],
    });
  }, [clubId]);

  const DEFAULT_WIDGET_ORDER: ClubWidgetId[] = [
    "upcomingSchedules",
    "topPlayers",
    "board",
  ];

  const [isWidgetEditMode, setIsWidgetEditMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<ClubWidgetId[]>(() => {
    try {
      const session = getOpenRunSession();
      const resolvedClubId = clubIdParam ?? session.currentClubId;
      if (!resolvedClubId) return DEFAULT_WIDGET_ORDER;
      const settings = getClubSettings(String(resolvedClubId));
      const saved = settings.widgets?.order;
      if (!saved) return DEFAULT_WIDGET_ORDER;
      const filtered = saved.filter(
        (v): v is ClubWidgetId =>
          v === "upcomingSchedules" || v === "topPlayers" || v === "board"
      );
      // 누락된 위젯은 뒤에 붙이기
      const missing = DEFAULT_WIDGET_ORDER.filter(
        (id) => !filtered.includes(id)
      );
      // 게시판 위젯은 항상 하단 고정
      const withoutBoard = [...filtered, ...missing].filter(
        (id) => id !== "board"
      );
      return [...withoutBoard, "board"];
    } catch {
      return DEFAULT_WIDGET_ORDER;
    }
  });

  // 위젯 접힘 상태 (localStorage만 쓰면 리렌더가 안 되어 토글이 동작하지 않음 → state로 반영)
  const [widgetExpandedMap, setWidgetExpandedMap] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const session = getOpenRunSession();
      const resolvedClubId = clubIdParam ?? session.currentClubId;
      if (!resolvedClubId) return {};
      const settings = getClubSettings(String(resolvedClubId));
      return settings.widgets?.expanded ?? {};
    } catch {
      return {};
    }
  });

  // clubId 변경 시 localStorage 기반으로 다시 로드
  useEffect(() => {
    try {
      if (!clubId) {
        setWidgetOrder(DEFAULT_WIDGET_ORDER);
        setWidgetExpandedMap({});
        return;
      }
      const settings = getClubSettings(String(clubId));
      const saved = settings.widgets?.order;
      setWidgetExpandedMap(settings.widgets?.expanded ?? {});
      if (!saved) {
        setWidgetOrder(DEFAULT_WIDGET_ORDER);
        return;
      }
      const filtered = saved.filter(
        (v): v is ClubWidgetId =>
          v === "upcomingSchedules" || v === "topPlayers" || v === "board"
      );
      const missing = DEFAULT_WIDGET_ORDER.filter(
        (id) => !filtered.includes(id)
      );
      const withoutBoard = [...filtered, ...missing].filter(
        (id) => id !== "board"
      );
      setWidgetOrder([...withoutBoard, "board"]);
    } catch {
      setWidgetOrder(DEFAULT_WIDGET_ORDER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // 순서 저장
  useEffect(() => {
    if (!clubId) return;
    setClubSettings(String(clubId), {
      widgets: { order: widgetOrder as unknown as string[] },
    });
  }, [clubId, widgetOrder]);

  const getWidgetExpanded = useCallback(
    (widgetId: ClubWidgetId, fallback: boolean) => {
      if (!clubId) return fallback;
      const v = widgetExpandedMap[widgetId];
      return typeof v === "boolean" ? v : fallback;
    },
    [clubId, widgetExpandedMap]
  );

  const setWidgetExpanded = useCallback(
    (widgetId: ClubWidgetId, expanded: boolean) => {
      if (!clubId) return;
      setWidgetExpandedMap((prev) => ({ ...prev, [widgetId]: expanded }));
      setClubSettings(String(clubId), {
        widgets: { expanded: { [widgetId]: expanded } },
      });
    },
    [clubId]
  );

  // ---- Drag reorder (pointer-based, mobile-friendly) ----
  const widgetRefMap = useRef(new Map<ClubWidgetId, HTMLDivElement | null>());
  const [draggingWidgetId, setDraggingWidgetId] = useState<ClubWidgetId | null>(
    null
  );

  const moveWidget = useCallback(
    (dragId: ClubWidgetId, overId: ClubWidgetId) => {
      // 게시판 위젯은 항상 하단 고정(이동 불가)
      if (dragId === "board" || overId === "board") return;
      setWidgetOrder((prev) => {
        const from = prev.indexOf(dragId);
        const to = prev.indexOf(overId);
        if (from === -1 || to === -1 || from === to) return prev;
        const next = [...prev];
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        return next;
      });
    },
    []
  );

  const handleDragStart = useCallback(
    (widgetId: ClubWidgetId, e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isWidgetEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraggingWidgetId(widgetId);
      document.body.style.userSelect = "none";
    },
    [isWidgetEditMode]
  );

  const endDrag = useCallback(() => {
    setDraggingWidgetId(null);
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (!draggingWidgetId) return;

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      const y = e.clientY;
      const currentOrder = [...widgetOrder];
      for (const id of currentOrder) {
        const el = widgetRefMap.current.get(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          if (id !== draggingWidgetId) {
            moveWidget(draggingWidgetId, id);
          }
          break;
        }
      }
    };

    const onUp = () => endDrag();
    const onCancel = () => endDrag();

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [draggingWidgetId, endDrag, moveWidget, widgetOrder]);

  const loadClubData = useCallback(async () => {
    try {
      setIsLoadingClub(true);

      // 사용자의 클럽 목록 조회
      const clubs = await getMyClubs();
      setMyClubs(clubs);

      // 현재 클럽 정보 조회
      if (clubId) {
        const response = await axiosInstance.get(`/clubs/${clubId}`);
        setClub(response.data);
      } else if (clubs.length > 0) {
        // clubId가 없으면 첫 번째 클럽을 기본으로 설정
        setOpenRunSession({ currentClubId: String(clubs[0].id) });
        const response = await axiosInstance.get(`/clubs/${clubs[0].id}`);
        setClub(response.data);
      }

      // 현재 클럽에서의 내 역할(role) 조회 후 로컬 캐시
      // (club_member 테이블 기반: /clubs/{clubId}/membership 응답에서 userId로 필터)
      const resolvedClubId =
        clubId || (clubs.length > 0 ? String(clubs[0].id) : null);
      if (resolvedClubId && userIdStr) {
        try {
          const membershipResponse = await axiosInstance.get(
            `/clubs/${resolvedClubId}/membership`,
            { params: { status: "ACTIVE" } }
          );
          const list = membershipResponse.data as Array<{
            userId: number;
            role: string;
          }>;
          const mine = list.find((m) => String(m.userId) === userIdStr);
          const role = normalizeClubRole(mine?.role ?? "REGULAR");
          setMyRole(role);
          setOpenRunSession({ currentClubRole: role });
        } catch {
          // 역할 조회 실패 시 기존 값 유지 (UNKNOWN이면 MEMBER로 간주)
          if (myRole === "UNKNOWN") setMyRole("REGULAR");
        }
      }
    } catch (error: unknown) {
      logError("클럽 정보 조회", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        alert("클럽 정보를 조회할 권한이 없습니다.");
      } else {
        alert(getErrorMessage(error));
      }
    } finally {
      setIsLoadingClub(false);
    }
  }, [clubId, myRole, userIdStr]);

  const loadPosts = useCallback(
    async (page: number = 0, isInitial: boolean = false) => {
      if (!clubId) return;

      try {
        if (isInitial) {
          setIsLoadingPosts(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const data = await postService.getPosts(
          Number(clubId),
          selectedPostType || undefined,
          page,
          PAGE_SIZE
        );

        // 공지사항은 게시판(Post)에서 제거: 항상 숨김 처리
        const visible = data.content.filter(
          (p) => p.postType !== PostType.NOTICE
        );

        if (isInitial) {
          setPosts(visible);
        } else {
          setPosts((prev) => [...prev, ...visible]);
        }

        setCurrentPage(data.number);
        setHasMore(!data.last);
      } catch (error: unknown) {
        logError("게시글 조회", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setError("게시글을 조회할 권한이 없습니다.");
        } else {
          setError(getErrorMessage(error));
        }
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    },
    [clubId, selectedPostType]
  );

  // 클럽 정보 로드
  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  // 공지 unread count 로드 (dot 표시용)
  useEffect(() => {
    if (!clubId) return;
    clubService
      .getClubNoticeUnreadCount(Number(clubId))
      .then((res) => setNoticeUnreadCount(res.unreadCount))
      .catch(() => {});
  }, [clubId]);

  // 게시글 목록 초기 로드 (postType 변경 시 리셋)
  useEffect(() => {
    if (clubId) {
      setPosts([]);
      setCurrentPage(0);
      setHasMore(true);
      loadPosts(0, true);
    }
  }, [clubId, selectedPostType, loadPosts]);

  // 더 많은 게시글 로드
  const loadMorePosts = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadPosts(currentPage + 1, false);
    }
  }, [currentPage, isLoadingMore, hasMore, loadPosts]);

  // Intersection Observer 설정
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoadingPosts
        ) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMorePosts, hasMore, isLoadingMore, isLoadingPosts]);

  const loadComments = async (postId: number) => {
    if (!clubId) return;

    try {
      const data = await commentService.getComments(Number(clubId), postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (error: unknown) {
      logError("댓글 조회", error);
    }
  };

  const handleClubChange = (newClubId: string) => {
    setOpenRunSession({ currentClubId: newClubId, currentClubRole: "UNKNOWN" });
    navigate(`/clubs/${newClubId}`, { replace: true });
  };

  const handleTogglePost = (postId: number) => {
    // 운영진이 '문의(INQUIRY)' 글을 눌렀을 때는 게시판 상세로 가지 않고
    // 클럽관리 > 외부요청으로 바로 이동해서 승인/반려/댓글까지 한 화면에서 처리한다.
    if (canManage) {
      const target = posts.find((p) => p.id === postId);
      if (target?.postType === PostType.INQUIRY) {
        navigate(`/clubs/${clubId}/manage/external-requests?postId=${postId}`);
        return;
      }
    }

    setExpandedPostIds((prev) => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(postId);

      if (isExpanding) {
        newSet.add(postId);
        // 댓글이 아직 로드되지 않았으면 로드
        if (!comments[postId]) {
          loadComments(postId);
        }
      } else {
        newSet.delete(postId);
      }

      return newSet;
    });
  };

  const handleLikePost = async (postId: number) => {
    if (!clubId) return;

    try {
      const result = await postService.toggleLike(Number(clubId), postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, liked: result.liked, likeCount: result.likeCount }
            : post
        )
      );
    } catch (error: unknown) {
      logError("좋아요", error);
      alert(getErrorMessage(error));
    }
  };

  const handleLikeComment = async (postId: number, commentId: number) => {
    if (!clubId) return;

    try {
      const result = await commentService.toggleLike(
        Number(clubId),
        postId,
        commentId
      );
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].map((comment) =>
          comment.id === commentId
            ? { ...comment, liked: result.liked, likeCount: result.likeCount }
            : comment
        ),
      }));
    } catch (error: unknown) {
      logError("댓글 좋아요", error);
    }
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!clubId) return;

    try {
      const newComment = await commentService.createComment(
        Number(clubId),
        postId,
        { content }
      );
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
    } catch (error: unknown) {
      logError("댓글 작성", error);
      throw error; // PostCard에서 처리
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!clubId) return;

    try {
      await commentService.deleteComment(Number(clubId), postId, commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        )
      );
    } catch (error: unknown) {
      logError("댓글 삭제", error);
      alert(getErrorMessage(error));
    }
  };

  const handleCreatePost = async (content: string) => {
    if (!clubId) return;

    try {
      // 클럽 내부 글쓰기는 "자유(GENERAL)"만 지원
      await postService.createPost(Number(clubId), {
        content,
        postType: PostType.GENERAL,
      });
      // 새 글 작성 후 목록 리셋 및 첫 페이지 로드
      setPosts([]);
      setCurrentPage(0);
      setHasMore(true);
      await loadPosts(0, true);
    } catch (error: unknown) {
      logError("게시글 작성", error);
      throw error;
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!clubId) return;

    try {
      await postService.deletePost(Number(clubId), postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setExpandedPostIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } catch (error: unknown) {
      logError("게시글 삭제", error);
      alert(getErrorMessage(error));
    }
  };

  const handlePostTypeChange = (postType: PostTypeT | null) => {
    setSelectedPostType(postType);
    setExpandedPostIds(new Set()); // 타입 변경 시 모든 게시글 접기
  };

  // 헤더 아이콘 핸들러
  const handleExploreClubs = () => {
    // 클럽 메인 -> 탐색으로 들어간 경우에만 "뒤로가기"를 보여주기 위해 state 전달
    navigate("/clubs/explore", { state: { fromClubId: clubId } });
  };

  const handleViewMembers = () => {
    navigate(`/clubs/${clubId}/members`);
  };

  const handleViewRules = () => {
    // 진입 시 "최신 공지까지 읽음 처리" (실패해도 UX는 진행)
    if (clubId) {
      void clubService
        .markClubNoticesRead(Number(clubId))
        .then(() => setNoticeUnreadCount(0))
        .catch(() => {});
    }
    navigate(`/clubs/${clubId}/rules`);
  };

  const handleManageClub = () => {
    navigate(`/clubs/${clubId}/manage`);
  };

  // 로딩 중
  if (isLoadingClub) {
    return (
      <div className="club-main-page">
        <div className="club-main-page__loading">로딩 중...</div>
      </div>
    );
  }

  // 소속 클럽 없음
  if (!club && myClubs.length === 0) {
    return (
      <div className="club-main-page">
        <div className="club-main-page__empty">
          <p className="club-main-page__empty-icon">👥</p>
          <p className="club-main-page__empty-message">
            소속된 클럽이 없습니다.
          </p>
          <button
            className="club-main-page__empty-button"
            onClick={() => navigate("/clubs/explore")}
          >
            클럽 찾아보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="club-main-page">
      {/* ClubSelector */}
      <div className="page-club-selector-container">
        <ClubSelector
          selectedClubId={clubId ? Number(clubId) : null}
          onClubChange={(newClubId) => {
            if (newClubId) {
              handleClubChange(newClubId.toString());
            }
          }}
        />
      </div>

      {/* 클럽 헤더 액션 버튼 */}
      <div className="club-main-page__header">
        <div className="club-main-page__header-actions">
          <button
            className="club-main-page__header-btn"
            onClick={handleExploreClubs}
            title="클럽 탐색"
          >
            <CompassIcon size={20} />
            <span className="club-main-page__header-btn-text">탐색</span>
          </button>
          <button
            className="club-main-page__header-btn"
            onClick={handleViewRules}
            title="공지/회칙"
          >
            <BookOpenIcon size={20} />
            <span className="club-main-page__header-btn-text">
              공지/회칙
              {noticeUnreadCount > 0 && (
                <span
                  className="club-main-page__notice-dot"
                  aria-label="읽지 않은 공지 있음"
                />
              )}
            </span>
          </button>
          {canManage && (
            <button
              className="club-main-page__header-btn"
              onClick={handleManageClub}
              title="클럽 관리"
            >
              <SettingsIcon size={20} />
              <span className="club-main-page__header-btn-text">관리</span>
            </button>
          )}
          <button
            className="club-main-page__header-btn"
            onClick={handleViewMembers}
            title="클럽원"
          >
            <ClipboardListIcon size={20} />
            <span className="club-main-page__header-btn-text">클럽원</span>
          </button>
        </div>
      </div>

      {/* 위젯 영역 */}
      <div className="club-main-page__widgets">
        <div className="club-main-page__widgets-toolbar">
          <div className="club-main-page__widgets-title">위젯</div>
          <button
            className={`club-main-page__widgets-edit-btn ${
              isWidgetEditMode ? "active" : ""
            }`}
            onClick={() => setIsWidgetEditMode((prev) => !prev)}
            type="button"
          >
            {isWidgetEditMode ? "완료" : "편집"}
          </button>
        </div>

        {clubId &&
          widgetOrder.map((widgetId) => (
            <div
              key={widgetId}
              className={`club-main-page__widget-item ${
                draggingWidgetId === widgetId ? "dragging" : ""
              }`}
              ref={(el) => {
                widgetRefMap.current.set(widgetId, el);
              }}
            >
              {isWidgetEditMode && widgetId !== "board" && (
                <button
                  className="club-main-page__widget-drag-handle"
                  type="button"
                  aria-label="위젯 순서 변경"
                  onPointerDown={(e) => handleDragStart(widgetId, e)}
                >
                  ⋮⋮
                </button>
              )}

              {widgetId === "upcomingSchedules" && (
                <UpcomingSchedulesWidget
                  clubId={Number(clubId)}
                  maxItems={3}
                  expanded={getWidgetExpanded("upcomingSchedules", true)}
                  onExpandedChange={(v) =>
                    setWidgetExpanded("upcomingSchedules", v)
                  }
                />
              )}
              {widgetId === "topPlayers" && (
                <TopPlayersWidget
                  clubId={Number(clubId)}
                  maxItems={3}
                  expanded={getWidgetExpanded("topPlayers", true)}
                  onExpandedChange={(v) => setWidgetExpanded("topPlayers", v)}
                />
              )}
              {widgetId === "board" && (
                <div className="club-main-page__feed-section">
                  <div className="club-main-page__feed-header">
                    <button
                      className="club-main-page__feed-header-left"
                      type="button"
                      onClick={() =>
                        setWidgetExpanded(
                          "board",
                          !getWidgetExpanded("board", true)
                        )
                      }
                    >
                      <MessageCircleIcon size={16} />
                      <span className="club-main-page__feed-title">게시판</span>
                      {getWidgetExpanded("board", true) ? (
                        <ChevronUpIcon size={14} />
                      ) : (
                        <ChevronDownIcon size={14} />
                      )}
                    </button>
                    <button
                      className="club-main-page__feed-view-all"
                      type="button"
                      onClick={() => navigate(`/clubs/${clubId}/posts`)}
                    >
                      전체보기
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                  {getWidgetExpanded("board", true) && (
                    <>
                      {/* 게시글 타입 탭: ADMIN+만 노출 (전체/자유/문의) */}
                      {canManage && (
                        <CategoryTabs
                          selectedPostType={selectedPostType}
                          onSelectPostType={handlePostTypeChange}
                          allowedPostTypes={[
                            PostType.GENERAL,
                            PostType.INQUIRY,
                          ]}
                          showAllTab
                        />
                      )}

                      {/* 게시글 목록 */}
                      <div className="club-main-page__posts">
                        {isLoadingPosts && (
                          <div className="club-main-page__posts-loading">
                            게시글을 불러오는 중...
                          </div>
                        )}

                        {error && (
                          <div className="club-main-page__posts-error">
                            {error}
                          </div>
                        )}

                        {!isLoadingPosts && !error && posts.length === 0 && (
                          <div className="club-main-page__posts-empty">
                            <p className="club-main-page__posts-empty-icon">
                              📝
                            </p>
                            <p className="club-main-page__posts-empty-message">
                              {selectedPostType
                                ? "해당 카테고리에 게시글이 없습니다."
                                : "아직 작성된 글이 없습니다."}
                            </p>
                            <p className="club-main-page__posts-empty-hint">
                              첫 글을 작성해보세요!
                            </p>
                          </div>
                        )}

                        {!isLoadingPosts &&
                          !error &&
                          posts.map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              comments={comments[post.id] || []}
                              isExpanded={expandedPostIds.has(post.id)}
                              onToggleExpand={handleTogglePost}
                              onLikePost={handleLikePost}
                              onLikeComment={handleLikeComment}
                              onAddComment={handleAddComment}
                              onDeleteComment={handleDeleteComment}
                              onDeletePost={handleDeletePost}
                            />
                          ))}

                        {/* Infinite Scroll 트리거 */}
                        {!isLoadingPosts && !error && posts.length > 0 && (
                          <div
                            ref={loadMoreRef}
                            className="club-main-page__load-more"
                          >
                            {isLoadingMore && (
                              <div className="club-main-page__posts-loading">
                                더 불러오는 중...
                              </div>
                            )}
                            {!hasMore && posts.length > PAGE_SIZE && (
                              <div className="club-main-page__posts-end">
                                모든 게시글을 불러왔습니다.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 빠른 글쓰기 입력 */}
                      <div className="club-main-page__feed-input">
                        <QuickPostInput onSubmit={handleCreatePost} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 게시판(게시글 목록 + 인풋)을 하나의 위젯으로 관리 */}
    </div>
  );
};

export default ClubMainPage;
