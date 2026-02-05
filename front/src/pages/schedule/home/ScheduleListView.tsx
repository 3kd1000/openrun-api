import React, { type RefObject } from "react";
import type { Schedule, MyParticipationInfo, MyExternalRequestInfo } from "../../../types/schedule";
import { StarIcon } from "../../../components/common/Icons";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";

type ScheduleMode = "club" | "personal";

export interface DisplayScheduleItem {
  schedule: Schedule;
  myParticipation: MyParticipationInfo | null;
  myExternalRequest: MyExternalRequestInfo | null;
}

interface ScheduleListViewProps {
  displaySchedules: DisplayScheduleItem[];
  myParticipations: Set<number>;
  scheduleMode: ScheduleMode;
  todayScheduleRef: RefObject<HTMLDivElement | null>;
  onScheduleClick: (schedule: Schedule) => void;
  onDrawViewClick: (e: React.MouseEvent, schedule: Schedule) => void;
  // Infinite Scroll props
  topSentinelRef?: RefObject<HTMLDivElement | null>;
  bottomSentinelRef?: RefObject<HTMLDivElement | null>;
  loadingPast?: boolean;
  loadingFuture?: boolean;
  hasMorePast?: boolean;
  hasMoreFuture?: boolean;
}

const ScheduleListView: React.FC<ScheduleListViewProps> = ({
  displaySchedules,
  myParticipations,
  scheduleMode,
  todayScheduleRef,
  onScheduleClick,
  onDrawViewClick,
  topSentinelRef,
  bottomSentinelRef,
  loadingPast = false,
  loadingFuture = false,
  hasMorePast = false,
  hasMoreFuture = false,
}) => {
  return (
    <div className="schedule-list">
      {/* 상단 센티넬 (과거 일정 로드 트리거) */}
      {scheduleMode === "club" && hasMorePast && (
        <div ref={topSentinelRef} className="schedule-list__sentinel schedule-list__sentinel--top">
          {loadingPast && <div className="schedule-list__loading">과거 일정 불러오는 중...</div>}
        </div>
      )}

      {displaySchedules.map((item, index) => {
        const schedule = item.schedule;
        const isPast = new Date(schedule.scheduledAt) < new Date();
        const isFirstFuture =
          !isPast &&
          displaySchedules
            .slice(0, index)
            .every((s) => new Date(s.schedule.scheduledAt) < new Date());
        const isParticipating = myParticipations.has(schedule.id);
        const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
        const hasValidDraw = schedule.drawType && schedule.isDrawValid;

        // 정원 상태 계산 (3단계: 신청 가능 / 마감 또는 초과 / 신청 완료)
        // + 신청완료+마감 동시 상태 표시
        const isFull = schedule.currentParticipants >= schedule.maxCapacity;
        const getCapacityStatusClass = () => {
          if (isParticipating) return "capacity-participated";
          if (isFull) return "capacity-full";
          return "capacity-available";
        };

        const capacityStatus = getCapacityStatusClass();
        // 신청완료 + 마감 동시 상태: 테두리로 구분
        const isParticipatedAndFull = isParticipating && isFull;

        // 대진 상태 결정
        const getDrawStatus = () => {
          if (hasInvalidDraw) return "draw-invalid";
          if (hasValidDraw) return "draw-valid";
          return "draw-none";
        };

        const drawStatus = getDrawStatus();

        // 개인일정 모드: 참가 상태 뱃지
        const participation = item.myParticipation;
        const externalRequest = item.myExternalRequest;

        return (
          <div
            key={schedule.id}
            ref={isFirstFuture ? todayScheduleRef : null}
            className={`schedule-card ${
              isPast ? "past-schedule" : ""
            } ${capacityStatus} ${drawStatus} ${
              isParticipatedAndFull ? "participated-and-full" : ""
            }`}
            onClick={() => onScheduleClick(schedule)}
          >
            <div className="schedule-info">
              {/* 1. 코트명, 예약자명 */}
              <div className="schedule-header-info">
                <h3>
                  {schedule.pinned ? (
                    <span className="schedule-pin-badge" title="강조">
                      <StarIcon size={14} />
                    </span>
                  ) : null}
                  {schedule.matchType && schedule.matchType !== "NONE" && (
                    <span
                      className={`schedule-match-badge match-${schedule.matchType.toLowerCase()}`}
                      title={
                        schedule.matchType === "MEN_DOUBLES"
                          ? "남복"
                          : schedule.matchType === "WOMEN_DOUBLES"
                          ? "여복"
                          : schedule.matchType === "MIXED_DOUBLES"
                          ? "혼복"
                          : schedule.matchType === "SINGLES"
                          ? "단식"
                          : ""
                      }
                    >
                      {schedule.matchType === "MEN_DOUBLES"
                        ? "남복"
                        : schedule.matchType === "WOMEN_DOUBLES"
                        ? "여복"
                        : schedule.matchType === "MIXED_DOUBLES"
                        ? "혼복"
                        : schedule.matchType === "SINGLES"
                        ? "단식"
                        : ""}
                    </span>
                  )}
                  코트명 : {schedule.courtName}
                  {schedule.reservedByUserName && (
                    <span className="schedule-reserved-by">
                      , 예약자 : {schedule.reservedByUserName}
                    </span>
                  )}
                </h3>
              </div>

              {scheduleMode === "personal" && schedule.clubName && (
                <div className="schedule-club-name">
                  <span>클럽명 : {schedule.clubName}</span>
                </div>
              )}

              {/* 2. 날짜 및 시간, 코트수, 신청인원 / 총인원 */}
              <div className="schedule-meta-row">
                <p className="schedule-time">
                  {formatScheduleDateTime(
                    schedule.scheduledAt,
                    schedule.durationMinutes
                  )}
                </p>
                {schedule.numberOfCourts != null && schedule.numberOfCourts >= 1 && (
                  <span className="schedule-courts">
                    코트 {schedule.numberOfCourts}면
                  </span>
                )}
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
                  {isNotEmpty(schedule.cost) && schedule.cost !== undefined && (
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

                {/* 대진표 + 참가 상태 뱃지 영역 */}
                <div className="schedule-draw-badges">
                  {/* 개인일정 모드: 참가 상태 뱃지 */}
                  {scheduleMode === "personal" && (
                    <>
                      {participation?.status === "CONFIRMED" && (
                        <span className="participation-badge participation-confirmed">
                          참가확정
                        </span>
                      )}
                      {participation?.status === "WAITING" && (
                        <span className="participation-badge participation-waiting">
                          대기
                          {participation.waitingNumber &&
                            ` ${participation.waitingNumber}번`}
                        </span>
                      )}
                      {externalRequest?.status === "PENDING" && (
                        <span className="participation-badge participation-pending">
                          승인대기
                        </span>
                      )}
                      {externalRequest?.status === "REJECTED" && (
                        <span className="participation-badge participation-rejected">
                          참가거절
                        </span>
                      )}
                    </>
                  )}

                  {/* 대진표 뱃지 */}
                  {hasInvalidDraw && (
                    <span className="participation-badge draw-invalid">
                      대진무효
                    </span>
                  )}
                  {hasValidDraw && (
                    <span className="participation-badge draw-valid">
                      대진생성완료
                    </span>
                  )}
                  {(hasValidDraw || hasInvalidDraw) && (
                    <button
                      className="participation-badge draw-view"
                      onClick={(e) => onDrawViewClick(e, schedule)}
                    >
                      <span>대진보기</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 하단 센티넬 (미래 일정 로드 트리거) */}
      {scheduleMode === "club" && hasMoreFuture && (
        <div ref={bottomSentinelRef} className="schedule-list__sentinel schedule-list__sentinel--bottom">
          {loadingFuture && <div className="schedule-list__loading">미래 일정 불러오는 중...</div>}
        </div>
      )}
    </div>
  );
};

export default ScheduleListView;
