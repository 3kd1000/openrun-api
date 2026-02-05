import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { getMySchedules, syncClubList } from "../../../services/api/userApi";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  Schedule,
  Participant,
  MyScheduleResponse,
} from "../../../types/schedule";
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
import { getOpenRunSession, hasJoinedClub } from "../../../utils/openrunSession";
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
  const { user: firebaseUser, isAuthReady } = useAuth();
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
  // 클럽 선택 상태는 ClubLayout에서 관리하므로 세션에서만 읽음
  const session = getOpenRunSession();
  const selectedClubId = session.currentClubId ? parseInt(session.currentClubId) : null;

  // clubList 로딩 완료 여부 (리렌더링 트리거용)
  const [clubListLoaded, setClubListLoaded] = useState(() => {
    return getOpenRunSession().clubList !== undefined;
  });

  // 클럽 가입 여부 (세션의 clubList 기반으로 판단)
  // clubListLoaded가 변경되면 리렌더링되어 최신 값 반영
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
  // 첫 번째 미래 일정의 인덱스 (초기 로딩 시 PAST 응답 길이로 계산)
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
  // hasClub === undefined (아직 로드 안 됨)일 때는 판단 보류
  useEffect(() => {
    if (hasClub === false && scheduleMode === "club") {
      setScheduleMode("personal");
      navigate("/schedules/my", { replace: true });
    }
  }, [hasClub, scheduleMode, navigate]);

  // URL search params에서 scheduleId 가져오기 (링크복사로 공유된 URL)
  const scheduleIdFromParams = useMemo(() => {
    const raw = searchParams.get("scheduleId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  // URL search params에서 openDraw 가져오기 (알림에서 대진표 바로 열기)
  const openDrawFromParams = useMemo(() => {
    return searchParams.get("openDraw") === "true";
  }, [searchParams]);


  // 클럽 일정 초기 조회 (커서 기반 - pivotDate 기준 PAST + FUTURE)
  // pivotDate가 없으면 오늘 날짜 사용, 있으면 해당 날짜 기준으로 로드
  const loadClubSchedules = useCallback(async (pivotDateOverride?: string) => {
    // Firebase 인증이 준비될 때까지 대기 (타이밍 이슈 방지)
    if (!isAuthReady) {
      console.log("⏳ Firebase 인증 준비 중... 클럽 일정 로딩 대기");
      return;
    }

    // clubList 로딩 대기 (undefined = 아직 로드 안 됨)
    if (hasClub === undefined) {
      console.log("⏳ clubList 로딩 대기 중...");
      return;
    }

    // 가입한 클럽이 없으면 빈 목록 반환
    if (hasClub === false) {
      console.log("✅ 가입한 클럽 없음 → 빈 일정 목록");
      setSchedules([]);
      setLoading(false);
      return;
    }

    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;

    // clubId가 없으면 빈 목록 반환 (로딩 상태 없이)
    if (!selectedClubId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    // userId 가져오기
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

      // pivotDate: 전달받은 값 또는 오늘 날짜
      const pivotDate = pivotDateOverride || new Date().toISOString();

      const [pastResponse, futureResponse] = await Promise.all([
        scheduleService.getSchedulesByCursor(userId, selectedClubId, pivotDate, "PAST", INITIAL_PAGE_SIZE),
        scheduleService.getSchedulesByCursor(userId, selectedClubId, pivotDate, "FUTURE", INITIAL_PAGE_SIZE),
      ]);

      // 과거 일정(오름차순) + 미래 일정(오름차순) 합치기
      const combinedSchedules = [...pastResponse.content, ...futureResponse.content];
      setSchedules(combinedSchedules);

      // 첫 번째 미래 일정 인덱스 저장 (PAST 응답 길이 = 미래 일정 시작 인덱스)
      setFirstFutureIndex(pastResponse.content.length);

      // 커서 상태 업데이트
      setPastCursor(pastResponse.nextCursor);
      setFutureCursor(futureResponse.nextCursor);
      setHasMorePast(pastResponse.hasMore);
      setHasMoreFuture(futureResponse.hasMore);

      // 내가 참여한 일정 목록 조회 (Firebase 사용자가 있는 경우에만)
      if (firebaseUser) {
        try {
          const participationIds = await scheduleService.getMyParticipations(
            userId
          );
          setMyParticipations(new Set(participationIds));
        } catch (err) {
          console.error("참여 일정 조회 실패:", err);
          // 참여 일정 조회 실패는 전체 일정 목록에는 영향을 주지 않음
        }
      } else {
        // Firebase 사용자가 없으면 참여 일정 조회하지 않음
        console.warn("⚠️ Firebase 사용자 없음 → 참여 일정 조회 건너뜀");
      }
    } catch (err) {
      console.error("일정 조회 실패:", err);
      // 403 에러 (클럽 멤버가 아님) → 개인일정으로 전환
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          console.log("⚠️ 클럽 멤버가 아님 → 개인일정으로 전환");
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

  // 과거 일정 추가 로드 (위로 스크롤 시)
  const loadMorePast = useCallback(async () => {
    if (!hasMorePast || loadingPast || !selectedClubId || !pastCursor) return;

    const session = getOpenRunSession();
    const userId = session.userId;
    if (!userId) return;

    setLoadingPast(true);
    try {
      const response = await scheduleService.getSchedulesByCursor(
        userId, selectedClubId, pastCursor, "PAST", INITIAL_PAGE_SIZE
      );

      // 과거 일정을 앞에 추가 (오름차순 유지)
      setSchedules(prev => [...response.content, ...prev]);
      setPastCursor(response.nextCursor);
      setHasMorePast(response.hasMore);
    } catch (err) {
      console.error("과거 일정 로드 실패:", err);
    } finally {
      setLoadingPast(false);
    }
  }, [hasMorePast, loadingPast, selectedClubId, pastCursor]);

  // 미래 일정 추가 로드 (아래로 스크롤 시)
  const loadMoreFuture = useCallback(async () => {
    if (!hasMoreFuture || loadingFuture || !selectedClubId || !futureCursor) return;

    const session = getOpenRunSession();
    const userId = session.userId;
    if (!userId) return;

    setLoadingFuture(true);
    try {
      const response = await scheduleService.getSchedulesByCursor(
        userId, selectedClubId, futureCursor, "FUTURE", INITIAL_PAGE_SIZE
      );

      // 미래 일정을 뒤에 추가
      setSchedules(prev => [...prev, ...response.content]);
      setFutureCursor(response.nextCursor);
      setHasMoreFuture(response.hasMore);
    } catch (err) {
      console.error("미래 일정 로드 실패:", err);
    } finally {
      setLoadingFuture(false);
    }
  }, [hasMoreFuture, loadingFuture, selectedClubId, futureCursor]);

  // Intersection Observer로 스크롤 끝 감지
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

    if (topSentinelRef.current) {
      topObserver.observe(topSentinelRef.current);
    }
    if (bottomSentinelRef.current) {
      bottomObserver.observe(bottomSentinelRef.current);
    }

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
  // - openDraw=true: 알림에서 대진표 바로 열기
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

      // openDraw=true인 경우 대진표 모달 바로 열기
      if (openDrawFromParams && target.isDrawValid) {
        participantService.getParticipants(target.id).then((participants) => {
          setDrawParticipants(participants);
          setSelectedScheduleForDraw(target);
          setShowDrawViewModal(true);
        }).catch((err) => {
          console.error("참가자 조회 실패:", err);
          // 실패 시 일정 상세 모달로 fallback
          setSelectedScheduleId(target.id);
          setShowDetailModal(true);
        });
      } else {
        setSelectedScheduleId(target.id);
        setShowDetailModal(true);
      }

      // state/params 재사용으로 인한 재오픈 방지
      if (openScheduleIdFromState) {
        navigate(location.pathname, { replace: true, state: null });
      }
      if (scheduleIdFromParams) {
        setSearchParams({}, { replace: true });
      }
    } else {
      // 목록에 없으면 해당 일정 정보를 가져와서 그 기준으로 다시 로드
      const session = getOpenRunSession();
      const userId = session.userId;
      if (userId) {
        scheduleService.getScheduleById(targetScheduleId, userId)
          .then((schedule) => {
            // 해당 일정의 scheduledAt 기준으로 다시 로드
            loadClubSchedules(schedule.scheduledAt);
            setFilterDate(new Date(schedule.scheduledAt));
            setViewMode("list");
            setScheduleMode("club");

            // openDraw=true인 경우 대진표 모달 바로 열기
            if (openDrawFromParams && schedule.isDrawValid) {
              participantService.getParticipants(schedule.id).then((participants) => {
                setDrawParticipants(participants);
                setSelectedScheduleForDraw(schedule);
                setShowDrawViewModal(true);
              }).catch((err) => {
                console.error("참가자 조회 실패:", err);
                setSelectedScheduleId(schedule.id);
                setShowDetailModal(true);
              });
            } else {
              setSelectedScheduleId(schedule.id);
              setShowDetailModal(true);
            }
          })
          .catch((err) => {
            console.error("일정 조회 실패:", err);
            // 일정이 없거나 권한이 없으면 모달만 열기 시도
            setSelectedScheduleId(targetScheduleId);
            setShowDetailModal(true);
          });
      }

      // state/params 재사용으로 인한 재오픈 방지
      if (openScheduleIdFromState) {
        navigate(location.pathname, { replace: true, state: null });
      }
      if (scheduleIdFromParams) {
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openScheduleIdFromState, scheduleIdFromParams, openDrawFromParams, loading, schedules.length]);

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
      <div className="schedule-header">
        {/* 일정 모드 탭 (클럽일정 / 개인일정) */}
        <div className="schedule-mode-tabs">
          <button
            className={`mode-tab ${scheduleMode === "club" ? "active" : ""} ${
              !hasClub ? "disabled" : ""
            }`}
            disabled={!hasClub}
            onClick={() => {
              if (!hasClub) {
                setToastMessage("가입한 클럽이 없습니다. 먼저 클럽에 가입해주세요.");
                return;
              }
              setScheduleMode("club");
              setFilterDate(null);
              navigate("/schedules/club", { replace: true });
            }}
            title={!hasClub ? "가입한 클럽이 없습니다" : ""}
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
