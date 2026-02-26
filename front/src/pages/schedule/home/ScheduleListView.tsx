import React, { type RefObject } from "react";
import type { Schedule, MyParticipationInfo, MyExternalRequestInfo } from "../../../types/schedule";
import { StarIcon } from "../../../components/common/Icons";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  firstFutureIndex?: number; // 첫 번째 미래 일정의 인덱스 (스크롤 타겟)
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

const MATCH_TYPE_LABEL: Record<string, string> = {
  MEN_DOUBLES: "남복",
  WOMEN_DOUBLES: "여복",
  MIXED_DOUBLES: "혼복",
  SINGLES: "단식",
};

const MATCH_TYPE_CLASS: Record<string, string> = {
  MEN_DOUBLES: "bg-blue-100 text-blue-700",
  WOMEN_DOUBLES: "bg-pink-100 text-pink-700",
  MIXED_DOUBLES: "bg-purple-100 text-purple-700",
  SINGLES: "bg-emerald-100 text-emerald-700",
};

const ScheduleListView: React.FC<ScheduleListViewProps> = ({
  displaySchedules,
  myParticipations,
  scheduleMode,
  todayScheduleRef,
  firstFutureIndex = 0,
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
    <div className="space-y-3">
      {/* 상단 센티넬 (과거 일정 로드 트리거) */}
      {scheduleMode === "club" && hasMorePast && (
        <div ref={topSentinelRef} className="h-1">
          {loadingPast && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              과거 일정 불러오는 중...
            </div>
          )}
        </div>
      )}

      {displaySchedules.map((item, index) => {
        const schedule = item.schedule;
        const isPast = new Date(schedule.scheduledAt) < new Date();
        // firstFutureIndex 기반으로 스크롤 타겟 결정 (초기 로딩 시 PAST 응답 길이로 계산됨)
        const isScrollTarget = index === firstFutureIndex;
        const isParticipating = myParticipations.has(schedule.id);
        const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
        const hasValidDraw = schedule.drawType && schedule.isDrawValid;

        // 정원 상태 계산 (3단계: 신청 가능 / 마감 또는 초과 / 신청 완료)
        // + 신청완료+마감 동시 상태 표시
        const isFull = schedule.currentParticipants >= schedule.maxCapacity;
        // 신청완료 + 마감 동시 상태: 테두리로 구분
        const isParticipatedAndFull = isParticipating && isFull;

        // Card 테두리/배경 클래스 결정 (2색 체계: emerald + gray)
        const cardBorderClass = isParticipatedAndFull
          ? "bg-emerald-50 border-[3px] border-gray-400"
          : isParticipating
          ? "bg-emerald-50 border-emerald-300"
          : isFull
          ? "bg-gray-100 border-gray-400"
          : "border-gray-300";

        // 개인일정 모드: 참가 상태 뱃지
        const participation = item.myParticipation;
        const externalRequest = item.myExternalRequest;

        return (
          <div
            key={schedule.id}
            ref={isScrollTarget ? todayScheduleRef : null}
          >
            <Card
              className={cn(
                "gap-0 py-0 cursor-pointer transition-opacity",
                cardBorderClass,
                isPast && "opacity-45 hover:opacity-65"
              )}
              onClick={() => onScheduleClick(schedule)}
            >
              <CardContent className="p-3">
                {/* Row 1: 핀 아이콘 + 경기 유형 뱃지 + 코트명, 예약자명 */}
                <div className="text-sm mb-2 flex items-center flex-wrap gap-1">
                  {schedule.pinned && (
                    <StarIcon size={14} color="#334155" className="shrink-0" />
                  )}
                  {schedule.matchType && schedule.matchType !== "NONE" && (
                    <Badge
                      className={cn(
                        "py-0 px-1.5 text-[11px] leading-5",
                        MATCH_TYPE_CLASS[schedule.matchType],
                        "shrink-0"
                      )}
                      title={MATCH_TYPE_LABEL[schedule.matchType] ?? ""}
                    >
                      {MATCH_TYPE_LABEL[schedule.matchType] ?? ""}
                    </Badge>
                  )}
                  <span>
                    코트명 : {schedule.courtName}
                    {schedule.reservedByUserName && (
                      <span className="text-muted-foreground">
                        , 예약자 : {schedule.reservedByUserName}
                      </span>
                    )}
                  </span>
                </div>

                {/* 개인 모드: 클럽명 행 */}
                {scheduleMode === "personal" && schedule.clubName && (
                  <div className="text-xs text-muted-foreground mb-1">
                    클럽명 : {schedule.clubName}
                  </div>
                )}

                {/* Row 2: 날짜/시간, 코트수, 신청인원/총인원 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                  <span>
                    {formatScheduleDateTime(
                      schedule.scheduledAt,
                      schedule.durationMinutes
                    )}
                  </span>
                  {schedule.numberOfCourts != null && schedule.numberOfCourts >= 1 && (
                    <span>코트 {schedule.numberOfCourts}면</span>
                  )}
                  <span>
                    신청 {schedule.currentParticipants}명
                    {" / "}
                    총원 {schedule.maxCapacity}명
                  </span>
                </div>

                {/* Row 3: 비용 + 설명 (왼쪽) + 뱃지 영역 (오른쪽) */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    {isNotEmpty(schedule.cost) && schedule.cost !== undefined && (
                      <span className="shrink-0">
                        ₩ {schedule.cost.toLocaleString()}
                      </span>
                    )}
                    {isNotEmpty(schedule.description) &&
                      schedule.description !== undefined && (
                        <span className="truncate">
                          {schedule.description.length > 30
                            ? `${schedule.description.substring(0, 30)}...`
                            : schedule.description}
                        </span>
                      )}
                  </div>

                  {/* 대진표 + 참가 상태 뱃지 영역 */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {/* 개인일정 모드: 참가 상태 뱃지 */}
                    {scheduleMode === "personal" && (
                      <>
                        {participation?.status === "CONFIRMED" && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            참가확정
                          </Badge>
                        )}
                        {participation?.status === "WAITING" && (
                          <Badge className="bg-gray-100 text-gray-600">
                            대기
                            {participation.waitingNumber &&
                              ` ${participation.waitingNumber}번`}
                          </Badge>
                        )}
                        {externalRequest?.status === "PENDING" && (
                          <Badge className="bg-gray-100 text-gray-600">
                            승인대기
                          </Badge>
                        )}
                        {externalRequest?.status === "REJECTED" && (
                          <Badge className="bg-gray-100 text-gray-600">
                            참가거절
                          </Badge>
                        )}
                      </>
                    )}

                    {/* 대진표 뱃지 */}
                    {hasInvalidDraw && (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-600 border-dashed border-gray-300"
                      >
                        대진무효
                      </Badge>
                    )}
                    {hasValidDraw && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-400"
                      >
                        대진생성완료
                      </Badge>
                    )}
                    {(hasValidDraw || hasInvalidDraw) && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => onDrawViewClick(e, schedule)}
                      >
                        대진보기
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}

      {/* 하단 센티넬 (미래 일정 로드 트리거) */}
      {scheduleMode === "club" && hasMoreFuture && (
        <div ref={bottomSentinelRef} className="h-1">
          {loadingFuture && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              미래 일정 불러오는 중...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleListView;
