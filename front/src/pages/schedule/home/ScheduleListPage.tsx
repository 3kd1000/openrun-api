import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../../../contexts/AuthContext";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { getMySchedules } from "../../../services/api/userApi";
import type {
  Schedule,
  Participant,
  MyScheduleResponse,
} from "../../../types/schedule";
import { ClubSelector } from "../../../components/ClubSelector";
import ScheduleCreateModal from "../edit/ScheduleCreateModal";
import ScheduleJoinModal from "./ScheduleJoinModal";
import ScheduleCalendarView from "./ScheduleCalendarView";
import ScheduleListView, { type DisplayScheduleItem } from "./ScheduleListView";
import ScheduleDetailModal from "../edit/ScheduleDetailModal";
import DrawViewModal from "../draw/DrawViewModal";
import Toast from "../../../components/common/Toast";
import {
  CalendarIcon,
  ClipboardListIcon,
} from "../../../components/common/Icons";
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../../../utils/openrunSession";
import {
  getOpenRunUiSettings,
  setOpenRunUiSettings,
} from "../../../utils/openrunUiSettings";
import "./ScheduleListPage.css";

type ViewMode = "calendar" | "list";
type ScheduleMode = "club" | "personal";
type CapacityFilter = "all" | "available" | "full" | "participated";

const ScheduleListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: firebaseUser } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<
    MyScheduleResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [selectedScheduleForDraw, setSelectedScheduleForDraw] =
    useState<Schedule | null>(null);
  const [drawParticipants, setDrawParticipants] = useState<Participant[]>([]);
  // 클럽 선택 상태
  const [selectedClubId, setSelectedClubId] = useState<number | null>(() => {
    const session = getOpenRunSession();
    return session.currentClubId ? parseInt(session.currentClubId) : null;
  });
  // 일정 모드 (클럽일정 / 개인일정) - URL 경로에 따라 초기값 설정
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(() => {
    if (location.pathname === "/schedules/my") return "personal";
    return "club";
  });
  // UI 설정에서 뷰 모드 복원
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = getOpenRunUiSettings().scheduleViewMode;
    return (
      saved === "calendar" || saved === "list" ? saved : "calendar"
    ) as ViewMode;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>("all");
  const [myParticipations, setMyParticipations] = useState<Set<number>>(
    new Set()
  );
  const [toastMessage, setToastMessage] = useState("");
  // 캘린더에서 현재 보고 있는 월 상태 관리 (직전 월 유지)
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const todayScheduleRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const openScheduleIdFromState = useMemo(() => {
    const state = location.state as { openScheduleId?: number | string } | null;
    const raw = state?.openScheduleId;
    if (raw === null || raw === undefined) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [location.state]);

  // URL search params에서 scheduleId 가져오기 (링크복사로 공유된 URL)
  const scheduleIdFromParams = useMemo(() => {
    const raw = searchParams.get("scheduleId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  // 클럽 변경 시 세션에 저장
  const handleClubChange = (clubId: number | null) => {
    setSelectedClubId(clubId);
    if (clubId) {
      const session = getOpenRunSession();
      setOpenRunSession({ ...session, currentClubId: clubId.toString() });
    }
  };

  // 클럽 일정 조회
  const loadClubSchedules = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError("");

      if (!selectedClubId) {
        setError("클럽을 선택해주세요.");
        setSchedules([]);
        return;
      }

      // 일정 목록 조회 (선택된 클럽의 일정만)
      const data = await scheduleService.getAllSchedules(selectedClubId);
      // 일정날짜순으로 정렬 (오름차순)
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setSchedules(sortedData);

      // 내가 참여한 일정 목록 조회 (Firebase 사용자가 있는 경우에만)
      if (firebaseUser) {
        const session = getOpenRunSession();
        const userId = session.userId;
        if (userId) {
          try {
            const participationIds = await scheduleService.getMyParticipations(
              userId
            );
            setMyParticipations(new Set(participationIds));
          } catch (err) {
            console.error("참여 일정 조회 실패:", err);
            // 참여 일정 조회 실패는 전체 일정 목록에는 영향을 주지 않음
          }
        }
      } else {
        // Firebase 사용자가 없으면 참여 일정 조회하지 않음
        console.warn("⚠️ Firebase 사용자 없음 → 참여 일정 조회 건너뜀");
      }
    } catch (err) {
      console.error("일정 조회 실패:", err);
      setError("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedClubId, firebaseUser]);

  // 개인 일정 조회
  const loadPersonalSchedules = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError("");

      if (!firebaseUser) {
        setError("로그인이 필요합니다.");
        setPersonalSchedules([]);
        return;
      }

      // 내 일정 조회 (upcoming=false로 과거 일정도 포함)
      const data = await getMySchedules(false);
      // 일정날짜순으로 정렬 (오름차순)
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.schedule.scheduledAt).getTime() -
          new Date(b.schedule.scheduledAt).getTime()
      );
      setPersonalSchedules(sortedData);
    } catch (err) {
      console.error("개인 일정 조회 실패:", err);
      setError("개인 일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [firebaseUser]);

  // 일정 로드 (모드에 따라 분기)
  useEffect(() => {
    if (scheduleMode === "club") {
      loadClubSchedules();
    } else {
      loadPersonalSchedules();
    }
  }, [scheduleMode, loadClubSchedules, loadPersonalSchedules]);

  // 일정 상세 모달 자동 오픈 (state 또는 URL params에서 scheduleId 가져오기)
  // - state: ClubMainPage "다가오는 일정" 클릭 시
  // - params: 링크복사로 공유된 URL 접근 시
  useEffect(() => {
    const targetScheduleId = openScheduleIdFromState || scheduleIdFromParams;
    if (!targetScheduleId) return;
    if (loading) return;
    if (schedules.length === 0) return;

    const target = schedules.find((s) => s.id === targetScheduleId);
    if (target) {
      const d = new Date(target.scheduledAt);
      setFilterDate(d);
      setViewMode("list");
      setScheduleMode("club"); // 클럽일정 모드로 전환
      setSelectedScheduleId(target.id);
      setShowDetailModal(true);
    } else {
      // 목록에 없으면 일단 상세 모달은 열되 필터는 유지하지 않음
      setSelectedScheduleId(targetScheduleId);
      setShowDetailModal(true);
    }

    // state/params 재사용으로 인한 재오픈 방지
    if (openScheduleIdFromState) {
      navigate(location.pathname, { replace: true, state: null });
    }
    if (scheduleIdFromParams) {
      // URL params 정리
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openScheduleIdFromState, scheduleIdFromParams, loading, schedules.length]);

  // 뷰 모드 변경 시 UI 설정에 저장
  useEffect(() => {
    setOpenRunUiSettings({ scheduleViewMode: viewMode });
  }, [viewMode]);

  // 리스트뷰 진입 시 오늘 날짜로 스크롤
  useEffect(() => {
    if (
      viewMode === "list" &&
      (schedules.length > 0 || personalSchedules.length > 0) &&
      !filterDate &&
      location.pathname.startsWith("/schedules/")
    ) {
      // DOM이 렌더링될 때까지 대기 후 오늘 날짜로 스크롤
      let attemptCount = 0;
      const maxAttempts = 10;

      const scrollToToday = () => {
        if (todayScheduleRef.current) {
          todayScheduleRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return true; // 성공
        }
        return false; // 아직 ref가 없음
      };

      // 여러 시점에서 시도 (DOM 렌더링 보장)
      const tryScroll = () => {
        attemptCount++;
        if (!scrollToToday() && attemptCount < maxAttempts) {
          // ref가 아직 없으면 더 기다렸다가 다시 시도
          setTimeout(tryScroll, 100);
        }
      };

      // 즉시 시도
      requestAnimationFrame(() => {
        tryScroll();
      });

      // 추가 시도 (다른 페이지에서 돌아올 때를 대비)
      setTimeout(tryScroll, 100);
      setTimeout(tryScroll, 300);
      setTimeout(tryScroll, 500);
      setTimeout(tryScroll, 800);
    }
  }, [
    viewMode,
    schedules.length,
    personalSchedules.length,
    filterDate,
    location.pathname,
  ]);

  if (loading) {
    return (
      <div className="schedule-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-page">
        <div className="error-state">
          <p>⚠️</p>
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => {
              if (scheduleMode === "club") {
                loadClubSchedules();
              } else {
                loadPersonalSchedules();
              }
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const handleDateClick = (date: Date) => {
    // 단일 클릭: 리스트뷰로 전환 + 해당 날짜로 필터링
    setFilterDate(date);
    setViewMode("list");
  };

  const handleDateDoubleClick = (date: Date) => {
    // 더블클릭: 일정 생성 모달
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedScheduleId(schedule.id);
    setShowDetailModal(true);
  };

  const handleDrawViewClick = async (
    e: React.MouseEvent,
    schedule: Schedule
  ) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    try {
      const participants = await participantService.getParticipants(
        schedule.id
      );
      setDrawParticipants(participants);
      setSelectedScheduleForDraw(schedule);
      setShowDrawViewModal(true);
    } catch (err) {
      console.error("참가자 조회 실패:", err);
    }
  };

  const handleDrawViewModalClose = () => {
    setShowDrawViewModal(false);
    setSelectedScheduleForDraw(null);
    setDrawParticipants([]);
  };

  const handleDrawViewModalSuccess = () => {
    if (scheduleMode === "club") {
      loadClubSchedules();
    } else {
      loadPersonalSchedules();
    }
  };

  const handleClearFilter = () => {
    setFilterDate(null);
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setSelectedDate(null);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedScheduleId(null);
  };

  // 정원 상태 계산 헬퍼 함수 (필터용)
  // participated+full 동시 상태 판별을 위해 개별 상태도 반환
  const getCapacityInfo = (schedule: Schedule) => {
    const { currentParticipants, maxCapacity } = schedule;
    const isParticipated = myParticipations.has(schedule.id);
    const isFull = currentParticipants >= maxCapacity;
    return { isParticipated, isFull };
  };

  // 클럽일정 필터링
  const filteredClubSchedules = schedules.filter((schedule) => {
    // 날짜 필터
    if (filterDate) {
      const scheduleDate = format(new Date(schedule.scheduledAt), "yyyy-MM-dd");
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      if (scheduleDate !== filterDateStr) return false;
    }

    // 정원 상태 필터: participated+full 동시 상태는 양쪽 필터에 모두 노출
    if (capacityFilter !== "all") {
      const { isParticipated, isFull } = getCapacityInfo(schedule);

      if (capacityFilter === "participated") {
        // 신청완료 필터: 내가 신청한 일정 (마감 여부 무관)
        if (!isParticipated) return false;
      } else if (capacityFilter === "full") {
        // 마감/초과 필터: 정원 마감된 일정 (내가 신청했어도 마감이면 노출)
        if (!isFull) return false;
      } else if (capacityFilter === "available") {
        // 신청가능 필터: 정원 여유 있고 내가 신청 안 한 일정
        if (isParticipated || isFull) return false;
      }
    }

    return true;
  });

  // 개인일정 필터링
  const filteredPersonalSchedules = personalSchedules.filter((item) => {
    const schedule = item.schedule;

    // 날짜 필터
    if (filterDate) {
      const scheduleDate = format(new Date(schedule.scheduledAt), "yyyy-MM-dd");
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      if (scheduleDate !== filterDateStr) return false;
    }

    // 거절된 일정은 자동으로 제외
    const externalRequest = item.myExternalRequest;
    if (externalRequest?.status === "REJECTED") {
      return false;
    }

    return true;
  });

  // 렌더링할 일정 목록 (모드에 따라 분기)
  const displaySchedules: DisplayScheduleItem[] =
    scheduleMode === "club"
      ? filteredClubSchedules.map((s) => ({
          schedule: s,
          myParticipation: null,
          myExternalRequest: null,
        }))
      : filteredPersonalSchedules;

  // 캘린더뷰용 Schedule[] 변환
  const calendarSchedules = displaySchedules.map((item) => item.schedule);

  return (
    <div className="schedule-page">
      {/* ClubSelector */}
      <div className="page-club-selector-container">
        <ClubSelector
          selectedClubId={selectedClubId}
          onClubChange={handleClubChange}
        />
      </div>

      <div className="schedule-header">
        {/* 일정 모드 탭 (클럽일정 / 개인일정) */}
        <div className="schedule-mode-tabs">
          <button
            className={`mode-tab ${scheduleMode === "club" ? "active" : ""}`}
            onClick={() => {
              setScheduleMode("club");
              setFilterDate(null);
              navigate("/schedules/club", { replace: true });
            }}
          >
            클럽일정
          </button>
          <button
            className={`mode-tab ${
              scheduleMode === "personal" ? "active" : ""
            }`}
            onClick={() => {
              setScheduleMode("personal");
              setFilterDate(null);
              navigate("/schedules/my", { replace: true });
            }}
          >
            개인일정
          </button>
        </div>

        <div className="header-actions">
          <div className="view-toggle-group">
            <button
              className={`header-action-btn view-toggle-btn ${
                viewMode === "calendar" ? "active" : ""
              }`}
              onClick={() => {
                setViewMode("calendar");
                setFilterDate(null);
                // 캘린더뷰로 전환 시 스크롤 위치 초기화
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <CalendarIcon size={18} />
              <span>캘린더</span>
            </button>
            <button
              className={`header-action-btn view-toggle-btn ${
                viewMode === "list" ? "active" : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              <ClipboardListIcon size={18} />
              <span>리스트</span>
            </button>
          </div>
          {scheduleMode === "club" && (
            <>
              <button
                className="header-action-btn btn-join"
                onClick={() => setShowJoinModal(true)}
              >
                ✓ 빠른 신청
              </button>
              <button
                className="header-action-btn btn-create"
                onClick={() => {
                  setShowCreateModal(true);
                }}
              >
                + 일정 등록
              </button>
            </>
          )}
        </div>

        {/* 필터 영역 - header 안에 배치 */}
        <div className="header-filters">
          {filterDate && viewMode === "list" && (
            <div className="filter-info">
              <span>{format(filterDate, "yyyy년 M월 d일")} 일정</span>
              <button className="btn-clear-filter" onClick={handleClearFilter}>
                전체 보기
              </button>
            </div>
          )}

          {/* 클럽일정 모드: 기존 필터 */}
          {scheduleMode === "club" && (
            <div className="capacity-filters">
              <button
                className={`capacity-filter-btn ${
                  capacityFilter === "all" ? "active" : ""
                }`}
                onClick={() => setCapacityFilter("all")}
              >
                전체
              </button>
              <button
                className={`capacity-filter-btn capacity-filter-available ${
                  capacityFilter === "available" ? "active" : ""
                }`}
                onClick={() => setCapacityFilter("available")}
              >
                신청 가능
              </button>
              <button
                className={`capacity-filter-btn capacity-filter-full ${
                  capacityFilter === "full" ? "active" : ""
                }`}
                onClick={() => setCapacityFilter("full")}
              >
                마감/초과
              </button>
              <button
                className={`capacity-filter-btn capacity-filter-participated ${
                  capacityFilter === "participated" ? "active" : ""
                }`}
                onClick={() => setCapacityFilter("participated")}
              >
                신청완료
              </button>
            </div>
          )}

          {/* 개인일정 모드: 거절된 일정은 자동으로 제외 (필터 UI 없음) */}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <ScheduleCalendarView
          schedules={calendarSchedules}
          onDateClick={handleDateClick}
          onDateDoubleClick={handleDateDoubleClick}
          onScheduleClick={handleScheduleClick}
          myParticipations={myParticipations}
          calendarDate={calendarDate}
          onCalendarDateChange={setCalendarDate}
        />
      ) : displaySchedules.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">
            <CalendarIcon size={64} color="var(--color-text-secondary)" />
          </p>
          <p>
            {scheduleMode === "club"
              ? "등록된 일정이 없습니다."
              : "참가한 일정이 없습니다."}
          </p>
          <p className="empty-hint">
            {scheduleMode === "club"
              ? "새로운 일정을 생성해보세요!"
              : "클럽 일정에 참가해보세요!"}
          </p>
        </div>
      ) : (
        <ScheduleListView
          displaySchedules={displaySchedules}
          myParticipations={myParticipations}
          scheduleMode={scheduleMode}
          todayScheduleRef={todayScheduleRef}
          onScheduleClick={handleScheduleClick}
          onDrawViewClick={handleDrawViewClick}
        />
      )}

      {showCreateModal && (
        <ScheduleCreateModal
          initialDate={
            filterDate
              ? format(filterDate, "yyyy-MM-dd")
              : selectedDate
              ? format(selectedDate, "yyyy-MM-dd")
              : undefined
          }
          onClose={handleCreateModalClose}
          onSuccess={() => {
            loadClubSchedules();
            setToastMessage("일정이 생성되었습니다.");
          }}
        />
      )}

      {showJoinModal && (
        <ScheduleJoinModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            loadClubSchedules();
          }}
        />
      )}

      {showDetailModal && selectedScheduleId && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          onClose={handleDetailModalClose}
          onSuccess={() => {
            if (scheduleMode === "club") {
              loadClubSchedules();
            } else {
              loadPersonalSchedules();
            }
          }}
          onJoinSuccess={() => {
            setToastMessage("참가신청이 완료되었습니다.");
          }}
        />
      )}

      {showDrawViewModal && selectedScheduleForDraw && (
        <DrawViewModal
          schedule={selectedScheduleForDraw}
          participants={drawParticipants}
          onClose={handleDrawViewModalClose}
          onSuccess={handleDrawViewModalSuccess}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
};

export default ScheduleListPage;
