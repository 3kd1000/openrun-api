import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, List, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/openrun/empty-state";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { getMySchedules, syncClubList } from "../../../services/api/userApi";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  Schedule,
  Participant,
  MyScheduleResponse,
} from "../../../types/schedule";
import ScheduleJoinModal from "./ScheduleJoinModal";
import ScheduleCalendarView from "./ScheduleCalendarView";
import ScheduleListView, { type DisplayScheduleItem } from "./ScheduleListView";
import DrawViewModal from "../draw/DrawViewModal";
import Toast from "../../../components/common/Toast";
import { getOpenRunSession, hasJoinedClub } from "../../../utils/openrunSession";
import {
  getOpenRunUiSettings,
  setOpenRunUiSettings,
} from "../../../utils/openrunUiSettings";
type ViewMode = "calendar" | "list";
type ScheduleMode = "club" | "personal";
type CapacityFilter = "all" | "available" | "full" | "participated";

// 정원 필터 스타일 매핑
const capacityFilterStyles: Record<CapacityFilter, { base: string; active: string; label: string }> = {
  all: {
    base: "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200",
    active: "bg-slate-700 text-white border-slate-700",
    label: "전체",
  },
  available: {
    base: "bg-white border-gray-300 text-gray-600 hover:bg-gray-50",
    active: "bg-white text-gray-900 border-gray-800 shadow-sm",
    label: "신청 가능",
  },
  full: {
    base: "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100",
    active: "bg-rose-500 text-white border-rose-600",
    label: "마감/초과",
  },
  participated: {
    base: "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100",
    active: "bg-emerald-500 text-white border-emerald-600",
    label: "신청완료",
  },
};

const ScheduleListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: firebaseUser, isAuthReady } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<
    MyScheduleResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [selectedScheduleForDraw, setSelectedScheduleForDraw] =
    useState<Schedule | null>(null);
  const [drawParticipants, setDrawParticipants] = useState<Participant[]>([]);
  // 클럽 선택 상태는 ClubLayout에서 관리하므로 세션에서만 읽음
  const session = getOpenRunSession();
  const selectedClubId = session.currentClubId ? parseInt(session.currentClubId) : null;

  // clubList 로딩 완료 여부 (리렌더링 트리거용)
  const [clubListLoaded, setClubListLoaded] = useState(() => {
    return getOpenRunSession().clubList !== undefined;
  });

  // 클럽 가입 여부 (세션의 clubList 기반으로 판단)
  const hasClub = clubListLoaded ? hasJoinedClub() : undefined;

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
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>("all");
  const [myParticipations, setMyParticipations] = useState<Set<number>>(
    new Set()
  );
  const [toastMessage, setToastMessage] = useState("");
  // 캘린더에서 현재 보고 있는 월 상태 관리 (네비게이션 후 복귀 시 유지)
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const saved = sessionStorage.getItem("openrun_calendar_date");
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const todayScheduleRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Infinite Scroll 커서 기반 상태
  const [pastCursor, setPastCursor] = useState<string | null>(null);
  const [futureCursor, setFutureCursor] = useState<string | null>(null);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const INITIAL_PAGE_SIZE = 30;
  const [firstFutureIndex, setFirstFutureIndex] = useState<number>(0);

  const openScheduleIdFromState = useMemo(() => {
    const state = location.state as { openScheduleId?: number | string } | null;
    const raw = state?.openScheduleId;
    if (raw === null || raw === undefined) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [location.state]);

  // 기존 사용자 세션에 clubList가 없으면 동기화
  useEffect(() => {
    const session = getOpenRunSession();
    if (isAuthReady && firebaseUser && !session.clubList) {
      console.log("⚠️ 세션에 clubList 없음 → 동기화 시작");
      syncClubList().then(() => {
        setClubListLoaded(true);
      });
    }
  }, [isAuthReady, firebaseUser]);

  // 가입한 클럽이 없고 현재 클럽일정 모드이면 개인일정으로 전환
  useEffect(() => {
    if (hasClub === false && scheduleMode === "club") {
      setScheduleMode("personal");
      navigate("/schedules/my", { replace: true });
    }
  }, [hasClub, scheduleMode, navigate]);

  // URL search params에서 scheduleId 가져오기
  const scheduleIdFromParams = useMemo(() => {
    const raw = searchParams.get("scheduleId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const openDrawFromParams = useMemo(() => {
    return searchParams.get("openDraw") === "true";
  }, [searchParams]);

  // 클럽 일정 초기 조회 (커서 기반)
  const loadClubSchedules = useCallback(async (pivotDateOverride?: string) => {
    if (!isAuthReady) return;
    if (hasClub === undefined) return;
    if (hasClub === false) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    if (isLoadingRef.current) return;
    if (!selectedClubId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const session = getOpenRunSession();
    const userId = session.userId;
    if (!userId) {
      setError("로그인이 필요합니다.");
      setSchedules([]);
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError("");

      const pivotDate = pivotDateOverride || new Date().toISOString();
      const [pastResponse, futureResponse] = await Promise.all([
        scheduleService.getSchedulesByCursor(selectedClubId, pivotDate, "PAST", INITIAL_PAGE_SIZE),
        scheduleService.getSchedulesByCursor(selectedClubId, pivotDate, "FUTURE", INITIAL_PAGE_SIZE),
      ]);

      const combinedSchedules = [...pastResponse.content, ...futureResponse.content];
      setSchedules(combinedSchedules);
      setFirstFutureIndex(pastResponse.content.length);
      setPastCursor(pastResponse.nextCursor);
      setFutureCursor(futureResponse.nextCursor);
      setHasMorePast(pastResponse.hasMore);
      setHasMoreFuture(futureResponse.hasMore);

      if (firebaseUser) {
        try {
          const participationIds = await scheduleService.getMyParticipations();
          setMyParticipations(new Set(participationIds));
        } catch (err) {
          console.error("참여 일정 조회 실패:", err);
        }
      }
    } catch (err) {
      console.error("일정 조회 실패:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          setScheduleMode("personal");
          navigate("/schedules/my", { replace: true });
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }
      setError("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedClubId, firebaseUser, isAuthReady, hasClub, navigate]);

  // 과거 일정 추가 로드
  const loadMorePast = useCallback(async () => {
    if (!hasMorePast || loadingPast || !selectedClubId || !pastCursor) return;
    const session = getOpenRunSession();
    const userId = session.userId;
    if (!userId) return;

    setLoadingPast(true);
    try {
      const response = await scheduleService.getSchedulesByCursor(
        selectedClubId, pastCursor, "PAST", INITIAL_PAGE_SIZE
      );
      setSchedules(prev => [...response.content, ...prev]);
      setPastCursor(response.nextCursor);
      setHasMorePast(response.hasMore);
    } catch (err) {
      console.error("과거 일정 로드 실패:", err);
    } finally {
      setLoadingPast(false);
    }
  }, [hasMorePast, loadingPast, selectedClubId, pastCursor]);

  // 미래 일정 추가 로드
  const loadMoreFuture = useCallback(async () => {
    if (!hasMoreFuture || loadingFuture || !selectedClubId || !futureCursor) return;
    const session = getOpenRunSession();
    const userId = session.userId;
    if (!userId) return;

    setLoadingFuture(true);
    try {
      const response = await scheduleService.getSchedulesByCursor(
        selectedClubId, futureCursor, "FUTURE", INITIAL_PAGE_SIZE
      );
      setSchedules(prev => [...prev, ...response.content]);
      setFutureCursor(response.nextCursor);
      setHasMoreFuture(response.hasMore);
    } catch (err) {
      console.error("미래 일정 로드 실패:", err);
    } finally {
      setLoadingFuture(false);
    }
  }, [hasMoreFuture, loadingFuture, selectedClubId, futureCursor]);

  // Intersection Observer
  useEffect(() => {
    if (viewMode !== "list" || scheduleMode !== "club") return;

    const topObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePast && !loadingPast) {
          loadMorePast();
        }
      },
      { threshold: 0.1 }
    );

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFuture && !loadingFuture) {
          loadMoreFuture();
        }
      },
      { threshold: 0.1 }
    );

    if (topSentinelRef.current) topObserver.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) bottomObserver.observe(bottomSentinelRef.current);

    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, [viewMode, scheduleMode, hasMorePast, hasMoreFuture, loadingPast, loadingFuture, loadMorePast, loadMoreFuture]);

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
      const data = await getMySchedules(false);
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

  // URL/state에서 scheduleId → 상세 페이지로 navigate
  useEffect(() => {
    const targetScheduleId = openScheduleIdFromState || scheduleIdFromParams;
    if (!targetScheduleId) return;
    if (loading) return;

    // 대진표 직접 열기 (openDraw=true) → 기존 DrawViewModal로 처리
    if (openDrawFromParams) {
      const target = schedules.find((s) => s.id === targetScheduleId);
      if (target?.isDrawValid) {
        participantService.getParticipants(target.id).then((participants) => {
          setDrawParticipants(participants);
          setSelectedScheduleForDraw(target);
          setShowDrawViewModal(true);
        }).catch(() => {
          navigate(`/schedules/${targetScheduleId}`, { replace: true });
        });
      } else {
        navigate(`/schedules/${targetScheduleId}`, { replace: true });
      }
    } else {
      // 일반 상세 보기 → 상세 페이지로 navigate (replace로 URL 교체되므로 params 자동 정리)
      navigate(`/schedules/${targetScheduleId}`, {
        replace: true,
        state: { returnUrl: "/schedules/club" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openScheduleIdFromState, scheduleIdFromParams, openDrawFromParams, loading, schedules.length]);

  // 뷰 모드 변경 시 UI 설정에 저장
  useEffect(() => {
    setOpenRunUiSettings({ scheduleViewMode: viewMode });
  }, [viewMode]);

  // 캘린더 월 변경 시 sessionStorage에 저장 (뒤로가기 복귀 시 유지)
  useEffect(() => {
    sessionStorage.setItem("openrun_calendar_date", calendarDate.toISOString());
  }, [calendarDate]);

  // 일정상세에서 복귀 시 저장된 스크롤 위치 복원 (필터/뷰모드 무관)
  const scrollRestoredRef = useRef(false);
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (
      viewMode === "list" &&
      (schedules.length > 0 || personalSchedules.length > 0) &&
      location.pathname.startsWith("/schedules/")
    ) {
      const savedScrollY = sessionStorage.getItem("schedule_list_scroll_y");
      if (savedScrollY) {
        scrollRestoredRef.current = true;
        sessionStorage.removeItem("schedule_list_scroll_y");
        const targetY = parseInt(savedScrollY);
        let restoreAttempt = 0;
        const maxRestoreAttempts = 10;
        const restoreTimers: ReturnType<typeof setTimeout>[] = [];

        const tryRestore = () => {
          restoreAttempt++;
          if (document.documentElement.scrollHeight >= targetY + window.innerHeight * 0.5) {
            window.scrollTo(0, targetY);
            return;
          }
          if (restoreAttempt < maxRestoreAttempts) {
            restoreTimers.push(setTimeout(tryRestore, 100));
          } else {
            window.scrollTo(0, targetY);
          }
        };

        requestAnimationFrame(() => tryRestore());
        restoreTimers.push(setTimeout(tryRestore, 100));
        restoreTimers.push(setTimeout(tryRestore, 300));
        restoreTimers.push(setTimeout(tryRestore, 500));

        return () => restoreTimers.forEach(clearTimeout);
      }
    }
  }, [viewMode, schedules.length, personalSchedules.length, location.pathname]);

  // 리스트뷰 진입 시 오늘 날짜로 스크롤 (복원이 없을 때만)
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (
      viewMode === "list" &&
      (schedules.length > 0 || personalSchedules.length > 0) &&
      !filterDate &&
      location.pathname.startsWith("/schedules/")
    ) {
      let attemptCount = 0;
      const maxAttempts = 10;
      const timers: ReturnType<typeof setTimeout>[] = [];

      const scrollToToday = () => {
        if (todayScheduleRef.current) {
          todayScheduleRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return true;
        }
        return false;
      };

      const tryScroll = () => {
        attemptCount++;
        if (!scrollToToday() && attemptCount < maxAttempts) {
          timers.push(setTimeout(tryScroll, 100));
        }
      };

      requestAnimationFrame(() => tryScroll());
      timers.push(setTimeout(tryScroll, 100));
      timers.push(setTimeout(tryScroll, 300));
      timers.push(setTimeout(tryScroll, 500));
      timers.push(setTimeout(tryScroll, 800));

      return () => timers.forEach(clearTimeout);
    }
  }, [viewMode, schedules.length, personalSchedules.length, filterDate, location.pathname, firstFutureIndex]);

  // --- 핸들러 ---

  const handleDateClick = (date: Date) => {
    setFilterDate(date);
    setViewMode("list");
  };

  const handleDateDoubleClick = (date: Date) => {
    // 더블클릭/롱프레스: 일정 생성 풀페이지로 이동
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/schedules/new?clubId=${selectedClubId}&date=${dateStr}`);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    sessionStorage.setItem("schedule_list_scroll_y", String(window.scrollY));
    navigate(`/schedules/${schedule.id}`, {
      state: { returnUrl: location.pathname + location.search },
    });
  };

  const handleDrawViewClick = async (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation();
    try {
      const participants = await participantService.getParticipants(schedule.id);
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

  const handleModeChange = (mode: string) => {
    if (mode === "club" && !hasClub) {
      setToastMessage("가입한 클럽이 없습니다. 먼저 클럽에 가입해주세요.");
      return;
    }
    const newMode = mode as ScheduleMode;
    setScheduleMode(newMode);
    setFilterDate(null);
    navigate(newMode === "club" ? "/schedules/club" : "/schedules/my", { replace: true });
  };

  const handleViewModeChange = (mode: string) => {
    const newMode = mode as ViewMode;
    setViewMode(newMode);
    if (newMode === "calendar") {
      setFilterDate(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 정원 상태 계산 헬퍼 함수
  const getCapacityInfo = (schedule: Schedule) => {
    const { currentParticipants, maxCapacity } = schedule;
    const isParticipated = myParticipations.has(schedule.id);
    const isFull = currentParticipants >= maxCapacity;
    return { isParticipated, isFull };
  };

  // 클럽일정 필터링
  const filteredClubSchedules = schedules.filter((schedule) => {
    if (filterDate) {
      const scheduleDate = format(new Date(schedule.scheduledAt), "yyyy-MM-dd");
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      if (scheduleDate !== filterDateStr) return false;
    }
    if (capacityFilter !== "all") {
      const { isParticipated, isFull } = getCapacityInfo(schedule);
      if (capacityFilter === "participated" && !isParticipated) return false;
      if (capacityFilter === "full" && !isFull) return false;
      if (capacityFilter === "available" && (isParticipated || isFull)) return false;
    }
    return true;
  });

  // 개인일정 필터링
  const filteredPersonalSchedules = personalSchedules.filter((item) => {
    const schedule = item.schedule;
    if (filterDate) {
      const scheduleDate = format(new Date(schedule.scheduledAt), "yyyy-MM-dd");
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      if (scheduleDate !== filterDateStr) return false;
    }
    if (item.myExternalRequest?.status === "REJECTED") return false;
    return true;
  });

  // 렌더링할 일정 목록
  const displaySchedules: DisplayScheduleItem[] =
    scheduleMode === "club"
      ? filteredClubSchedules.map((s) => ({
          schedule: s,
          myParticipation: null,
          myExternalRequest: null,
        }))
      : filteredPersonalSchedules;

  const calendarSchedules = displaySchedules.map((item) => item.schedule);

  // --- 렌더링 ---

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 text-5xl">⚠️</span>
          <p className="mb-2 text-base text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              if (scheduleMode === "club") loadClubSchedules();
              else loadPersonalSchedules();
            }}
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Sticky Header */}
      <div className="sticky top-[48px] max-[768px]:top-[42px] max-[425px]:top-[40px] max-[359px]:top-[36px] z-[99] bg-background px-4 pb-3 pt-2 shadow-sm">
        {/* 모드 탭: 클럽일정 / 개인일정 */}
        <Tabs value={scheduleMode} onValueChange={handleModeChange} className="mb-3">
          <TabsList className="w-full">
            <TabsTrigger value="club" className="flex-1" disabled={!hasClub}>
              클럽일정
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex-1">
              개인일정
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 뷰 토글 + 액션 버튼 */}
        <div className="flex gap-2 flex-wrap">
          <Tabs value={viewMode} onValueChange={handleViewModeChange} className="flex-[2]">
            <TabsList className="w-full">
              <TabsTrigger value="calendar" className="flex-1 gap-1">
                <Calendar size={16} />
                <span className="text-xs sm:text-sm">캘린더</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1 gap-1">
                <List size={16} />
                <span className="text-xs sm:text-sm">리스트</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {scheduleMode === "club" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setShowJoinModal(true)}
              >
                빠른 신청
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-slate-700 hover:bg-slate-800 text-white"
                onClick={() => {
                  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
                  const params = new URLSearchParams();
                  if (selectedClubId) params.set("clubId", String(selectedClubId));
                  if (dateStr) params.set("date", dateStr);
                  navigate(`/schedules/new?${params.toString()}`);
                }}
              >
                일정 등록
              </Button>
            </>
          )}
        </div>

        {/* 필터 영역 */}
        <div className="mt-3 flex flex-col gap-2">
          {/* 날짜 필터 배너 */}
          {filterDate && viewMode === "list" && (
            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-sm font-medium text-primary">
                {format(filterDate, "yyyy년 M월 d일")} 일정
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => setFilterDate(null)}
              >
                전체 보기
              </Button>
            </div>
          )}

          {/* 정원 필터 (클럽일정 모드만) */}
          {scheduleMode === "club" && (
            <div className="flex gap-1.5">
              {(["all", "available", "full", "participated"] as CapacityFilter[]).map((filter) => {
                const isActive = capacityFilter === filter;
                const styles = capacityFilterStyles[filter];
                return (
                  <Button
                    key={filter}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 min-w-0 border text-xs",
                      isActive ? styles.active : styles.base
                    )}
                    onClick={() => setCapacityFilter(filter)}
                  >
                    {styles.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="px-4 pt-3 pb-4">
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
          <EmptyState
            icon={CalendarDays}
            title={scheduleMode === "club" ? "등록된 일정이 없습니다." : "참가한 일정이 없습니다."}
            description={scheduleMode === "club" ? "새로운 일정을 생성해보세요!" : "클럽 일정에 참가해보세요!"}
          />
        ) : (
          <ScheduleListView
            displaySchedules={displaySchedules}
            myParticipations={myParticipations}
            scheduleMode={scheduleMode}
            todayScheduleRef={todayScheduleRef}
            firstFutureIndex={firstFutureIndex}
            onScheduleClick={handleScheduleClick}
            onDrawViewClick={handleDrawViewClick}
            topSentinelRef={topSentinelRef}
            bottomSentinelRef={bottomSentinelRef}
            loadingPast={loadingPast}
            loadingFuture={loadingFuture}
            hasMorePast={hasMorePast}
            hasMoreFuture={hasMoreFuture}
          />
        )}
      </div>

      {/* 모달: 빠른 신청 (유지) */}
      {showJoinModal && (
        <ScheduleJoinModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => loadClubSchedules()}
        />
      )}

      {/* 모달: 대진표 보기 (유지) */}
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
