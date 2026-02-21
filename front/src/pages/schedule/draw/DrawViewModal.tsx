import React, { useState, useEffect, useCallback, useRef } from "react";
import { drawService } from "../../../services/drawService";
import type {
  DrawResponse,
  BatchUpdateMatchRequest,
  ManualGame,
  CreateDrawRequestWithIds,
} from "../../../services/drawService";
import type { Schedule, Participant } from "../../../types/schedule";
import DrawCreateModal from "./DrawCreateModal";
import DrawGamesList from "../../../components/draw/DrawGamesList";
import ManualDrawEditor from "../../../components/draw/ManualDrawEditor";
import { formatDrawAsText } from "../../../utils/DrawFormatUtils";
import { isPastDate } from "../../../utils/scheduleValidation";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { ClipboardListIcon, CopyIcon } from "../../../components/common/Icons";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface Props {
  schedule: Schedule;
  participants: Participant[];
  onClose: () => void;
  onSuccess: () => void;
}

const DrawViewModal: React.FC<Props> = ({
  schedule,
  participants,
  onClose,
  onSuccess,
}) => {
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // 결과 입력 모드
  const [isEditMode, setIsEditMode] = useState(false);
  const [matchScores, setMatchScores] = useState<
    Map<number, { teamAScore: string; teamBScore: string }>
  >(new Map());
  const [saving, setSaving] = useState(false);

  // 대진 수정 모드
  const [isEditingDraw, setIsEditingDraw] = useState(false);

  // 중복 호출 방지를 위한 ref
  const isLoadingRef = useRef(false);

  const loadDraw = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError("");
      const result = await drawService.getDraw(schedule.id);
      setDrawResult(result);
    } catch (err: unknown) {
      console.error("대진표 조회 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "대진표를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [schedule.id]);

  useEffect(() => {
    loadDraw();
  }, [loadDraw]);

  // 대진 참가 인원수 (확정된 참가자 수 기준)
  const confirmedParticipantCount = participants.filter(
    (p) => p.status === "CONFIRMED"
  ).length;

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      const text = formatDrawAsText(drawResult, {
        title: `🎯 ${schedule.courtName} 대진표`,
        scheduledAt: schedule.scheduledAt,
        drawType: schedule.drawType || "",
        playerCount: confirmedParticipantCount,
        numberOfCourts: schedule.numberOfCourts,
      });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleRegenerateSuccess = () => {
    setShowRegenerateModal(false);
    loadDraw();
    onSuccess();
  };

  // 스코어 입력 핸들러
  const handleScoreChange = (
    matchId: number,
    team: "A" | "B",
    value: string
  ) => {
    const numValue = value === "" ? "" : value.replace(/[^0-9]/g, "");
    const limitedValue =
      numValue === "" ? "" : Math.min(parseInt(numValue), 7).toString();

    setMatchScores((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(matchId) || { teamAScore: "", teamBScore: "" };
      if (team === "A") {
        newMap.set(matchId, { ...current, teamAScore: limitedValue });
      } else {
        newMap.set(matchId, { ...current, teamBScore: limitedValue });
      }
      return newMap;
    });
  };

  // 승자 계산
  const calculateResult = (
    teamAScore: number,
    teamBScore: number
  ): "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW" => {
    if (teamAScore > teamBScore) return "TEAM_A_WIN";
    if (teamBScore > teamAScore) return "TEAM_B_WIN";
    return "DRAW";
  };

  // 결과 저장
  const handleSaveResults = async () => {
    if (!drawResult) return;

    try {
      setSaving(true);
      setError("");

      const updateItems = Array.from(matchScores.entries())
        .filter(([matchId, scores]) => {
          const game = drawResult.games.find((g) => g.matchId === matchId);
          return game && scores.teamAScore !== "" && scores.teamBScore !== "";
        })
        .map(([matchId, scores]) => {
          const teamAScore = parseInt(scores.teamAScore);
          const teamBScore = parseInt(scores.teamBScore);
          const result = calculateResult(teamAScore, teamBScore);

          return {
            matchId,
            request: {
              teamAScore,
              teamBScore,
              result,
              playedAt: schedule.scheduledAt,
            },
          };
        });

      if (updateItems.length > 0) {
        const batchRequest: BatchUpdateMatchRequest = {
          matches: updateItems,
        };

        await drawService.updateMatchResultsBatch(
          schedule.clubId,
          batchRequest
        );
        await loadDraw();
      }

      setIsEditMode(false);
      setMatchScores(new Map());
    } catch (err: unknown) {
      console.error("경기 결과 저장 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "경기 결과 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 편집 모드 토글
  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleSaveResults();
    } else {
      setIsEditMode(true);
      setError("");
    }
  };

  // 결과 초기화 핸들러
  const handleResetResult = async (matchId: number) => {
    if (!window.confirm("이 경기 결과를 초기화하시겠습니까?\n통계에서도 제외됩니다.")) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await drawService.deleteMatchResult(schedule.clubId, matchId);
      await loadDraw();

      setMatchScores((prev) => {
        const newMap = new Map(prev);
        newMap.delete(matchId);
        return newMap;
      });
    } catch (err: unknown) {
      console.error("결과 초기화 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "결과 초기화에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 대진 수정 저장 핸들러
  const handleSaveEditedDraw = async (manualGames: ManualGame[]) => {
    try {
      setSaving(true);
      setError("");

      const allUserIds = new Set<number>();
      manualGames.forEach((g) => {
        g.teamAUserIds.forEach((id) => allUserIds.add(id));
        g.teamBUserIds.forEach((id) => allUserIds.add(id));
      });

      const requestWithIds: CreateDrawRequestWithIds = {
        drawType: "MANUAL",
        numberOfTotalPlayer: allUserIds.size,
        userIds: Array.from(allUserIds),
        manualGames,
      };

      await drawService.createDrawWithScheduleByIds(schedule.id, requestWithIds);
      await loadDraw();
      setIsEditingDraw(false);
      onSuccess();
    } catch (err: unknown) {
      console.error("대진 수정 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "대진 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 경기 결과가 하나라도 입력되었는지 확인
  const hasAnyResult =
    drawResult?.games.some(
      (game) => isNotEmpty(game.result)
    ) || false;

  // 일정이 미래인지 확인 (미래 일정은 결과 입력 불가)
  const isFutureSchedule = !isPastDate(schedule.scheduledAt);

  // 대진 수정 가능 여부: 경기 결과가 입력되지 않은 경우에만
  const canEditDraw = !hasAnyResult && drawResult !== null;

  // 재생성 모달: DrawCreateModal (이미 Dialog) full replacement
  if (showRegenerateModal) {
    return (
      <DrawCreateModal
        scheduleId={schedule.id}
        schedule={schedule}
        participants={participants}
        onClose={() => setShowRegenerateModal(false)}
        onSuccess={handleRegenerateSuccess}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !isEditMode && !isEditingDraw) onClose(); }}>
      <DialogContent className="max-w-[700px] w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between w-full pr-8">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardListIcon size={24} />
              <span>대진표</span>
            </DialogTitle>
            {drawResult && !isEditingDraw && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCopy}
                disabled={isEditMode}
              >
                <CopyIcon size={14} className="mr-1" />
                {copied ? "복사됨" : "복사"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className={cn(
          "flex flex-col p-3 gap-3 max-[768px]:p-1.5 max-[768px]:gap-1.5",
          isEditingDraw ? "overflow-y-auto" : "overflow-hidden"
        )}>
          {/* 일정 정보 */}
          <div className="text-center p-3 bg-muted rounded-md border shrink-0 max-[768px]:p-1.5 max-[768px]:rounded-sm">
            <h3 className="text-lg font-bold text-foreground mb-1.5 max-[768px]:text-sm max-[768px]:mb-0.5">
              {schedule.courtName}
            </h3>
            <p className="my-1.5 text-sm text-muted-foreground font-medium max-[768px]:my-0.5 max-[768px]:text-[11px]">
              {formatScheduleDateTime(
                schedule.scheduledAt,
                schedule.durationMinutes
              )}
            </p>
            <div className={cn(
              "inline-flex items-center justify-center mt-1.5 px-3 py-0.5 bg-background border rounded-md text-sm font-medium text-foreground leading-none",
              "max-[768px]:mt-0.5 max-[768px]:px-1.5 max-[768px]:rounded-sm max-[768px]:text-[13px] max-[768px]:h-[26px] max-[768px]:min-h-[26px]",
              "max-[425px]:text-xs",
              "max-[359px]:text-[11px]"
            )}>
              대진 타입: {schedule.drawType}
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">대진표를 불러오는 중...</div>
          ) : isEditingDraw && drawResult ? (
            <ManualDrawEditor
              participants={participants}
              playerCount={confirmedParticipantCount}
              numberOfCourts={schedule.numberOfCourts}
              initialGames={drawResult.games}
              onComplete={handleSaveEditedDraw}
              onCancel={() => setIsEditingDraw(false)}
            />
          ) : drawResult ? (
            <div className={cn(
              "flex-[0_1_auto] min-h-0 flex flex-col overflow-hidden",
              "[&>.dgc-games-list]:block [&>.dgc-games-list]:min-h-0 [&>.dgc-games-list]:overflow-y-auto",
              "[&_.dgc-round-group]:shrink-0",
              "[&_.dgc-round-games]:block [&_.dgc-round-games]:overflow-visible",
              "[&_.dgc-game-number]:min-w-[35px]",
              "max-[768px]:[&_.dgc-game-content]:text-[13px]",
              "max-[768px]:[&>.dgc-games-list]:max-h-none"
            )}>
              <DrawGamesList
                games={drawResult.games}
                playerCount={confirmedParticipantCount}
                numberOfCourts={schedule.numberOfCourts}
                isEditMode={isEditMode}
                onScoreChange={handleScoreChange}
                matchScores={matchScores}
                onResetResult={handleResetResult}
              />
            </div>
          ) : null}

          {/* 액션 버튼 - 대진 수정 모드가 아닐 때만 표시 */}
          {!isEditingDraw && (
            <div className={cn(
              "grid gap-2 pt-3 border-t mt-3 shrink-0",
              "grid-cols-4",
              "max-[768px]:pt-1.5 max-[768px]:mt-1.5 max-[768px]:gap-1.5",
              "max-[425px]:grid-cols-2 max-[425px]:gap-1.5"
            )}>
              <div
                title={
                  hasAnyResult
                    ? "경기 결과가 입력된 대진표는 재생성할 수 없습니다"
                    : ""
                }
              >
                <Button
                  onClick={() => setShowRegenerateModal(true)}
                  disabled={!drawResult || isEditMode || hasAnyResult}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  재생성
                </Button>
              </div>
              {canEditDraw && (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditingDraw(true)}
                  disabled={isEditMode}
                  className="w-full"
                >
                  대진수정
                </Button>
              )}
              <div
                title={
                  isFutureSchedule
                    ? "경기 일정이 지난 후에만 결과를 입력할 수 있습니다"
                    : ""
                }
              >
                <Button
                  variant={isEditMode ? "default" : "secondary"}
                  onClick={handleToggleEditMode}
                  disabled={!drawResult || saving || isFutureSchedule}
                  className="w-full"
                >
                  {saving ? "저장 중..." : isEditMode ? "입력완료" : "결과입력"}
                </Button>
              </div>
              <Button
                variant="default"
                onClick={onClose}
                disabled={isEditMode}
                className="w-full"
              >
                확인
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrawViewModal;
