import React, { useState, useEffect, useMemo } from "react";
import type { Participant } from "../../../types/schedule";
import { drawService } from "../../../services/drawService";
import type {
  DrawResponse,
  CreateDrawRequestWithIds,
  ManualGame,
} from "../../../services/drawService";
import { participantService } from "../../../services/participantService";
import { userService } from "../../../services/userService";
import { validateDrawCreation } from "../../../utils/scheduleValidation";
import type { Schedule } from "../../../types/schedule";
import DrawGamesList from "../../../components/draw/DrawGamesList";
import ManualDrawEditor from "../../../components/draw/ManualDrawEditor";
import { formatDrawAsText } from "../../../utils/DrawFormatUtils";
import Toast from "../../../components/common/Toast";
import { CheckIcon, CopyIcon } from "../../../components/common/Icons";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";

interface Props {
  scheduleId: number;
  schedule: Schedule;
  participants: Participant[];
  onClose: () => void;
  onSuccess: () => void;
}

type DrawType = "AA" | "AB" | "SEED" | "MANUAL";

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
      setConfirmedGroup(confirmedUserIds);
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setSeedPlayers([]);
      setNormalPlayers([]);
    } else if (drawType === "AB") {
      setGroupA(confirmedUserIds.slice(0, half));
      setGroupB(confirmedUserIds.slice(half));
      setWaitingGroup(waitingIds);
      setSeedPlayers([]);
      setNormalPlayers([]);
      setConfirmedGroup([]);
    } else if (drawType === "SEED") {
      const seedCount = getSeedCount(totalCount);
      setSeedPlayers(confirmedUserIds.slice(0, seedCount));
      setNormalPlayers(confirmedUserIds.slice(seedCount));
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setConfirmedGroup([]);
    } else if (drawType === "MANUAL") {
      setConfirmedGroup(confirmedUserIds);
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setSeedPlayers([]);
      setNormalPlayers([]);
    }
  }, [drawType, localParticipants, confirmedUserIds]);

  // 선택된 사용자들이 모두 게스트이고 모두 대기열에 있는지 확인
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setCanDeleteSelectedGuests(false);
      return;
    }

    const allAreGuests = selectedUsers.every((userId) => {
      const participant = localParticipants.find((p) => p.userId === userId);
      return participant ? participant.userName.startsWith("게스트") : false;
    });

    const allInWaitingGroup = selectedUsers.every((userId) =>
      waitingGroup.includes(userId)
    );

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
    const validation = validateDrawCreation(schedule.scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "대진 생성에 실패했습니다.");
      return;
    }

    let totalPlayers = 0;
    if (drawType === "AA") {
      totalPlayers = confirmedGroup.length;
    } else if (drawType === "AB") {
      totalPlayers = groupA.length + groupB.length;
    } else {
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

  // MANUAL 대진 생성 완료 핸들러
  const handleManualDrawComplete = async (manualGames: ManualGame[]) => {
    const validation = validateDrawCreation(schedule.scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "대진 생성에 실패했습니다.");
      return;
    }

    try {
      setLoading(true);
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

      const result = await drawService.createDrawWithScheduleByIds(
        scheduleId,
        requestWithIds
      );
      setDrawResult(result);
    } catch (err: unknown) {
      console.error("수동 대진 생성 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "수동 대진 생성에 실패했습니다.");
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
        numberOfCourts: schedule.numberOfCourts,
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
    drawType === "AA" || drawType === "MANUAL"
      ? confirmedGroup.length
      : drawType === "AB"
      ? groupA.length + groupB.length
      : seedPlayers.length + normalPlayers.length;

  // 유효성 검사
  const isValid = (() => {
    if (totalSelected > 16) return false;

    if (drawType === "AA") {
      return totalSelected >= 4 && confirmedGroup.length >= 4;
    } else if (drawType === "AB") {
      return (
        totalSelected >= 8 &&
        totalSelected % 2 === 0 &&
        groupA.length > 0 &&
        groupB.length > 0
      );
    } else if (drawType === "SEED") {
      return (
        totalSelected >= 6 &&
        seedPlayers.length > 0 &&
        normalPlayers.length > 0 &&
        seedPlayers.length === getSeedCount(totalSelected)
      );
    } else if (drawType === "MANUAL") {
      return confirmedGroup.length >= 4;
    }

    return false;
  })();

  // 플레이어 카드 렌더링 헬퍼
  const renderPlayerCard = (userId: number, variant: "" | "seed" | "waiting" = "") => {
    const isSelected = selectedUsers.includes(userId);
    return (
      <div
        key={userId}
        className={cn(
          "p-1 bg-background rounded-sm border border-border text-xs font-medium text-foreground",
          "flex items-center gap-1 cursor-pointer transition-all min-[769px]:text-sm",
          "hover:bg-muted hover:-translate-y-px hover:shadow-md",
          isSelected && variant === "" && "bg-primary/10 border-primary",
          variant === "seed" && !isSelected && "bg-[var(--color-seed-bg)] font-semibold border-[var(--color-seed-light)]",
          variant === "seed" && isSelected && "bg-[var(--color-seed-light)] border-[var(--color-seed)] font-semibold",
          variant === "waiting" && !isSelected && "bg-[var(--color-warning-light)] border-[var(--color-warning)]",
          variant === "waiting" && isSelected && "bg-[var(--color-warning-bg)] border-[var(--color-warning-hover)]"
        )}
        onClick={() => toggleUserSelection(userId)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleUserSelection(userId)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <span className="flex-1 select-none overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
          {getUserName(userId)}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>대진 생성 (한울방식)</DialogTitle>
        </DialogHeader>

        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto min-h-0 max-[768px]:p-3">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          {/* 대진 타입 선택 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label>대진 타입</label>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowDrawTypeInfo(!showDrawTypeInfo)}
                title={showDrawTypeInfo ? "설명 닫기" : "설명 보기"}
              >
                {showDrawTypeInfo ? "▲" : "▼"}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1 max-[768px]:grid-cols-2">
              <Button
                variant={drawType === "AA" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawType("AA")}
              >
                AA (랜덤)
              </Button>
              <Button
                variant={drawType === "AB" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawType("AB")}
                disabled={localParticipants.length < 8}
                title={localParticipants.length < 8 ? "8인 이상일 때 사용 가능" : undefined}
              >
                AB (그룹별)
              </Button>
              <Button
                variant={drawType === "SEED" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawType("SEED")}
                disabled={localParticipants.length < 6}
                title={localParticipants.length < 6 ? "6인 이상일 때 사용 가능" : undefined}
              >
                SEED (시드)
              </Button>
              <Button
                variant={drawType === "MANUAL" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawType("MANUAL")}
                disabled={localParticipants.length < 4}
                title={localParticipants.length < 4 ? "4인 이상일 때 사용 가능" : undefined}
              >
                수동
              </Button>
            </div>

            {/* 대진 타입 설명 (아코디언) */}
            {showDrawTypeInfo && (
              <div className="mt-2 p-3 bg-primary/5 border-l-[3px] border-l-primary rounded-md animate-[slideDown_0.2s_ease-out]">
                {drawType === "AA" && (
                  <>
                    <p className="mb-1 text-sm font-medium text-foreground leading-relaxed">
                      매 라운드마다 파트너가 바뀌며 다양한 조합으로 경기
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">참가 인원: 4~16명</p>
                  </>
                )}
                {drawType === "AB" && (
                  <>
                    <p className="mb-1 text-sm font-medium text-foreground leading-relaxed">
                      A/B 그룹으로 나눠 함께 파트너가 될 수 있도록 합니다.
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      참가 인원: 8, 10, 12, 14, 16명 (그룹별 동일 인원)
                    </p>
                  </>
                )}
                {drawType === "SEED" && (
                  <>
                    <p className="mb-1 text-sm font-medium text-foreground leading-relaxed">
                      시드 플레이어 끼리는 같은 팀으로 배정되지 않습니다.
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      참가 인원: 6~16명 (시드 개수는 총 인원에 따라 변동)
                    </p>
                  </>
                )}
                {drawType === "MANUAL" && (
                  <>
                    <p className="mb-1 text-sm font-medium text-foreground leading-relaxed">
                      각 게임별로 4명의 선수를 직접 지정합니다.
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      참가 인원: 4~16명
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* AA 타입: 참가자/대기열 관리 */}
          {drawType === "AA" && (
            <>
              <div className="flex gap-2 mb-3 max-[768px]:gap-1 max-[768px]:mb-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToAAGroup("CONFIRMED")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  참가로 이동
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToAAGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  대기열로 이동
                </Button>
                {canDeleteSelectedGuests ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="flex-1"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="flex-1"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-3 items-stretch flex-[2] min-h-0 overflow-hidden">
                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-green-600 bg-green-50 min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">참가 확정 ({confirmedGroup.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {confirmedGroup.map((userId) => renderPlayerCard(userId))}
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">대기열 ({waitingGroup.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {waitingGroup.map((userId) => renderPlayerCard(userId, "waiting"))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AB 타입: 그룹 A/B 분할 */}
          {drawType === "AB" && (
            <>
              <div className="flex gap-2 mb-3 max-[768px]:gap-1 max-[768px]:mb-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToABGroup("A")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  A로 이동
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToABGroup("B")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  B로 이동
                </Button>
                <Button
                  size="sm"
                  onClick={() => moveSelectedToABGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  대기로 이동
                </Button>
                {canDeleteSelectedGuests ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="flex-1"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="flex-1"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-[#007bff] bg-[#e3f2fd] min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">그룹 A ({groupA.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {groupA.map((userId) => renderPlayerCard(userId))}
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-[#e91e63] bg-[#fce4ec] min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">그룹 B ({groupB.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {groupB.map((userId) => renderPlayerCard(userId))}
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">대기열 ({waitingGroup.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {waitingGroup.map((userId) => renderPlayerCard(userId, "waiting"))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SEED 타입: 시드/일반 분할 */}
          {drawType === "SEED" && (
            <>
              <div className="flex gap-2 mb-3 max-[768px]:gap-1 max-[768px]:mb-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToSeedGroup("SEED")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  시드로 이동
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => moveSelectedToSeedGroup("NORMAL")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  일반으로 이동
                </Button>
                <Button
                  size="sm"
                  onClick={() => moveSelectedToSeedGroup("WAITING")}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  대기로 이동
                </Button>
                {canDeleteSelectedGuests ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelectedGuests}
                    disabled={loading || selectedUsers.length === 0}
                    className="flex-1"
                  >
                    {loading ? "삭제 중..." : "게스트 삭제"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddGuest}
                    disabled={addingGuest}
                    className="flex-1"
                  >
                    {addingGuest ? "추가 중..." : "게스트 추가"}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-[#9c27b0] bg-[#f3e5f5] min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">
                    시드 플레이어 ({seedPlayers.length}/
                    {getSeedCount(seedPlayers.length + normalPlayers.length)}명)
                  </div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {seedPlayers.map((userId) => renderPlayerCard(userId, "seed"))}
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-primary bg-primary/5 min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">일반 플레이어 ({normalPlayers.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {normalPlayers.map((userId) => renderPlayerCard(userId))}
                  </div>
                </div>

                <div className="flex-1 p-3 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 min-h-0 max-h-full flex flex-col overflow-hidden transition-all hover:border-primary hover:bg-primary/5 max-[768px]:max-h-[280px] max-[768px]:overflow-y-auto max-[768px]:shrink-0">
                  <div className="text-xs font-bold text-muted-foreground mb-3 text-center shrink-0">대기열 ({waitingGroup.length}명)</div>
                  <div className="grid grid-cols-4 gap-2 content-start max-[359px]:gap-1 flex-1 overflow-y-auto min-h-0">
                    {waitingGroup.map((userId) => renderPlayerCard(userId, "waiting"))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MANUAL 타입: 수동 대진 편집기 */}
          {drawType === "MANUAL" && !drawResult && (
            <ManualDrawEditor
              participants={localParticipants}
              playerCount={confirmedGroup.length}
              numberOfCourts={schedule.numberOfCourts}
              onComplete={handleManualDrawComplete}
            />
          )}

          {/* 대진 생성 결과 */}
          {drawResult && (
            <div className="flex-[0_0_auto] max-h-[35vh] flex flex-col min-h-0 max-[768px]:mt-3 max-[768px]:pt-3 max-[768px]:border-t-2 max-[768px]:border-border max-[768px]:shrink-0">
              <DrawGamesList games={drawResult.games} playerCount={totalSelected} numberOfCourts={schedule.numberOfCourts} />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 mt-auto pt-3 border-t shrink-0 bg-background sticky bottom-0 z-10 max-[768px]:gap-1 max-[768px]:pt-[10px]">
            {!drawResult && drawType !== "MANUAL" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateDraw}
                  disabled={loading || !isValid}
                  className="flex-1"
                >
                  {loading ? "생성 중..." : "대진 생성"}
                </Button>
              </>
            ) : !drawResult && drawType === "MANUAL" ? (
              <Button
                variant="outline"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  className="flex-1"
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
                </Button>
                <Button
                  onClick={handleCreateDraw}
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  재생성
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="flex-1"
                >
                  확인
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </Dialog>
  );
};

export default DrawCreateModal;
