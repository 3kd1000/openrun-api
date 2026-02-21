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
    return new Set(currentParticipants.map((p) => p.userId));
  }, [currentParticipants]);

  const currentConfirmedCount = useMemo(() => {
    return currentParticipants.filter((p) => p.status === "CONFIRMED").length;
  }, [currentParticipants]);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(currentParticipantIds)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
        Array.from(selectedUserIds),
        session.userId
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

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="max-w-[600px] w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>참가자 관리</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
          )}

          {/* 정원 정보 */}
          <div className="grid grid-cols-2 max-[768px]:grid-cols-1 gap-3 p-3 bg-gradient-to-br from-[#f5f7fa] to-[#e8ecf1] rounded-md border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">정원:</span>
              <span className="text-sm text-foreground">{schedule.maxCapacity}명</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">현재 확정:</span>
              <span className="text-sm text-foreground">{currentConfirmedCount}명</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">예상 확정:</span>
              <span className="text-sm text-foreground">{expectedStats.confirmed}명</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">예상 대기:</span>
              <span className="text-sm text-foreground">{expectedStats.waiting}명</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "flex flex-col gap-1 max-h-[400px] max-[768px]:max-h-[50vh] max-[359px]:max-h-[45vh]",
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
                      "flex items-center gap-3 py-3 px-4 rounded-md cursor-pointer transition-all border border-transparent bg-background",
                      "max-[768px]:py-2 max-[768px]:px-3 max-[768px]:gap-2 max-[768px]:flex-wrap",
                      "max-[425px]:py-1.5 max-[425px]:px-2 max-[425px]:gap-1.5",
                      "max-[359px]:p-1.5 max-[359px]:gap-1.5",
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
                      <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-sm font-normal">
                        현재 참가자
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge
                        className={cn(
                          "text-sm font-normal",
                          expectedStatus === "CONFIRMED"
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : "bg-amber-500 text-white hover:bg-amber-500"
                        )}
                      >
                        {expectedStatus === "CONFIRMED" ? "확정 예정" : "대기 예정"}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0" showCloseButton={false}>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={loading || !isChanged}
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
