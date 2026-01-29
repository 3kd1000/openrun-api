import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../../../services/api/axiosInstance";
import { getMyClubs, type MyClub } from "../../../services/api/userApi";
import type { Club } from "../../../types/club";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import {
  CompassIcon,
  MegaphoneIcon,
  UsersIcon,
  SettingsIcon,
  BroadcastIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../../components/common/Icons";
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
import { ClubSelector } from "../../../components/ClubSelector";
import "./ClubMainPage.css";
import { clubService } from "../../../services/clubService";

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

  // 클럽 정보
  const [club, setClub] = useState<Club | null>(null);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [isLoadingClub, setIsLoadingClub] = useState(true);
  const [contentUnreadCount, setContentUnreadCount] = useState<number>(0);

  const session = getOpenRunSession();
  const clubId = clubIdParam ?? session.currentClubId;
  const userIdStr = session.userId ? String(session.userId) : null;

  const [myRole, setMyRole] = useState<ClubRoleOrUnknown>(() => {
    const session = getOpenRunSession();
    return normalizeClubRole(session.currentClubRole);
  });
  const canManage = canManageClub(myRole);

  // 메뉴 접힘/펼침 상태 (localStorage에 저장)
  const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("openrun_menu_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleMenuCollapsed = () => {
    setIsMenuCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("openrun_menu_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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
        showToast("클럽 정보를 조회할 권한이 없습니다", "error");
      } else {
        showToast(getErrorMessage(error), "error");
      }
    } finally {
      setIsLoadingClub(false);
    }
  }, [clubId, myRole, userIdStr]);

  // 클럽 정보 로드
  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  // 공지/회칙 통합 unread count 로드 (dot 표시용)
  useEffect(() => {
    if (!clubId) return;
    clubService
      .getClubContentUnreadCount(Number(clubId))
      .then((res) => setContentUnreadCount(res.totalUnreadCount))
      .catch(() => {});
  }, [clubId]);

  const handleClubChange = (newClubId: string) => {
    setOpenRunSession({ currentClubId: newClubId, currentClubRole: "UNKNOWN" });
    navigate(`/clubs/${newClubId}`, { replace: true });
  };

  // 헤더 아이콘 핸들러
  const handleExploreClubs = () => {
    navigate("/clubs/explore", { state: { fromClubId: clubId } });
  };

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
      <div className={`club-main-page__header ${isMenuCollapsed ? "collapsed" : ""}`}>
        <div className="club-main-page__header-actions">
          <button
            className="club-main-page__header-btn"
            onClick={handleViewRules}
            title="공지/회칙"
          >
            <MegaphoneIcon size={20} />
            <span className="club-main-page__header-btn-text">공지/회칙</span>
            {contentUnreadCount > 0 && (
              <span
                className="club-main-page__notice-dot"
                aria-label="읽지 않은 공지/회칙 있음"
              />
            )}
          </button>
          <button
            className="club-main-page__header-btn"
            onClick={() => navigate(`/clubs/${clubId}/recruiting`, { state: { fromClubMain: true } })}
            title="클럽 홍보 페이지"
          >
            <BroadcastIcon size={20} />
            <span className="club-main-page__header-btn-text">클럽홍보</span>
          </button>
          <button
            className="club-main-page__header-btn"
            onClick={handleViewMembers}
            title="클럽원"
          >
            <UsersIcon size={20} />
            <span className="club-main-page__header-btn-text">클럽원</span>
          </button>
          <button
            className="club-main-page__header-btn"
            onClick={handleExploreClubs}
            title="클럽 탐색"
          >
            <CompassIcon size={20} />
            <span className="club-main-page__header-btn-text">클럽탐색</span>
          </button>
          {canManage && (
            <button
              className="club-main-page__header-btn"
              onClick={handleManageClub}
              title="클럽 관리"
            >
              <SettingsIcon size={20} />
              <span className="club-main-page__header-btn-text">클럽관리</span>
            </button>
          )}
        </div>
        <button
          className="club-main-page__header-toggle"
          onClick={toggleMenuCollapsed}
          title={isMenuCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
          type="button"
        >
          {isMenuCollapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
        </button>
      </div>

      {/* 위젯 영역 */}
      <div className="club-main-page__widgets">
        <div className="club-main-page__widgets-toolbar">
          <button
            className="club-main-page__widgets-settings-btn"
            onClick={() => setShowWidgetSettingsModal(true)}
            type="button"
          >
            위젯편집
          </button>
          <button
            className={`club-main-page__widgets-edit-btn ${
              isWidgetEditMode ? "active" : ""
            }`}
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
              // 운영진이 아니면 externalRequests 위젯은 렌더링하지 않음
              if (!widgetContent) return null;

              return (
                <div
                  key={widgetId}
                  className={`club-main-page__widget-item ${
                    draggingWidgetId === widgetId ? "dragging" : ""
                  }`}
                  ref={(el) => {
                    widgetRefMap.current.set(widgetId, el);
                  }}
                >
                  {isWidgetEditMode && (
                    <button
                      className="club-main-page__widget-drag-handle"
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
