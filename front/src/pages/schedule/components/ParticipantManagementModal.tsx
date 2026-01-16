import React, { useState, useMemo } from "react";
import type { Participant, Schedule } from "../../../types/schedule";
import type { UserResponse } from "../../../services/userService";
import { participantService } from "../../../services/participantService";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { getOpenRunSession } from "../../../utils/openrunSession";
import "./ParticipantManagementModal.css";

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
  // 현재 참가자 userId 집합
  const currentParticipantIds = useMemo(() => {
    return new Set(currentParticipants.map((p) => p.userId));
  }, [currentParticipants]);

  // 현재 확정된 참가자 수
  const currentConfirmedCount = useMemo(() => {
    return currentParticipants.filter((p) => p.status === "CONFIRMED").length;
  }, [currentParticipants]);

  // 선택된 userId 집합 (초기값: 현재 참가자)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(currentParticipantIds)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // ESC 키로 모달 닫기
  useEscapeKey(onClose, !loading);

  // 선택된 멤버들의 예상 상태 계산
  const getExpectedStatus = (userId: number): "CONFIRMED" | "WAITING" => {
    if (currentParticipantIds.has(userId)) {
      // 기존 참가자는 현재 상태 유지
      const current = currentParticipants.find((p) => p.userId === userId);
      return current?.status === "CONFIRMED" ? "CONFIRMED" : "WAITING";
    }

    // 새로 추가되는 참가자
    const newSelectedCount = Array.from(selectedUserIds).filter(
      (id) => !currentParticipantIds.has(id)
    ).length;

    // 현재 확정된 참가자 + 새로 추가될 참가자 중 몇 명이 확정될 수 있는지
    const availableSlots = schedule.maxCapacity - currentConfirmedCount;
    const newConfirmedCount = Math.min(newSelectedCount, availableSlots);

    // 이 userId가 새로 추가되는 참가자 중 몇 번째인지
    const newSelectedList = Array.from(selectedUserIds)
      .filter((id) => !currentParticipantIds.has(id))
      .sort((a, b) => a - b);
    const index = newSelectedList.indexOf(userId);

    return index < newConfirmedCount ? "CONFIRMED" : "WAITING";
  };

  // 체크박스 토글 (모든 사용자 토글 가능)
  const handleToggle = (userId: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  // 저장
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

  // 변경사항 확인 (선택된 사용자 목록이 기존과 다른지)
  const isChanged = useMemo(() => {
    if (selectedUserIds.size !== currentParticipantIds.size) return true;
    const selectedArray = Array.from(selectedUserIds).sort();
    const currentArray = Array.from(currentParticipantIds).sort();
    return JSON.stringify(selectedArray) !== JSON.stringify(currentArray);
  }, [selectedUserIds, currentParticipantIds]);

  // 예상 통계 계산
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="participant-management-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>참가자 관리</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-body">
          {/* 정원 정보 */}
          <div className="capacity-info">
            <div className="capacity-stat">
              <span className="stat-label">정원:</span>
              <span className="stat-value">{schedule.maxCapacity}명</span>
            </div>
            <div className="capacity-stat">
              <span className="stat-label">현재 확정:</span>
              <span className="stat-value confirmed">
                {currentConfirmedCount}명
              </span>
            </div>
            <div className="capacity-stat">
              <span className="stat-label">예상 확정:</span>
              <span className="stat-value expected">
                {expectedStats.confirmed}명
              </span>
            </div>
            <div className="capacity-stat">
              <span className="stat-label">예상 대기:</span>
              <span className="stat-value waiting">
                {expectedStats.waiting}명
              </span>
            </div>
          </div>

          <div className="participants-list">
            <div className="members-list">
              {clubMembers.map((member) => {
                const isCurrentParticipant = currentParticipantIds.has(
                  member.id
                );
                const expectedStatus = getExpectedStatus(member.id);
                const isSelected = selectedUserIds.has(member.id);

                return (
                  <label
                    key={member.id}
                    className={`member-item ${
                      isCurrentParticipant ? "current-participant" : ""
                    } ${!isSelected ? "not-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(member.id)}
                      disabled={loading}
                    />
                    <span className="member-name">{member.name}</span>
                    {isCurrentParticipant && (
                      <span className="badge current">현재 참가자</span>
                    )}
                    {isSelected && (
                      <span
                        className={`badge expected ${expectedStatus.toLowerCase()}`}
                      >
                        {expectedStatus === "CONFIRMED"
                          ? "확정 예정"
                          : "대기 예정"}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={loading || !isChanged}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManagementModal;
