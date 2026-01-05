import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { scheduleService } from "../../services/scheduleService";
import { participantService } from "../../services/participantService";
import type { Schedule, Participant } from "../../types/schedule";
import ScheduleCreateModal from "./components/ScheduleCreateModal";
import ScheduleJoinModal from "./components/ScheduleJoinModal";
import ScheduleCalendarView from "./components/ScheduleCalendarView";
import ScheduleDetailModal from "./components/ScheduleDetailModal";
import DrawViewModal from "./components/DrawViewModal";
import Toast from "../../components/common/Toast";
import { isNotEmpty } from "../../utils/isEmpty";
import "./ScheduleListPage.css";

type ViewMode = "calendar" | "list";
type CapacityFilter = "all" | "available" | "full" | "participated";

const ScheduleListPage: React.FC = () => {
  const location = useLocation();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [selectedScheduleForDraw, setSelectedScheduleForDraw] =
    useState<Schedule | null>(null);
  const [drawParticipants, setDrawParticipants] = useState<Participant[]>([]);
  // localStorage에서 뷰 모드 복원
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("schedule_viewMode");
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

  const loadSchedules = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError("");

      // 일정 목록 조회
      const data = await scheduleService.getAllSchedules();
      // 일정날짜순으로 정렬 (오름차순)
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setSchedules(sortedData);

      // 내가 참여한 일정 목록 조회 (로그인한 경우에만)
      const userId = localStorage.getItem("user_id");
      if (userId) {
        const participationIds = await scheduleService.getMyParticipations(
          parseInt(userId)
        );
        setMyParticipations(new Set(participationIds));
      }
    } catch (err) {
      console.error("일정 조회 실패:", err);
      setError("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 뷰 모드 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("schedule_viewMode", viewMode);
  }, [viewMode]);

  // 리스트뷰 진입 시 오늘 날짜로 스크롤
  useEffect(() => {
    if (
      viewMode === "list" &&
      schedules.length > 0 &&
      !filterDate &&
      location.pathname === "/schedules"
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
  }, [viewMode, schedules.length, filterDate, location.pathname]);

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
          <button className="btn-retry" onClick={loadSchedules}>
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
    loadSchedules(); // 일정 목록 새로고침
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

  // 정원 상태 계산 헬퍼 함수
  const getCapacityStatus = (
    schedule: Schedule
  ): "available" | "full" | "participated" => {
    const { currentParticipants, maxCapacity } = schedule;
    if (myParticipations.has(schedule.id)) return "participated";
    if (currentParticipants >= maxCapacity) return "full";
    return "available";
  };

  // 필터링된 일정 목록
  const filteredSchedules = schedules.filter((schedule) => {
    // 날짜 필터
    if (filterDate) {
      const scheduleDate = format(new Date(schedule.scheduledAt), "yyyy-MM-dd");
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      if (scheduleDate !== filterDateStr) return false;
    }

    // 정원 상태 필터
    if (capacityFilter !== "all") {
      const status = getCapacityStatus(schedule);
      if (status !== capacityFilter) return false;
    }

    return true;
  });

  return (
    <div className="schedule-page">
      <div className="schedule-header">
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
              📅 캘린더
            </button>
            <button
              className={`header-action-btn view-toggle-btn ${
                viewMode === "list" ? "active" : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              📋 리스트
            </button>
          </div>
          <button
            className="header-action-btn btn-join"
            onClick={() => setShowJoinModal(true)}
          >
            ✓ 일정 참여
          </button>
          <button
            className="header-action-btn btn-create"
            onClick={() => {
              setShowCreateModal(true);
            }}
          >
            + 일정 등록
          </button>
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
        </div>
      </div>

      {viewMode === "calendar" ? (
        <ScheduleCalendarView
          schedules={filteredSchedules}
          onDateClick={handleDateClick}
          onDateDoubleClick={handleDateDoubleClick}
          onScheduleClick={handleScheduleClick}
          myParticipations={myParticipations}
          calendarDate={calendarDate}
          onCalendarDateChange={setCalendarDate}
        />
      ) : filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <p>📅</p>
          <p>등록된 일정이 없습니다.</p>
          <p className="empty-hint">새로운 일정을 생성해보세요!</p>
        </div>
      ) : (
        <div className="schedule-list">
          {filteredSchedules.map((schedule, index) => {
            const isPast = new Date(schedule.scheduledAt) < new Date();
            const isFirstFuture =
              !isPast &&
              filteredSchedules
                .slice(0, index)
                .every((s) => new Date(s.scheduledAt) < new Date());
            const isParticipating = myParticipations.has(schedule.id);
            const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
            const hasValidDraw = schedule.drawType && schedule.isDrawValid;

            // 정원 상태 계산 (3단계: 신청 가능 / 마감 또는 초과 / 신청 완료)
            const getCapacityStatus = () => {
              const { currentParticipants, maxCapacity } = schedule;
              if (isParticipating) return "capacity-participated";
              if (currentParticipants >= maxCapacity) return "capacity-full";
              return "capacity-available";
            };

            const capacityStatus = getCapacityStatus();

            // 대진 상태 결정
            const getDrawStatus = () => {
              if (hasInvalidDraw) return "draw-invalid";
              if (hasValidDraw) return "draw-valid";
              return "draw-none";
            };

            const drawStatus = getDrawStatus();

            return (
              <div
                key={schedule.id}
                ref={isFirstFuture ? todayScheduleRef : null}
                className={`schedule-card ${
                  isPast ? "past-schedule" : ""
                } ${capacityStatus} ${drawStatus}`}
                onClick={() => handleScheduleClick(schedule)}
              >
                <div className="schedule-info">
                  {/* 1. 코트명, 예약자명 */}
                  <div className="schedule-header-info">
                    <h3>
                      코트명 : {schedule.courtName}
                      {schedule.reservedByUserName && (
                        <span className="schedule-reserved-by">
                          , 예약자 : {schedule.reservedByUserName}
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* 2. 날짜 및 시간, 신청인원 / 총인원 */}
                  <div className="schedule-meta-row">
                    <p className="schedule-time">
                      {new Date(schedule.scheduledAt).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="schedule-participants">
                      <span className="stat-confirmed">
                        신청 {schedule.currentParticipants}명
                      </span>
                      <span className="stat-divider">/</span>
                      <span className="stat-total">
                        총원 {schedule.maxCapacity}명
                      </span>
                    </div>
                  </div>

                  {/* 3. 비용, 설명 + 대진표 상태/대진보기 (오른쪽) */}
                  <div className="schedule-bottom-row">
                    <div className="schedule-details">
                      {isNotEmpty(schedule.cost) &&
                        schedule.cost !== undefined && (
                          <span className="schedule-cost">
                            ₩ {schedule.cost.toLocaleString()}
                          </span>
                        )}
                      {isNotEmpty(schedule.description) &&
                        schedule.description !== undefined && (
                          <span className="schedule-description">
                            {schedule.description.length > 30
                              ? `${schedule.description.substring(0, 30)}...`
                              : schedule.description}
                          </span>
                        )}
                    </div>
                    <div className="schedule-draw-badges">
                      {hasInvalidDraw && (
                        <span className="draw-badge draw-badge-invalid">
                          ⚠️ 무효
                        </span>
                      )}
                      {hasValidDraw && (
                        <span className="draw-badge draw-badge-valid">
                          ✓ 완료
                        </span>
                      )}
                      {(hasValidDraw || hasInvalidDraw) && (
                        <button
                          className="draw-badge draw-badge-view"
                          onClick={(e) => handleDrawViewClick(e, schedule)}
                        >
                          📋 보기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
            loadSchedules();
            setToastMessage("일정이 생성되었습니다.");
          }}
        />
      )}

      {showJoinModal && (
        <ScheduleJoinModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            loadSchedules();
          }}
        />
      )}

      {showDetailModal && selectedScheduleId && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          onClose={handleDetailModalClose}
          onSuccess={() => {
            loadSchedules();
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
