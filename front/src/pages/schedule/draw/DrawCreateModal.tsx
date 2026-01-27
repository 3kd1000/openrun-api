import React, { useState, useEffect, useMemo } from "react";
import type { Participant } from "../../../types/schedule";
import { drawService } from "../../../services/drawService";
import type {
  DrawResponse,
  CreateDrawRequestWithIds,
} from "../../../services/drawService";
import { participantService } from "../../../services/participantService";
import { userService } from "../../../services/userService";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { validateDrawCreation } from "../../../utils/scheduleValidation";
import type { Schedule } from "../../../types/schedule";
import DrawGamesList from "../../../components/draw/DrawGamesList";
import { formatDrawAsText } from "../../../utils/DrawFormatUtils";
import Toast from "../../../components/common/Toast";
import { CheckIcon, CopyIcon } from "../../../components/common/Icons";
import "./DrawCreateModal.css";
import "./DrawViewModal.css";

interface Props {
  scheduleId: number;
  schedule: Schedule;
  participants: Participant[];
  onClose: () => void;
  onSuccess: () => void;
}

type DrawType = "AA" | "AB" | "SEED";

const DrawCreateModal: React.FC<Props> = ({
  scheduleId,
  schedule,
  participants,
  onClose,
  onSuccess,
}) => {
  // 로컬 참가자 목록 (게스트 추가 시 업데이트용)
  const [localParticipants, setLocalParticipants] =
    useState<Participant[]>(participants);

  // props가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  const confirmedUserIds = useMemo(
    () =>
      localParticipants
        .filter((p) => p.status === "CONFIRMED")
        .map((p) => p.userId),
    [localParticipants]
  );

  const [drawType, setDrawType] = useState<DrawType>("AA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDrawTypeInfo, setShowDrawTypeInfo] = useState(false);

  // 게스트 추가 상태
  const [addingGuest, setAddingGuest] = useState(false);

  // 선택된 게스트 삭제 가능 여부 (모두 게스트이고 모두 대기열에 있을 때만 true)
  const [canDeleteSelectedGuests, setCanDeleteSelectedGuests] = useState(false);

  // AA 타입: 참가/대기
  const [confirmedGroup, setConfirmedGroup] = useState<number[]>([]);
  const [waitingGroup, setWaitingGroup] = useState<number[]>([]);

  // AB 타입: 그룹 A/B
  const [groupA, setGroupA] = useState<number[]>([]);
  const [groupB, setGroupB] = useState<number[]>([]);

  // SEED 타입: 시드/일반
  const [seedPlayers, setSeedPlayers] = useState<number[]>([]);
  const [normalPlayers, setNormalPlayers] = useState<number[]>([]);

  // 체크박스 선택 상태
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // 대진 생성 결과
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // userId로 userName 가져오기
  const getUserName = (userId: number): string => {
    const participant = localParticipants.find((p) => p.userId === userId);
    return participant?.userName || `User #${userId}`;
  };

  // 게스트 추가 핸들러
  const handleAddGuest = async () => {
    try {
      setAddingGuest(true);
      setError("");

      // 게스트 사용자 목록 조회 (매번 호출)
      const guestUsers = await userService.getGuestUsers();

      // 현재 참가자 중 게스트 사용자 찾기
      const currentParticipantIds = localParticipants.map((p) => p.userId);
      const usedGuestIds = new Set(
        guestUsers
          .filter((g) => currentParticipantIds.includes(g.id))
          .map((g) => g.id)
      );

      // 아직 추가되지 않은 첫 번째 게스트 찾기
      const nextGuest = guestUsers.find((g) => !usedGuestIds.has(g.id));

      if (!nextGuest) {
        setError("더 이상 추가할 수 있는 게스트가 없습니다. (최대 16명)");
        return;
      }

      // 게스트를 일정에 추가 (대기열 상태로)
      await participantService.joinSchedule(scheduleId, nextGuest.id);

      // 참가자 목록 다시 가져오기 (모달은 열린 상태 유지)
      const updatedParticipants = await participantService.getParticipants(
        scheduleId
      );
      setLocalParticipants(updatedParticipants);

      console.log(`✅ ${nextGuest.name} 추가 완료`);
    } catch (err: unknown) {
      console.error("게스트 추가 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "게스트 추가에 실패했습니다.");
    } finally {
      setAddingGuest(false);
    }
  };

  // 선택된 게스트들 삭제 핸들러
  const handleRemoveSelectedGuests = async () => {
    if (!canDeleteSelectedGuests || selectedUsers.length === 0) {
      return;
    }

    const guestCount = selectedUsers.length; // 삭제 전 개수 저장

    try {
      setError("");
      setLoading(true);

      // 선택된 모든 게스트 삭제
      await Promise.all(
        selectedUsers.map((userId) =>
          participantService.cancelParticipation(scheduleId, userId)
        )
      );

      // 참가자 목록 다시 가져오기
      const updatedParticipants = await participantService.getParticipants(
        scheduleId
      );
      setLocalParticipants(updatedParticipants);

      // 선택 초기화
      setSelectedUsers([]);

      console.log(`✅ ${guestCount}명의 게스트 삭제 완료`);
    } catch (err: unknown) {
      console.error("게스트 삭제 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "게스트 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // SEED 타입의 시드 수 계산
  const getSeedCount = (total: number): number => {
    if (total >= 6 && total <= 8) return 2;
    if (total >= 9 && total <= 10) return 3;
    if (total >= 11 && total <= 13) return 4;
    if (total === 14 || total === 15) return 5;
    if (total === 16) return 6;
    return 0;
  };

  // 대진 타입 변경 시 초기화
  useEffect(() => {
    const totalCount = confirmedUserIds.length;
    const half = Math.ceil(totalCount / 2);
    const allParticipantIds = localParticipants.map((p) => p.userId);
    const waitingIds = allParticipantIds.filter(
      (id) => !confirmedUserIds.includes(id)
    );

    if (drawType === "AA") {
      // AA: 참가 확정자는 confirmedGroup, 나머지는 waitingGroup
      setConfirmedGroup(confirmedUserIds);
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setSeedPlayers([]);
      setNormalPlayers([]);
    } else if (drawType === "AB") {
      // AB: 반반 나누기 + 대기열
      setGroupA(confirmedUserIds.slice(0, half));
      setGroupB(confirmedUserIds.slice(half));
      setWaitingGroup(waitingIds);
      setSeedPlayers([]);
      setNormalPlayers([]);
      setConfirmedGroup([]);
    } else if (drawType === "SEED") {
      // SEED: 시드 수에 맞춰 분할 + 대기열
      const seedCount = getSeedCount(totalCount);
      setSeedPlayers(confirmedUserIds.slice(0, seedCount));
      setNormalPlayers(confirmedUserIds.slice(seedCount));
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setConfirmedGroup([]);
    }
  }, [drawType, localParticipants, confirmedUserIds]);

  // 선택된 사용자들이 모두 게스트이고 모두 대기열에 있는지 확인
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setCanDeleteSelectedGuests(false);
      return;
    }

    // 선택된 사용자가 모두 게스트인지 확인
    const allAreGuests = selectedUsers.every((userId) => {
      const participant = localParticipants.find((p) => p.userId === userId);
      return participant ? participant.userName.startsWith("게스트") : false;
    });

    // 선택된 사용자가 모두 대기열에 있는지 확인
    const allInWaitingGroup = selectedUsers.every((userId) =>
      waitingGroup.includes(userId)
    );

    // 두 조건을 모두 만족하면 게스트 삭제 가능
    setCanDeleteSelectedGuests(allAreGuests && allInWaitingGroup);
  }, [selectedUsers, waitingGroup, localParticipants]);

  // 체크박스 토글
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // AA: 선택된 사용자들을 참가/대기열로 이동
  const moveSelectedToAAGroup = (targetGroup: "CONFIRMED" | "WAITING") => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === "CONFIRMED") {
      const newConfirmedGroup = [
        ...confirmedGroup,
        ...selectedUsers.filter((id) => !confirmedGroup.includes(id)),
      ];
      const newWaitingGroup = waitingGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setConfirmedGroup(newConfirmedGroup);
      setWaitingGroup(newWaitingGroup);
    } else {
      const newWaitingGroup = [
        ...waitingGroup,
        ...selectedUsers.filter((id) => !waitingGroup.includes(id)),
      ];
      const newConfirmedGroup = confirmedGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setWaitingGroup(newWaitingGroup);
      setConfirmedGroup(newConfirmedGroup);
    }
    setSelectedUsers([]);
  };

  // AB: 선택된 사용자들을 그룹으로 이동 (A, B, 대기열)
  const moveSelectedToABGroup = (targetGroup: "A" | "B" | "WAITING") => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === "A") {
      const newGroupA = [
        ...groupA,
        ...selectedUsers.filter((id) => !groupA.includes(id)),
      ];
      const newGroupB = groupB.filter((id) => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setGroupA(newGroupA);
      setGroupB(newGroupB);
      setWaitingGroup(newWaitingGroup);
    } else if (targetGroup === "B") {
      const newGroupB = [
        ...groupB,
        ...selectedUsers.filter((id) => !groupB.includes(id)),
      ];
      const newGroupA = groupA.filter((id) => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setGroupA(newGroupA);
      setGroupB(newGroupB);
      setWaitingGroup(newWaitingGroup);
    } else {
      // WAITING
      const newWaitingGroup = [
        ...waitingGroup,
        ...selectedUsers.filter((id) => !waitingGroup.includes(id)),
      ];
      const newGroupA = groupA.filter((id) => !selectedUsers.includes(id));
      const newGroupB = groupB.filter((id) => !selectedUsers.includes(id));
      setWaitingGroup(newWaitingGroup);
      setGroupA(newGroupA);
      setGroupB(newGroupB);
    }
    setSelectedUsers([]);
  };

  // SEED: 선택된 사용자들을 시드/일반/대기열로 이동
  const moveSelectedToSeedGroup = (
    targetGroup: "SEED" | "NORMAL" | "WAITING"
  ) => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === "SEED") {
      const newSeedPlayers = [
        ...seedPlayers,
        ...selectedUsers.filter((id) => !seedPlayers.includes(id)),
      ];
      const newNormalPlayers = normalPlayers.filter(
        (id) => !selectedUsers.includes(id)
      );
      const newWaitingGroup = waitingGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setSeedPlayers(newSeedPlayers);
      setNormalPlayers(newNormalPlayers);
      setWaitingGroup(newWaitingGroup);
    } else if (targetGroup === "NORMAL") {
      const newNormalPlayers = [
        ...normalPlayers,
        ...selectedUsers.filter((id) => !normalPlayers.includes(id)),
      ];
      const newSeedPlayers = seedPlayers.filter(
        (id) => !selectedUsers.includes(id)
      );
      const newWaitingGroup = waitingGroup.filter(
        (id) => !selectedUsers.includes(id)
      );
      setNormalPlayers(newNormalPlayers);
      setSeedPlayers(newSeedPlayers);
      setWaitingGroup(newWaitingGroup);
    } else {
      // WAITING
      const newWaitingGroup = [
        ...waitingGroup,
        ...selectedUsers.filter((id) => !waitingGroup.includes(id)),
      ];
      const newSeedPlayers = seedPlayers.filter(
        (id) => !selectedUsers.includes(id)
      );
      const newNormalPlayers = normalPlayers.filter(
        (id) => !selectedUsers.includes(id)
      );
      setWaitingGroup(newWaitingGroup);
      setSeedPlayers(newSeedPlayers);
      setNormalPlayers(newNormalPlayers);
    }
    setSelectedUsers([]);
  };

  // 대진 생성 (또는 재생성)
  const handleCreateDraw = async () => {
    // 과거 일정 체크
    const validation = validateDrawCreation(schedule.scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "대진 생성에 실패했습니다.");
      return;
    }

    // 최대 인원수 검증
    let totalPlayers = 0;
    if (drawType === "AA") {
      totalPlayers = confirmedGroup.length;
    } else if (drawType === "AB") {
      totalPlayers = groupA.length + groupB.length;
    } else {
      // drawType === "SEED"
      totalPlayers = seedPlayers.length + normalPlayers.length;
    }

    if (totalPlayers > schedule.maxCapacity) {
      setToastMessage(
        `최대 인원수(${schedule.maxCapacity}명)를 초과했습니다. 현재 선택된 인원: ${totalPlayers}명`
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // userId 기반으로 대진 생성 (동명이인 문제 해결)
      let requestWithIds: CreateDrawRequestWithIds;
      if (drawType === "AA") {
        requestWithIds = {
          drawType,
          numberOfTotalPlayer: confirmedGroup.length,
          userIds: confirmedGroup,
          seedUserIds: [],
          groupAUserIds: [],
          groupBUserIds: [],
        };
      } else if (drawType === "AB") {
        requestWithIds = {
          drawType,
          numberOfTotalPlayer: groupA.length + groupB.length,
          userIds: [...groupA, ...groupB],
          groupAUserIds: groupA,
          groupBUserIds: groupB,
          seedUserIds: [],
        };
      } else {
        // drawType === "SEED"
        requestWithIds = {
          drawType,
          numberOfTotalPlayer: seedPlayers.length + normalPlayers.length,
          userIds: normalPlayers,
          seedUserIds: seedPlayers,
          groupAUserIds: [],
          groupBUserIds: [],
        };
      }

      const result = await drawService.createDrawWithScheduleByIds(
        scheduleId,
        requestWithIds
      );
      setDrawResult(result);
    } catch (err: unknown) {
      console.error("대진 생성 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "대진 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      const text = formatDrawAsText(drawResult, {
        title: "🎯 대진표",
        drawType: drawType,
        playerCount: totalSelected,
      });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  // 현재 선택된 총 인원
  const totalSelected =
    drawType === "AA"
      ? confirmedGroup.length
      : drawType === "AB"
      ? groupA.length + groupB.length
      : seedPlayers.length + normalPlayers.length;

  // 유효성 검사
  const isValid = (() => {
    // 공통: 최대 16명
    if (totalSelected > 16) return false;

    if (drawType === "AA") {
      // AA: 최소 4명, 최대 16명, 홀짝 무관
      return totalSelected >= 4 && confirmedGroup.length >= 4;
    } else if (drawType === "AB") {
      // AB: 최소 8명, 최대 16명, 짝수만, A/B 그룹 비어있지 않아야 함
      return (
        totalSelected >= 8 &&
        totalSelected % 2 === 0 &&
        groupA.length > 0 &&
        groupB.length > 0
      );
    } else if (drawType === "SEED") {
      // SEED: 최소 6명, 최대 16명, 홀짝 무관, seed/normal 비어있지 않고 seed 수가 맞아야 함
      return (
        totalSelected >= 6 &&
        seedPlayers.length > 0 &&
        normalPlayers.length > 0 &&
        seedPlayers.length === getSeedCount(totalSelected)
      );
    }

    return false;
  })();

  // ESC 키로 모달 닫기
  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content draw-create-modal modal-nested-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>대진 생성</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="draw-create-content">
          {error && <div className="error-message">{error}</div>}

          {/* 대진 타입 선택 */}
          <div className="form-group">
            <div className="draw-type-header">
              <label>대진 타입</label>
              <button
                type="button"
                className="btn-toggle-info"
                onClick={() => setShowDrawTypeInfo(!showDrawTypeInfo)}
                title={showDrawTypeInfo ? "설명 닫기" : "설명 보기"}
              >
                {showDrawTypeInfo ? "▲" : "▼"}
              </button>
            </div>
            <div className="draw-type-buttons">
              <button
                type="button"
                className={`draw-type-btn ${drawType === "AA" ? "active" : ""}`}
                onClick={() => setDrawType("AA")}
              >
                AA (랜덤)
              </button>
              <button
                type="button"
                className={`draw-type-btn ${drawType === "AB" ? "active" : ""}`}
                onClick={() => setDrawType("AB")}
                disabled={localParticipants.length < 8}
                title={localParticipants.length < 8 ? "8인 이상일 때 사용 가능" : undefined}
              >
                AB (그룹별)
              </button>
              <button
                type="button"
                className={`draw-type-btn ${
                  drawType === "SEED" ? "active" : ""
                }`}
                onClick={() => setDrawType("SEED")}
                disabled={localParticipants.length < 6}
                title={localParticipants.length < 6 ? "6인 이상일 때 사용 가능" : undefined}
              >
                SEED (시드)
              </button>
            </div>

            {/* 대진 타입 설명 (아코디언) */}
            {showDrawTypeInfo && (
              <div className="draw-type-info">
                {drawType === "AA" && (
                  <>
                    <p className="info-description">
                      매 라운드마다 파트너가 바뀌며 다양한 조합으로 경기
                    </p>
                    <p className="info-players">참가 인원: 4~16명</p>
                  </>
                )}
                {drawType === "AB" && (
                  <>
                    <p className="info-description">
                      A/B 그룹으로 나눠 함께 파트너가 될 수 있도록 합니다.
                    </p>
                    <p className="info-players">
                      참가 인원: 8, 10, 12, 14, 16명 (그룹별 동일 인원)
                    </p>
                  </>
                )}
                {drawType === "SEED" && (
                  <>
                    <p className="info-description">
                      시드 플레이어 끼리는 같은 팀으로 배정되지 않습니다.
                    </p>
                    <p className="info-players">
                      참가 인원: 6~16명 (시드 개수는 총 인원에 따라 변동)
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* AA 타입: 참가자/대기열 관리 */}
          {drawType === "AA" && (
            <>
              <div className="move-buttons">
                <button
                  type="button"
                  onClick={() => moveSelectedToAAGroup("CONFIRMED")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  참가로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToAAGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  대기열로 이동
                </button>
                {canDeleteSelectedGuests ? (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="btn-move-group btn-danger"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="btn-move-group"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </button>
                )}
              </div>

              <div className="group-division">
                <div className="group-box confirmed-group">
                  <h4>참가 확정 ({confirmedGroup.length}명)</h4>
                  <div className="player-grid">
                    {confirmedGroup.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AB 타입: 그룹 A/B 분할 */}
          {drawType === "AB" && (
            <>
              <div
                className="move-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup("A")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  A로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup("B")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  B로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group btn-move-waiting"
                >
                  대기로 이동
                </button>
                {canDeleteSelectedGuests ? (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="btn-move-group btn-danger"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="btn-move-group"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </button>
                )}
              </div>

              <div className="group-division group-division-ab">
                <div className="group-box group-a">
                  <h4>그룹 A ({groupA.length}명)</h4>
                  <div className="player-grid">
                    {groupA.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box group-b">
                  <h4>그룹 B ({groupB.length}명)</h4>
                  <div className="player-grid">
                    {groupB.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group waiting-group-full">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SEED 타입: 시드/일반 분할 */}
          {drawType === "SEED" && (
            <>
              <div
                className="move-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup("SEED")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  시드로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup("NORMAL")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  일반으로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group btn-move-waiting"
                >
                  대기로 이동
                </button>
                {canDeleteSelectedGuests ? (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="btn-move-group btn-danger"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="btn-move-group"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </button>
                )}
              </div>

              <div className="group-division group-division-seed">
                <div className="group-box seed-group">
                  <h4>
                    시드 플레이어 ({seedPlayers.length}/
                    {getSeedCount(seedPlayers.length + normalPlayers.length)}명)
                  </h4>
                  <div className="player-grid">
                    {seedPlayers.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox seed ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box normal-group">
                  <h4>일반 플레이어 ({normalPlayers.length}명)</h4>
                  <div className="player-grid">
                    {normalPlayers.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group waiting-group-full">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map((userId) => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${
                          selectedUsers.includes(userId) ? "selected" : ""
                        }`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 대진 생성 결과 */}
          {drawResult && (
            <div className="draw-result-section">
              <DrawGamesList games={drawResult.games} playerCount={totalSelected} />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="modal-actions">
            {!drawResult ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(); // 부모 갱신
                    onClose();
                  }}
                  className="btn-secondary"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreateDraw}
                  className="btn-primary"
                  disabled={loading || !isValid}
                >
                  {loading ? "생성 중..." : "대진 생성"}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleCopy} className="btn-copy">
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
                <button
                  type="button"
                  onClick={handleCreateDraw}
                  className="btn-regenerate"
                  disabled={loading}
                >
                  🔄 재생성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="btn-primary"
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default DrawCreateModal;
