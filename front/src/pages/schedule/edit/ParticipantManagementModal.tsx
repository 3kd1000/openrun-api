import React, { useState, useMemo } from "react";
import type { Participant, Schedule } from "../../../types/schedule";
import type { UserResponse } from "../../../services/userService";
import { participantService } from "../../../services/participantService";
import { getOpenRunSession } from "../../../utils/openrunSession";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";

interface Props {
  scheduleId: number;
  schedule: Schedule;
  currentParticipants: Participant[];
  clubMembers: UserResponse[];
  onClose: () => void;
  onSuccess: () => void;
}

const ParticipantManagementModal: React.FC<Props> = ({
  scheduleId,
  schedule,
  currentParticipants,
  clubMembers,
  onClose,
  onSuccess,
}) => {
  const currentParticipantIds = useMemo(() => {
    return new Set(currentParticipants.filter((p) => p.userId != null).map((p) => p.userId!));
  }, [currentParticipants]);

  const currentConfirmedCount = useMemo(() => {
    return currentParticipants.filter((p) => p.status === "CONFIRMED").length;
  }, [currentParticipants]);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(currentParticipantIds)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [newGuestName, setNewGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);

  const getExpectedStatus = (userId: number): "CONFIRMED" | "WAITING" => {
    if (currentParticipantIds.has(userId)) {
      const current = currentParticipants.find((p) => p.userId === userId);
      return current?.status === "CONFIRMED" ? "CONFIRMED" : "WAITING";
    }

    const newSelectedCount = Array.from(selectedUserIds).filter(
      (id) => !currentParticipantIds.has(id)
    ).length;

    const availableSlots = schedule.maxCapacity - currentConfirmedCount;
    const newConfirmedCount = Math.min(newSelectedCount, availableSlots);

    const newSelectedList = Array.from(selectedUserIds)
      .filter((id) => !currentParticipantIds.has(id))
      .sort((a, b) => a - b);
    const index = newSelectedList.indexOf(userId);

    return index < newConfirmedCount ? "CONFIRMED" : "WAITING";
  };

  const handleToggle = (userId: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      const session = getOpenRunSession();
      if (!session.userId) {
        throw new Error("로그인이 필요합니다.");
      }

      await participantService.bulkUpdateParticipants(
        scheduleId,
        Array.from(selectedUserIds)
      );

      onSuccess();
    } catch (err: unknown) {
      console.error("참가자 수정 실패:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "참가자 수정에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) return;
    try {
      setAddingGuest(true);
      setError("");
      const sess = getOpenRunSession();
      if (!sess.userId) return;
      const added = await participantService.addGuestParticipant(scheduleId, newGuestName.trim());
      setLocalGuests((prev) => [...prev, added]);
      markGuestChanged();
      setNewGuestName("");
    } catch (err: unknown) {
      console.error("게스트 추가 실패:", err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || "게스트 추가에 실패했습니다.");
    } finally {
      setAddingGuest(false);
    }
  };

  const isChanged = useMemo(() => {
    if (selectedUserIds.size !== currentParticipantIds.size) return true;
    const selectedArray = Array.from(selectedUserIds).sort();
    const currentArray = Array.from(currentParticipantIds).sort();
    return JSON.stringify(selectedArray) !== JSON.stringify(currentArray);
  }, [selectedUserIds, currentParticipantIds]);

  const expectedStats = useMemo(() => {
    const newSelected = Array.from(selectedUserIds).filter(
      (id) => !currentParticipantIds.has(id)
    );
    const availableSlots = schedule.maxCapacity - currentConfirmedCount;
    const newConfirmed = Math.min(newSelected.length, availableSlots);
    const newWaiting = newSelected.length - newConfirmed;

    return {
      confirmed: currentConfirmedCount + newConfirmed,
      waiting:
        currentParticipants.filter((p) => p.status === "WAITING").length +
        newWaiting,
      total: selectedUserIds.size,
    };
  }, [
    selectedUserIds,
    currentConfirmedCount,
    currentParticipants,
    schedule.maxCapacity,
    currentParticipantIds,
  ]);

  // 게스트 참가자 로컬 상태 (추가/삭제 시 모달 닫지 않고 즉시 반영)
  const [localGuests, setLocalGuests] = useState<Participant[]>(
    currentParticipants.filter((p) => p.userId === null)
  );
  const [guestChanged, setGuestChanged] = useState(false);
  const isPublicSchedule = schedule.clubId === null;

  // 게스트 변경 추적
  const markGuestChanged = () => setGuestChanged(true);

  // 모달 닫을 때 게스트 변경이 있었으면 부모 새로고침
  const handleClose = () => {
    if (guestChanged) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
      <DialogContent className="max-w-[600px] w-[95vw] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>참가자 수정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-3">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm shrink-0">{error}</div>
          )}

          {/* 정원 정보 - 항상 2x2 */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-gradient-to-br from-[#f5f7fa] to-[#e8ecf1] rounded-md border shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">정원:</span>
              <span className="text-xs font-medium text-foreground">{schedule.maxCapacity}명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">현재 확정:</span>
              <span className="text-xs font-medium text-foreground">{currentConfirmedCount}명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">예상 확정:</span>
              <span className="text-xs font-medium text-foreground">{expectedStats.confirmed}명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">예상 대기:</span>
              <span className="text-xs font-medium text-foreground">{expectedStats.waiting}명</span>
            </div>
          </div>

          {/* 클럽 회원 체크박스 목록 (공개 일정이 아닐 때만 표시) */}
          {!isPublicSchedule && (
            <div className="flex flex-col gap-1 min-h-0 flex-1">
              <span className="text-sm font-medium text-foreground shrink-0">클럽 회원</span>
              <div
                className={cn(
                  "flex flex-col gap-1 flex-1 min-h-0",
                  "overflow-y-auto p-1 border rounded-md bg-background",
                  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-track]:rounded",
                  "[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded",
                  "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground"
                )}
              >
                {clubMembers.map((member) => {
                  const isCurrentParticipant = currentParticipantIds.has(member.id);
                  const expectedStatus = getExpectedStatus(member.id);
                  const isSelected = selectedUserIds.has(member.id);

                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 py-2.5 px-3 rounded-md cursor-pointer transition-all border border-transparent bg-background shrink-0",
                        "max-[425px]:py-1.5 max-[425px]:px-2 max-[425px]:gap-1.5",
                        isCurrentParticipant
                          ? "bg-gradient-to-r from-[#eff6ff] to-[#dbeafe] border-[#3b82f6] hover:from-[#dbeafe] hover:to-[#bfdbfe]"
                          : isSelected
                            ? "hover:bg-muted hover:border-border hover:translate-x-0.5"
                            : "",
                        !isSelected && "opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(member.id)}
                        disabled={loading}
                      />
                      <span className="flex-1 text-sm text-foreground min-w-0">{member.name}</span>
                      {isCurrentParticipant && (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-xs font-normal">
                          현재 참가자
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge
                          className={cn(
                            "text-xs font-normal",
                            expectedStatus === "CONFIRMED"
                              ? "bg-emerald-600 text-white hover:bg-emerald-600"
                              : "bg-amber-500 text-white hover:bg-amber-500"
                          )}
                        >
                          {expectedStatus === "CONFIRMED" ? "확정" : "대기"}
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 게스트 참가자 */}
          <div className="flex flex-col gap-2 shrink-0 pt-3 border-t">
            <span className="text-sm font-medium text-foreground shrink-0">게스트 참가자</span>

            {/* 기존 게스트 목록 */}
            {localGuests.length > 0 && (
              <div className="flex flex-col gap-1.5 overflow-y-auto min-h-0 flex-1">
                {localGuests.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-md shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{guest.guestName || guest.userName}</span>
                      <Badge variant="outline" className="text-[10px]">게스트</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-700 h-7"
                      onClick={async () => {
                        const sess = getOpenRunSession();
                        if (!sess.userId) return;
                        try {
                          await participantService.removeGuestParticipant(scheduleId, guest.id);
                          setLocalGuests((prev) => prev.filter((g) => g.id !== guest.id));
                          markGuestChanged();
                        } catch (err) {
                          console.error(err);
                          setError("게스트 삭제에 실패했습니다.");
                        }
                      }}
                      disabled={loading}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 게스트 추가 입력 */}
            <div className="flex gap-2 shrink-0">
              <Input
                placeholder="게스트 이름 입력"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="flex-1"
                disabled={addingGuest}
              />
              <Button size="sm" onClick={handleAddGuest} disabled={addingGuest || !newGuestName.trim()}>
                {addingGuest ? "추가 중..." : "추가"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0" showCloseButton={false}>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={loading || !isChanged || isPublicSchedule}
              className="flex-1"
            >
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantManagementModal;
