import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { useAuth } from "../../../contexts/AuthContext";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import {
  MegaphoneIcon,
  UsersIcon,
  SettingsIcon,
  UserPlusIcon,
} from "../../../components/common/Icons";
import { MailOpen } from "lucide-react";
import {
  canManageClub,
  normalizeClubRole,
  type ClubRoleOrUnknown,
} from "../../../utils/role";
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import {
  getClubSettings,
  migrateLegacyClubSettingsIfNeeded,
  setClubSettings,
} from "../../../utils/openrunClubSettings";
import UpcomingSchedulesWidget from "./components/widgets/UpcomingSchedulesWidget";
import TopPlayersWidget from "./components/widgets/TopPlayersWidget";
import ExternalRequestsWidget from "./components/widgets/ExternalRequestsWidget";
import MyUpcomingSchedulesWidget from "./components/widgets/MyUpcomingSchedulesWidget";
import MyRecentMatchesWidget from "./components/widgets/MyRecentMatchesWidget";
import WidgetSettingsModal, {
  getDefaultSelectedWidgets,
} from "./components/widgets/WidgetSettingsModal";
import { cn } from "@/lib/utils";
import { clubService } from "../../../services/clubService";
import { syncClubList } from "../../../services/api/userApi";
import MemberInviteGuide from "../../../components/openrun/member-invite-guide";

// 신규 위젯 ID 타입 (board 제거, 신규 위젯 추가)
type ClubWidgetId =
  | "upcomingSchedules"
  | "mySchedules"
  | "topPlayers"
  | "myRecentMatches"
  | "externalRequests";

const ClubMainPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { clubId: clubIdParam } = useParams<{ clubId: string }>();
  const { isAuthReady, user } = useAuth();

  // 클럽 정보
  const [club, setClub] = useState<Club | null>(null);
  const [isLoadingClub, setIsLoadingClub] = useState(true);
  const [contentUnreadCount, setContentUnreadCount] = useState<number>(0);

  // clubList 로딩 완료 여부 (기존 사용자 동기화 대기용)
  const [clubListLoaded, setClubListLoaded] = useState(() => {
    return getOpenRunSession().clubList !== undefined;
  });

  const session = getOpenRunSession();
  const clubId = clubIdParam ?? session.currentClubId;
  const userIdStr = session.userId ? String(session.userId) : null;

  // 클럽원 초대 가이드 dismiss 상태
  const [inviteGuideDismissed, setInviteGuideDismissed] = useState(() => {
    if (!clubId) return true;
    return getClubSettings(String(clubId)).onboarding?.inviteGuideDismissed ?? false;
  });

  const [myRole, setMyRole] = useState<ClubRoleOrUnknown>(() => {
    const session = getOpenRunSession();
    return normalizeClubRole(session.currentClubRole);
  });
  const canManage = canManageClub(myRole);

  // URL 기준 clubId를 session에 동기화 (클럽 내 라우팅 표준화)
  // 단, clubList에 있는 유효한 클럽만 세션에 저장
  useEffect(() => {
    if (!clubIdParam || !clubListLoaded) return;

    const currentSession = getOpenRunSession();
    const clubList = currentSession.clubList ?? [];
    const isValidClub = clubList.some(c => String(c.id) === clubIdParam);

    if (isValidClub) {
      try {
        setOpenRunSession({ currentClubId: clubIdParam });
      } catch {
        // ignore
      }
    }
    // 유효하지 않은 clubId는 loadClubData에서 처리
  }, [clubIdParam, clubListLoaded]);

  // legacy key들 마이그레이션 (한 번만)
  useEffect(() => {
    if (!clubId) return;
    migrateLegacyClubSettingsIfNeeded({
      clubId: String(clubId),
      knownWidgetIds: [
        "upcomingSchedules",
        "mySchedules",
        "topPlayers",
        "myRecentMatches",
        "externalRequests",
      ],
      defaultWidgetOrder: [
        "upcomingSchedules",
        "mySchedules",
        "topPlayers",
        "myRecentMatches",
        "externalRequests",
      ],
    });
  }, [clubId]);

  const DEFAULT_WIDGET_ORDER: ClubWidgetId[] = [
    "upcomingSchedules",
    "mySchedules",
    "topPlayers",
    "myRecentMatches",
    "externalRequests",
  ];

  const VALID_WIDGET_IDS: ClubWidgetId[] = [
    "upcomingSchedules",
    "mySchedules",
    "topPlayers",
    "myRecentMatches",
    "externalRequests",
  ];

  const [isWidgetEditMode, setIsWidgetEditMode] = useState(false);
  const [showWidgetSettingsModal, setShowWidgetSettingsModal] = useState(false);

  // 선택된 위젯 목록 (localStorage에서 복원, 역할에 따라 기본값 다름)
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(() => {
    try {
      const session = getOpenRunSession();
      const resolvedClubId = clubIdParam ?? session.currentClubId;
      const isAdmin = canManageClub(normalizeClubRole(session.currentClubRole));
      const defaultWidgets = getDefaultSelectedWidgets(isAdmin);
      if (!resolvedClubId) return defaultWidgets;
      const settings = getClubSettings(String(resolvedClubId));
      const saved = settings.widgets?.selected;
      if (!saved || saved.length === 0) return defaultWidgets;
      return saved.filter((v) => VALID_WIDGET_IDS.includes(v as ClubWidgetId));
    } catch {
      return getDefaultSelectedWidgets(false);
    }
  });

  const [widgetOrder, setWidgetOrder] = useState<ClubWidgetId[]>(() => {
    try {
      const session = getOpenRunSession();
      const resolvedClubId = clubIdParam ?? session.currentClubId;
      if (!resolvedClubId) return DEFAULT_WIDGET_ORDER;
      const settings = getClubSettings(String(resolvedClubId));
      const saved = settings.widgets?.order;
      if (!saved) return DEFAULT_WIDGET_ORDER;
      const filtered = saved.filter((v): v is ClubWidgetId =>
        VALID_WIDGET_IDS.includes(v as ClubWidgetId)
      );
      // 누락된 위젯은 뒤에 붙이기
      const missing = DEFAULT_WIDGET_ORDER.filter(
        (id) => !filtered.includes(id)
      );
      return [...filtered, ...missing];
    } catch {
      return DEFAULT_WIDGET_ORDER;
    }
  });

  // 위젯 접힘 상태
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
    const defaultWidgets = getDefaultSelectedWidgets(canManage);
    try {
      if (!clubId) {
        setWidgetOrder(DEFAULT_WIDGET_ORDER);
        setWidgetExpandedMap({});
        setSelectedWidgets(defaultWidgets);
        return;
      }
      const settings = getClubSettings(String(clubId));

      // 선택된 위젯 복원
      const savedSelected = settings.widgets?.selected;
      if (savedSelected && savedSelected.length > 0) {
        setSelectedWidgets(
          savedSelected.filter((v) => VALID_WIDGET_IDS.includes(v as ClubWidgetId))
        );
      } else {
        setSelectedWidgets(defaultWidgets);
      }

      // 순서 복원
      const savedOrder = settings.widgets?.order;
      setWidgetExpandedMap(settings.widgets?.expanded ?? {});
      if (!savedOrder) {
        setWidgetOrder(DEFAULT_WIDGET_ORDER);
        return;
      }
      const filtered = savedOrder.filter((v): v is ClubWidgetId =>
        VALID_WIDGET_IDS.includes(v as ClubWidgetId)
      );
      const missing = DEFAULT_WIDGET_ORDER.filter(
        (id) => !filtered.includes(id)
      );
      setWidgetOrder([...filtered, ...missing]);
    } catch {
      setWidgetOrder(DEFAULT_WIDGET_ORDER);
      setSelectedWidgets(defaultWidgets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, canManage]);

  // 순서 저장
  useEffect(() => {
    if (!clubId) return;
    setClubSettings(String(clubId), {
      widgets: { order: widgetOrder as unknown as string[] },
    });
  }, [clubId, widgetOrder]);

  // 선택된 위젯 저장
  useEffect(() => {
    if (!clubId) return;
    setClubSettings(String(clubId), {
      widgets: { selected: selectedWidgets },
    });
  }, [clubId, selectedWidgets]);

  // 위젯 설정 저장 핸들러
  const handleSaveWidgetSettings = (newSelected: string[]) => {
    setSelectedWidgets(newSelected);
  };

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
  const widgetRefMap = React.useRef(
    new Map<ClubWidgetId, HTMLDivElement | null>()
  );
  const [draggingWidgetId, setDraggingWidgetId] = useState<ClubWidgetId | null>(
    null
  );

  const moveWidget = useCallback(
    (dragId: ClubWidgetId, overId: ClubWidgetId) => {
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
    // Firebase 인증이 준비될 때까지 대기 (타이밍 이슈 방지)
    if (!isAuthReady) {
      console.log("⏳ Firebase 인증 준비 중... 클럽 데이터 로딩 대기");
      return;
    }

    // clubList 로딩 대기 (기존 사용자 동기화)
    if (!clubListLoaded) {
      console.log("⏳ clubList 로딩 대기 중...");
      return;
    }

    // 로그인되지 않았으면 로그인 페이지로
    if (!user) {
      console.log("❌ 로그인되지 않음 → 로그인 페이지로 이동");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsLoadingClub(true);

      // 클럽 ID가 없으면 클럽 탐색 페이지로 리다이렉트
      if (!clubId) {
        console.log("✅ 가입한 클럽 없음 → 클럽 탐색 페이지(신규회원 모집 탭)로 이동");
        navigate("/explore", { replace: true, state: { defaultTab: "member" } });
        return;
      }

      // URL의 clubId가 세션의 clubList에 있는지 사전 검증
      const currentSession = getOpenRunSession();
      let clubList = currentSession.clubList ?? [];
      let isValidClub = clubList.some(c => String(c.id) === clubId);

      // clubList에 없으면 → 서버에서 최신 목록 동기화 후 재검증
      if (!isValidClub) {
        console.log(`⚠️ clubList에 ${clubId} 없음 → syncClubList 시도`);
        try {
          await syncClubList();
          const refreshed = getOpenRunSession();
          clubList = refreshed.clubList ?? [];
          isValidClub = clubList.some(c => String(c.id) === clubId);
        } catch {
          // 동기화 실패 시 기존 로직으로 진행
        }
      }

      if (!isValidClub) {
        console.log(`⚠️ 권한 없는 클럽 접근: ${clubId}`);

        if (clubList.length > 0) {
          // 가입한 클럽이 있으면 첫 번째 클럽으로 리다이렉트
          const firstClub = clubList[0];
          showToast("해당 클럽에 가입되어 있지 않습니다", "error");
          setOpenRunSession({ currentClubId: String(firstClub.id) });
          navigate(`/clubs/${firstClub.id}`, { replace: true });
        } else {
          // 가입한 클럽이 없으면 클럽 탐색 페이지로
          showToast("가입한 클럽이 없습니다", "error");
          navigate("/explore", { replace: true, state: { defaultTab: "member" } });
        }
        return;
      }

      // 현재 클럽 정보 조회
      const response = await axiosInstance.get(`/clubs/${clubId}`);
      setClub(response.data);

      // 현재 클럽에서의 내 역할(role) 조회 후 로컬 캐시
      if (clubId && userIdStr) {
        try {
          const membershipResponse = await axiosInstance.get(
            `/clubs/${clubId}/membership`,
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
          // 역할 조회 실패 시 기본 값 유지 (UNKNOWN이면 REGULAR로 간주)
          if (myRole === "UNKNOWN") setMyRole("REGULAR");
        }
      }
    } catch (error: unknown) {
      logError("클럽 정보 조회", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // 클럽 멤버가 아님 → clubList 갱신 후 유효한 클럽으로 이동
        console.log("⚠️ 403 에러 → clubList 갱신 후 리다이렉트");
        try { await syncClubList(); } catch { /* ignore */ }
        const refreshed = getOpenRunSession();
        const freshList = refreshed.clubList ?? [];
        if (freshList.length > 0) {
          setOpenRunSession({ currentClubId: String(freshList[0].id) });
          showToast("해당 클럽에 가입되어 있지 않습니다", "error");
          navigate(`/clubs/${freshList[0].id}`, { replace: true });
        } else {
          setOpenRunSession({ currentClubId: undefined, currentClubRole: undefined });
          showToast("가입한 클럽이 없습니다", "error");
          navigate("/explore", { replace: true, state: { defaultTab: "member" } });
        }
        return;
      } else {
        showToast(getErrorMessage(error), "error");
      }
    } finally {
      setIsLoadingClub(false);
    }
  }, [clubId, myRole, userIdStr, navigate, isAuthReady, user, clubListLoaded]);

  // 기존 사용자 세션에 clubList가 없으면 동기화
  useEffect(() => {
    const session = getOpenRunSession();
    if (isAuthReady && user && !session.clubList) {
      console.log("⚠️ 세션에 clubList 없음 → 동기화 시작");
      syncClubList().then(() => {
        setClubListLoaded(true);
      });
    }
  }, [isAuthReady, user]);

  // 클럽 정보 로드
  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  // 공지/회칙 통합 unread count 로드 (dot 표시용)
  useEffect(() => {
    // clubId가 없으면 API 호출 안함
    if (!clubId) return;
    clubService
      .getClubContentUnreadCount(Number(clubId))
      .then((res) => setContentUnreadCount(res.totalUnreadCount))
      .catch(() => {});
  }, [clubId]);


  // 헤더 아이콘 핸들러
  const handleViewMembers = () => {
    navigate(`/clubs/${clubId}/members`);
  };

  const handleViewRules = () => {
    if (clubId) {
      // 공지/회칙 모두 읽음 처리
      Promise.all([
        clubService.markClubNoticesRead(Number(clubId)),
        clubService.markClubRulesRead(Number(clubId)),
      ])
        .then(() => setContentUnreadCount(0))
        .catch(() => {});
    }
    navigate(`/clubs/${clubId}/rules`);
  };

  const handleManageClub = () => {
    navigate(`/clubs/${clubId}/manage`);
  };

  // 위젯 렌더링 (운영진만 externalRequests 표시)
  const renderWidget = (widgetId: ClubWidgetId) => {
    // externalRequests 위젯은 운영진만 표시
    if (widgetId === "externalRequests" && !canManage) {
      return null;
    }

    switch (widgetId) {
      case "upcomingSchedules":
        return (
          <UpcomingSchedulesWidget
            clubId={Number(clubId)}
            maxItems={3}
            expanded={getWidgetExpanded("upcomingSchedules", true)}
            onExpandedChange={(v) => setWidgetExpanded("upcomingSchedules", v)}
          />
        );
      case "mySchedules":
        return (
          <MyUpcomingSchedulesWidget
            maxItems={3}
            expanded={getWidgetExpanded("mySchedules", true)}
            onExpandedChange={(v) => setWidgetExpanded("mySchedules", v)}
          />
        );
      case "topPlayers":
        return (
          <TopPlayersWidget
            clubId={Number(clubId)}
            maxItems={3}
            expanded={getWidgetExpanded("topPlayers", true)}
            onExpandedChange={(v) => setWidgetExpanded("topPlayers", v)}
          />
        );
      case "myRecentMatches":
        return (
          <MyRecentMatchesWidget
            clubId={Number(clubId)}
            maxItems={5}
            expanded={getWidgetExpanded("myRecentMatches", true)}
            onExpandedChange={(v) => setWidgetExpanded("myRecentMatches", v)}
          />
        );
      case "externalRequests":
        return (
          <ExternalRequestsWidget
            clubId={Number(clubId)}
            maxItems={5}
            expanded={getWidgetExpanded("externalRequests", true)}
            onExpandedChange={(v) => setWidgetExpanded("externalRequests", v)}
          />
        );
      default:
        return null;
    }
  };

  // 로딩 중
  if (isLoadingClub) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
          로딩 중...
        </div>
      </div>
    );
  }

  // 소속 클럽 없음
  if (!club && !clubId) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
          <p className="text-2xl mb-4">👥</p>
          <p className="text-lg mb-6">
            소속된 클럽이 없습니다.
          </p>
          <button
            className="px-6 py-3 bg-primary text-white border-none rounded-lg text-base cursor-pointer transition-colors hover:bg-primary/90"
            onClick={() => navigate("/explore")}
          >
            클럽 찾아보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 클럽 헤더 액션 버튼 - 한 줄 배치 */}
      <div className="flex items-stretch justify-around p-1.5 bg-white rounded-xl mb-4 border border-border">
        <button
          className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-transparent border-none rounded-lg text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
          onClick={handleViewRules}
          title="공지/회칙"
        >
          <MegaphoneIcon size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">공지/회칙</span>
          {contentUnreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
              aria-label="읽지 않은 공지/회칙 있음"
            />
          )}
        </button>
        <button
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-transparent border-none rounded-lg text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
          onClick={() => navigate(`/clubs/${clubId}/recruiting`, { state: { fromClubMain: true } })}
          title="클럽 초대 페이지"
        >
          <MailOpen size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">클럽초대</span>
        </button>
        <button
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-transparent border-none rounded-lg text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
          onClick={() => {
            if (!canManage) {
              showToast("운영진 이상만 이용 가능합니다", "warning");
              return;
            }
            navigate(`/clubs/${clubId}/manage/external-requests`);
          }}
          title="가입 관리"
        >
          <UserPlusIcon size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">가입관리</span>
        </button>
        <button
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-transparent border-none rounded-lg text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
          onClick={handleViewMembers}
          title="클럽원"
        >
          <UsersIcon size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">클럽원</span>
        </button>
        <button
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 bg-transparent border-none rounded-lg text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
          onClick={handleManageClub}
          title="클럽 관리"
        >
          <SettingsIcon size={20} />
          <span className="text-[11px] leading-none whitespace-nowrap">클럽관리</span>
        </button>
      </div>

      {/* 클럽원 초대 가이드 (오너 혼자일 때) */}
      {club && club.memberCount === 1 && !inviteGuideDismissed && (
        <MemberInviteGuide
          clubId={String(clubId)}
          onDismiss={() => {
            setInviteGuideDismissed(true);
            setClubSettings(String(clubId), { onboarding: { inviteGuideDismissed: true } });
          }}
        />
      )}

      {/* 위젯 영역 */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-end gap-2 px-0.5">
          <button
            className="px-3 py-1 rounded-md border border-border bg-white text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
            onClick={() => setShowWidgetSettingsModal(true)}
            type="button"
          >
            위젯편집
          </button>
          <button
            className={cn(
              "px-3 py-1 rounded-md border border-border bg-white text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary hover:text-primary",
              isWidgetEditMode && "border-primary text-primary bg-primary/5"
            )}
            onClick={() => setIsWidgetEditMode((prev) => !prev)}
            type="button"
          >
            {isWidgetEditMode ? "완료" : "순서편집"}
          </button>
        </div>

        {clubId &&
          widgetOrder
            .filter((widgetId) => selectedWidgets.includes(widgetId))
            .map((widgetId) => {
              const widgetContent = renderWidget(widgetId);
              if (!widgetContent) return null;

              return (
                <div
                  key={widgetId}
                  className={cn("relative", draggingWidgetId === widgetId && "opacity-85")}
                  ref={(el) => {
                    widgetRefMap.current.set(widgetId, el);
                  }}
                >
                  {isWidgetEditMode && (
                    <button
                      className="absolute top-2 right-2 z-10 w-10 h-10 rounded-xl border border-border bg-white/90 text-muted-foreground text-lg flex items-center justify-center cursor-grab touch-none active:cursor-grabbing active:scale-[0.98]"
                      type="button"
                      aria-label="위젯 순서 변경"
                      onPointerDown={(e) => handleDragStart(widgetId, e)}
                    >
                      ⋮⋮
                    </button>
                  )}
                  {widgetContent}
                </div>
              );
            })}
      </div>

      {/* 위젯 설정 모달 */}
      {showWidgetSettingsModal && (
        <WidgetSettingsModal
          selectedWidgets={selectedWidgets}
          onSave={handleSaveWidgetSettings}
          onClose={() => setShowWidgetSettingsModal(false)}
          maxWidgets={3}
          isAdmin={canManage}
        />
      )}
    </div>
  );
};

export default ClubMainPage;
