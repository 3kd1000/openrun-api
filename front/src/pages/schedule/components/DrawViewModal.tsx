import React, { useState, useEffect, useCallback, useRef } from "react";
import { drawService } from "../../../services/drawService";
import type { DrawResponse } from "../../../services/drawService";
import type { Schedule, Participant } from "../../../types/schedule";
import DrawCreateModal from "./DrawCreateModal";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
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
    } catch (err: any) {
      console.error("대진표 조회 실패:", err);
      setError(
        err.response?.data?.message || "대진표를 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [schedule.id]);

  useEffect(() => {
    loadDraw();
  }, [loadDraw]);

  // 대진표 텍스트로 포맷팅
  const formatDrawAsText = (): string => {
    if (!drawResult) return "";
    let text = `🎯 ${schedule.courtName} 대진표\n`;
    text += `📅 ${new Date(schedule.scheduledAt).toLocaleString("ko-KR")}\n`;
    text += `대진 타입: ${schedule.drawType}\n\n`;

    drawResult.games.forEach((game) => {
      text += `경기 ${game.gameNo} (${game.roundNo}R)\n`;
      text += `  Team A: ${game.teamA.join(", ")}\n`;
      text += `  Team B: ${game.teamB.join(", ")}\n\n`;
    });

    return text;
  };

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatDrawAsText());
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
    setMatchScores((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(matchId) || { teamAScore: "", teamBScore: "" };
      if (team === "A") {
        newMap.set(matchId, { ...current, teamAScore: numValue });
      } else {
        newMap.set(matchId, { ...current, teamBScore: numValue });
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

      // 스코어가 모두 입력된 매치만 수집
      const updatePromises = Array.from(matchScores.entries())
        .filter(([matchId, scores]) => {
          const game = drawResult.games.find((g) => g.matchId === matchId);
          return game && scores.teamAScore !== "" && scores.teamBScore !== "";
        })
        .map(async ([matchId, scores]) => {
          const teamAScore = parseInt(scores.teamAScore);
          const teamBScore = parseInt(scores.teamBScore);
          const result = calculateResult(teamAScore, teamBScore);

          return drawService.updateMatchResult(schedule.clubId, matchId, {
            teamAScore,
            teamBScore,
            result,
            playedAt: new Date().toISOString(),
          });
        });

      // 입력된 스코어가 있으면 저장, 없으면 그냥 모드만 전환
      if (updatePromises.length > 0) {
        // 모든 업데이트 실행
        await Promise.all(updatePromises);
        // 성공 시 대진표 다시 로드
        await loadDraw();
      }

      // 입력 여부와 관계없이 편집 모드 종료
      setIsEditMode(false);
      setMatchScores(new Map());
      // 경기 결과 저장 시에는 onSuccess() 호출하지 않음 (일정 정보는 변경되지 않았으므로)
    } catch (err: any) {
      console.error("경기 결과 저장 실패:", err);
      setError(err.response?.data?.message || "경기 결과 저장에 실패했습니다.");
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

  // 경기 결과가 하나라도 입력되었는지 확인
  const hasAnyResult =
    drawResult?.games.some(
      (game) => game.result !== undefined && game.result !== null
    ) || false;

  // ESC 키로 모달 닫기 (편집 모드가 아닐 때만)
  useEscapeKey(onClose, !isEditMode && !showRegenerateModal);

  if (showRegenerateModal) {
    return (
      <DrawCreateModal
        scheduleId={schedule.id}
        participants={participants}
        onClose={() => setShowRegenerateModal(false)}
        onSuccess={handleRegenerateSuccess}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content draw-view-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>📋 대진표</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="draw-view-content">
          {/* 일정 정보 */}
          <div className="schedule-info-section">
            <h3>{schedule.courtName}</h3>
            <p className="schedule-datetime">
              {new Date(schedule.scheduledAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="draw-type-badge">
              대진 타입: {schedule.drawType}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">대진표를 불러오는 중...</div>
          ) : drawResult ? (
            <div className="draw-result-section">
              <div className="draw-games-list">
                {drawResult.games.map((game) => {
                  const matchId = game.matchId;
                  const scores = matchId ? matchScores.get(matchId) : undefined;
                  const hasExistingResult =
                    game.teamAScore !== undefined &&
                    game.teamBScore !== undefined;

                  // 표시할 스코어 (입력 중이면 입력값, 아니면 기존값)
                  const displayTeamAScore =
                    isEditMode && scores?.teamAScore !== undefined
                      ? scores.teamAScore
                      : game.teamAScore?.toString() || "";
                  const displayTeamBScore =
                    isEditMode && scores?.teamBScore !== undefined
                      ? scores.teamBScore
                      : game.teamBScore?.toString() || "";

                  return (
                    <div
                      key={game.gameNo}
                      className={`draw-game-card ${
                        hasExistingResult ? "has-result" : ""
                      }`}
                    >
                      <div className="game-header">
                        <span className="game-number">경기 {game.gameNo}</span>
                        <span className="round-badge">{game.roundNo}R</span>
                        {!isEditMode && hasExistingResult && (
                          <span
                            className={`result-badge ${game.result?.toLowerCase()}`}
                          >
                            {game.result === "TEAM_A_WIN"
                              ? "A 승"
                              : game.result === "TEAM_B_WIN"
                              ? "B 승"
                              : "무"}
                          </span>
                        )}
                      </div>
                      <div className="game-teams">
                        <div
                          className={`team team-a ${
                            !isEditMode && game.result === "TEAM_A_WIN"
                              ? "winner"
                              : game.result === "TEAM_B_WIN"
                              ? "loser"
                              : ""
                          }`}
                        >
                          <span className="team-label">Team A</span>
                          <div className="team-content">
                            <div className="team-players-inline">
                              {game.teamA.map((player, idx) => (
                                <span key={idx} className="player-name">
                                  {player}
                                </span>
                              ))}
                            </div>
                            {matchId && (
                              <>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="score-input-inline"
                                    value={displayTeamAScore}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        matchId,
                                        "A",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="score-display-inline">
                                    {displayTeamAScore || "-"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="vs-divider">VS</div>
                        <div
                          className={`team team-b ${
                            !isEditMode && game.result === "TEAM_B_WIN"
                              ? "winner"
                              : game.result === "TEAM_A_WIN"
                              ? "loser"
                              : ""
                          }`}
                        >
                          <span className="team-label">Team B</span>
                          <div className="team-content">
                            {matchId && (
                              <>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="score-input-inline"
                                    value={displayTeamBScore}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        matchId,
                                        "B",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="score-display-inline">
                                    {displayTeamBScore || "-"}
                                  </span>
                                )}
                              </>
                            )}
                            <div className="team-players-inline">
                              {game.teamB.map((player, idx) => (
                                <span key={idx} className="player-name">
                                  {player}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 액션 버튼 */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-copy"
              disabled={!drawResult || isEditMode}
            >
              {copied ? "✓ 복사됨" : "📋 복사"}
            </button>
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
                🔄 재생성
              </button>
            </div>
            <button
              type="button"
              onClick={handleToggleEditMode}
              className={isEditMode ? "btn-save" : "btn-edit"}
              disabled={!drawResult || saving}
            >
              {saving
                ? "저장 중..."
                : isEditMode
                ? "✓ 입력완료"
                : "✏️ 결과입력"}
            </button>
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
      </div>
    </div>
  );
};

export default DrawViewModal;
