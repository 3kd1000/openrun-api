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
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { isPastDate } from "../../../utils/scheduleValidation";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { ClipboardListIcon, CheckIcon, CopyIcon, RefreshCwIcon, EditIcon } from "../../../components/common/Icons";
import "./DrawViewModal.css";

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
    // 이미 로딩 중이면 중복 호출 방지
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
    loadDraw(); // 대진표 다시 로드
    onSuccess(); // 부모 컴포넌트에도 알림
  };

  // 스코어 입력 핸들러
  const handleScoreChange = (
    matchId: number,
    team: "A" | "B",
    value: string
  ) => {
    const numValue = value === "" ? "" : value.replace(/[^0-9]/g, "");
    // 최댓값 7로 제한
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

      // 스코어가 모두 입력된 매치만 수집하여 배치 업데이트 요청 생성
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

      // 입력된 스코어가 있으면 배치 업데이트 실행, 없으면 그냥 모드만 전환
      if (updateItems.length > 0) {
        const batchRequest: BatchUpdateMatchRequest = {
          matches: updateItems,
        };

        // 배치 업데이트 한 번에 실행
        await drawService.updateMatchResultsBatch(
          schedule.clubId,
          batchRequest
        );
        // 성공 시 대진표 다시 로드
        await loadDraw();
      }

      // 입력 여부와 관계없이 편집 모드 종료
      setIsEditMode(false);
      setMatchScores(new Map());
      // 경기 결과 저장 시에는 onSuccess() 호출하지 않음 (일정 정보는 변경되지 않았으므로)
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
      // 편집 모드 → 저장
      handleSaveResults();
    } else {
      // 일반 모드 → 편집 모드
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

      // 대진표 다시 로드
      await loadDraw();

      // matchScores에서 해당 matchId 제거
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

      // manualGames에서 모든 userId 추출
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

      // 대진표 다시 로드
      await loadDraw();
      setIsEditingDraw(false);
      onSuccess(); // 부모 컴포넌트에 알림
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

  // ESC 키로 모달 닫기 (편집 모드가 아닐 때만)
  useEscapeKey(onClose, !isEditMode && !showRegenerateModal && !isEditingDraw);

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content draw-view-modal modal-nested-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <ClipboardListIcon size={24} />
            <span>대진표</span>
          </h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="draw-view-content">
          {/* 일정 정보 */}
          <div className="schedule-info-section">
            <h3>{schedule.courtName}</h3>
            <p className="schedule-datetime">
              {formatScheduleDateTime(
                schedule.scheduledAt,
                schedule.durationMinutes
              )}
            </p>
            <div className="draw-type-badge">
              대진 타입: {schedule.drawType}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">대진표를 불러오는 중...</div>
          ) : isEditingDraw && drawResult ? (
            /* 대진 수정 모드 */
            <ManualDrawEditor
              participants={participants}
              playerCount={confirmedParticipantCount}
              numberOfCourts={schedule.numberOfCourts}
              initialGames={drawResult.games}
              onComplete={handleSaveEditedDraw}
              onCancel={() => setIsEditingDraw(false)}
            />
          ) : drawResult ? (
            <div className="draw-result-section">
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
            <div className="modal-actions">
              <div className="btn-wrapper">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-copy"
                  disabled={!drawResult || isEditMode}
                >
                  {copied ? (
                    <>
                      <CheckIcon size={16} />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={16} />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
              <div
                className="btn-wrapper"
                title={
                  hasAnyResult
                    ? "경기 결과가 입력된 대진표는 재생성할 수 없습니다"
                    : ""
                }
              >
                <button
                  type="button"
                  onClick={() => setShowRegenerateModal(true)}
                  className="btn-regenerate"
                  disabled={!drawResult || isEditMode || hasAnyResult}
                >
                  <RefreshCwIcon size={16} /> 재생성
                </button>
              </div>
              {/* 대진 수정 버튼: 경기 결과가 없을 때만 표시 */}
              {canEditDraw && (
                <div className="btn-wrapper">
                  <button
                    type="button"
                    onClick={() => setIsEditingDraw(true)}
                    className="btn-edit-draw"
                    disabled={isEditMode}
                  >
                    <EditIcon size={16} /> 대진수정
                  </button>
                </div>
              )}
              <div
                className="btn-wrapper"
                title={
                  isFutureSchedule
                    ? "경기 일정이 지난 후에만 결과를 입력할 수 있습니다"
                    : ""
                }
              >
                <button
                  type="button"
                  onClick={handleToggleEditMode}
                  className={isEditMode ? "btn-save" : "btn-edit"}
                  disabled={!drawResult || saving || isFutureSchedule}
                >
                  {saving ? (
                    "저장 중..."
                  ) : isEditMode ? (
                    <><CheckIcon size={16} /> 입력완료</>
                  ) : (
                    <><EditIcon size={16} /> 결과입력</>
                  )}
                </button>
              </div>
              <div className="btn-wrapper">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary"
                  disabled={isEditMode}
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawViewModal;
