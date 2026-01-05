import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { clubService } from "../../../services/clubService";
import type { UserResponse } from "../../../services/userService";
import type {
  Schedule,
  CreateScheduleRequest,
  Participant,
} from "../../../types/schedule";
import DrawCreateModal from "./DrawCreateModal";
import DrawViewModal from "./DrawViewModal";
import ParticipantManagementModal from "./ParticipantManagementModal";
import ScheduleFormSection from "./ScheduleFormSection";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import {
  validateParticipation,
  validateScheduleCreation,
  isPastDate,
} from "../../../utils/scheduleValidation";
import { isNotEmpty } from "../../../utils/isEmpty";
import "./ScheduleDetailModal.css";

interface Props {
  scheduleId: number;
  onClose: () => void;
  onSuccess: () => void;
  onJoinSuccess?: () => void;
}

const ScheduleDetailModal: React.FC<Props> = ({
  scheduleId,
  onClose,
  onSuccess,
  onJoinSuccess,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipation, setMyParticipation] = useState<Participant | null>(
    null
  );
  const [showDrawCreateModal, setShowDrawCreateModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [showParticipantManagementModal, setShowParticipantManagementModal] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  // 클럽 회원 목록 (참가자 관리 모달용)
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);

  // 로그인한 사용자 ID 가져오기
  const userId = localStorage.getItem("user_id");
  const currentUserId = userId ? parseInt(userId) : null;

  // 클럽 회원 목록 조회 (참가자 관리 모달 열릴 때)
  useEffect(() => {
    if (!showParticipantManagementModal) return;

    const fetchClubMembers = async () => {
      try {
        const currentClubId = parseInt(
          localStorage.getItem("current_club_id") || "1"
        );
        const members = await clubService.getClubMembers(currentClubId);
        setClubMembers(members);
      } catch (err) {
        console.error("클럽 회원 목록 조회 실패:", err);
      }
    };
    fetchClubMembers();
  }, [showParticipantManagementModal]);

  // ESC 키로 모달 닫기 또는 편집 모드 종료
  const handleEscapeKey = useCallback(() => {
    if (isEditMode) {
      // 편집 모드일 때는 편집 모드 종료
      setIsEditMode(false);
    } else if (!showDrawCreateModal && !showDrawViewModal && !showParticipantManagementModal) {
      // 다른 모달이 열려있지 않을 때만 상세 모달 닫기
      onClose();
    }
  }, [isEditMode, showDrawCreateModal, showDrawViewModal, showParticipantManagementModal, onClose]);

  useEscapeKey(handleEscapeKey);

  // 초기 날짜 및 시간 분리 (ScheduleFormSection에 전달용)
  const scheduledAtDate = schedule
    ? new Date(schedule.scheduledAt)
    : new Date();
  const defaultDate = format(scheduledAtDate, "yyyy-MM-dd");
  const defaultTime = format(scheduledAtDate, "HH:mm");

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);

  const [formData, setFormData] = useState({
    clubId: schedule?.clubId || 1,
    courtName: schedule?.courtName || "",
    maxCapacity: schedule?.maxCapacity || 0,
    cost: schedule?.cost || undefined,
    description: schedule?.description || "",
    reservedByUserId: schedule?.reservedByUserId || undefined,
  });

  // 중복 호출 방지를 위한 ref
  const isLoadingRef = useRef(false);

  const loadScheduleAndParticipants = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);

      // 일정 정보와 참가자 정보를 병렬로 가져오기
      const [scheduleData, participantsList, myStatus] = await Promise.all([
        scheduleService.getScheduleById(scheduleId, currentUserId || undefined),
        participantService.getParticipants(scheduleId),
        currentUserId
          ? participantService.getMyParticipation(scheduleId, currentUserId)
          : Promise.resolve(null),
      ]);

      setSchedule(scheduleData);
      setParticipants(participantsList);
      setMyParticipation(myStatus);

      // 폼 데이터 초기화 (Edit 모드 진입 시 사용)
      const scheduledAt = new Date(scheduleData.scheduledAt);
      setSelectedDate(format(scheduledAt, "yyyy-MM-dd"));
      setSelectedTime(format(scheduledAt, "HH:mm"));
      setFormData({
        clubId: scheduleData.clubId,
        courtName: scheduleData.courtName,
        maxCapacity: scheduleData.maxCapacity,
        cost: scheduleData.cost || undefined,
        description: scheduleData.description || "",
        reservedByUserId: scheduleData.reservedByUserId || undefined,
      });
    } catch (err) {
      console.error("일정 정보 로드 실패:", err);
      setError("일정 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [scheduleId, currentUserId]);

  // 일정 정보 및 참가자 목록 로드
  useEffect(() => {
    loadScheduleAndParticipants();
  }, [loadScheduleAndParticipants]);

  const handleDelete = async () => {
    if (!schedule) {
      return;
    }

    if (!window.confirm("정말 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await scheduleService.deleteSchedule(schedule.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("일정 삭제 실패:", err);
      setError("일정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraw = async () => {
    if (!schedule) {
      return;
    }

    if (
      !window.confirm(
        "대진표를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await scheduleService.deleteDraw(schedule.id);
      await loadScheduleAndParticipants(); // 변경된 데이터로 새로고침
      onSuccess(); // 부모 컴포넌트에 변경 알림
    } catch (err) {
      console.error("대진표 삭제 실패:", err);
      setError("대진표 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다. /dev/login 페이지에서 로그인해주세요.");
      return;
    }

    if (!schedule) {
      return;
    }

    // 참가신청 가능 여부 체크
    const validation = validateParticipation(
      schedule.scheduledAt,
      schedule.participationStartAt
    );
    if (!validation.isValid) {
      setError(validation.errorMessage || "참가 신청에 실패했습니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await participantService.joinSchedule(schedule.id, currentUserId);
      await loadScheduleAndParticipants(); // 전체 데이터 새로고침
      onSuccess(); // 부모 컴포넌트 일정 목록 새로고침
      if (onJoinSuccess) {
        onJoinSuccess(); // 참가신청 성공 알림
      }
      onClose(); // 참가신청 후 모달 닫기
    } catch (err: unknown) {
      console.error("참가 신청 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "참가 신청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentUserId || !schedule) {
      return;
    }

    if (!window.confirm("참가 신청을 취소하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await participantService.cancelParticipation(schedule.id, currentUserId);
      await loadScheduleAndParticipants(); // 전체 데이터 새로고침
      onSuccess(); // 부모 컴포넌트 일정 목록 새로고침
    } catch (err) {
      console.error("신청 취소 실패:", err);
      setError("신청 취소에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const confirmedParticipants = participants.filter(
    (p) => p.status === "CONFIRMED"
  );
  const waitingParticipants = participants.filter(
    (p) => p.status === "WAITING"
  );

  // 일정 정보 로딩 중
  if (loading && !schedule) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content schedule-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>일정 상세</h2>
            <button className="btn-close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div
            className="loading"
            style={{ padding: "40px", textAlign: "center" }}
          >
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  // 일정 정보 로드 실패
  if (!schedule) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content schedule-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>일정 상세</h2>
            <button className="btn-close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="error-message" style={{ padding: "20px" }}>
            {error || "일정 정보를 불러오는데 실패했습니다."}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content schedule-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEditMode ? "일정 수정" : "일정 상세"}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {!isEditMode ? (
          <div className="schedule-detail-view">
            <div className="detail-item">
              <label>코트명</label>
              <p>{schedule.courtName}</p>
            </div>

            {schedule.reservedByUserName && (
              <div className="detail-item">
                <label>예약자</label>
                <p>{schedule.reservedByUserName}</p>
              </div>
            )}

            <div className="detail-item">
              <label>일정 시간</label>
              <p>
                {format(new Date(schedule.scheduledAt), "yyyy년 M월 d일 HH:mm")}
              </p>
            </div>

            {isNotEmpty(schedule.cost) && schedule.cost !== undefined && (
              <div className="detail-item">
                <label>참가 비용</label>
                <p>{schedule.cost.toLocaleString()}원</p>
              </div>
            )}

            {isNotEmpty(schedule.description) && (
              <div className="detail-item">
                <label>설명</label>
                <p className="detail-description">{schedule.description}</p>
              </div>
            )}

            <div className="detail-item">
              <label>참가 현황</label>
              <div className="participant-stats">
                <span className="stat-item stat-total">
                  총원: {schedule.maxCapacity}명
                </span>
                <span className="stat-divider">|</span>
                <span className="stat-item stat-confirmed">
                  신청: {confirmedParticipants.length}명
                </span>
                <span className="stat-divider">|</span>
                <span className="stat-item stat-waiting">
                  대기: {waitingParticipants.length}명
                </span>
              </div>
            </div>

            {/* 대진표 상태 */}
            <div className="detail-item">
              <label>대진표 상태</label>
              {schedule.drawType ? (
                <div
                  className={`draw-status ${
                    schedule.isDrawValid ? "valid" : "invalid"
                  }`}
                >
                  {schedule.isDrawValid ? (
                    <>✓ 유효 ({schedule.drawType})</>
                  ) : (
                    <>⚠️ 참가자 변동으로 인한 재생성 필요</>
                  )}
                </div>
              ) : (
                <div className="draw-status empty">생성된 대진이 없습니다</div>
              )}
            </div>

            {/* 대진 관련 액션 버튼 */}
            {schedule.drawType ? (
              // 대진이 있는 경우: 보기 버튼과 삭제 버튼
              // 과거 일정이어도 대진이 있으면 보기 가능 (경기 결과 입력/수정을 위해)
              <div className="draw-view-action">
                <button
                  type="button"
                  onClick={() => setShowDrawViewModal(true)}
                  className="btn-view-draw"
                >
                  📋 대진표 보기
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDraw}
                  className="btn-delete-draw"
                  disabled={loading || isPastDate(schedule.scheduledAt)}
                  title={
                    isPastDate(schedule.scheduledAt)
                      ? "이미 지난 경기에는 대진표를 삭제할 수 없습니다."
                      : undefined
                  }
                >
                  🗑️ 대진표 삭제
                </button>
              </div>
            ) : (
              // 대진이 없는 경우: 생성 버튼
              <div className="draw-create-action">
                <button
                  type="button"
                  onClick={() => setShowDrawCreateModal(true)}
                  className="btn-create-draw"
                  disabled={
                    !!(
                      (schedule.scheduledAt &&
                        new Date() >= new Date(schedule.scheduledAt)) ||
                      confirmedParticipants.length < 6
                    )
                  }
                  title={
                    schedule.scheduledAt &&
                    new Date() >= new Date(schedule.scheduledAt)
                      ? "이미 지난 일정에는 대진을 생성할 수 없습니다."
                      : confirmedParticipants.length < 6
                      ? `대진 생성에는 최소 6명이 필요합니다 (현재: ${confirmedParticipants.length}명)`
                      : undefined
                  }
                >
                  🎯 대진 생성
                </button>
                {confirmedParticipants.length < 6 && (
                  <p className="draw-min-notice">
                    대진 생성에는 최소 6명이 필요합니다 (현재:{" "}
                    {confirmedParticipants.length}명)
                  </p>
                )}
              </div>
            )}

            {/* 참가자 목록 */}
            {participants.length > 0 && (
              <div className="participants-section">
                <div className="section-header-with-button">
                  <label>참가자 목록</label>
                  {schedule?.canManageSchedule && !isEditMode && (
                    <button
                      className="manage-participants-button"
                      onClick={() => setShowParticipantManagementModal(true)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: "6px" }}
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      참가자 수정
                    </button>
                  )}
                </div>
                <div className="participants-list">
                  {confirmedParticipants.length > 0 && (
                    <div className="participant-group">
                      <h4>확정 ({confirmedParticipants.length}명)</h4>
                      <ul>
                        {confirmedParticipants.map((p, idx) => (
                          <li key={p.id}>
                            {idx + 1}. {p.userName}
                            {p.userId === currentUserId && (
                              <span className="me-badge"> (나)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {waitingParticipants.length > 0 && (
                    <div className="participant-group">
                      <h4>대기 ({waitingParticipants.length}명)</h4>
                      <ul>
                        {waitingParticipants.map((p, idx) => (
                          <li key={p.id} className="waiting">
                            {idx + 1}. {p.userName}
                            {p.userId === currentUserId && (
                              <span className="me-badge"> (나)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 내 참가 상태 */}
            {myParticipation && (
              <div className="my-status">
                {myParticipation.status === "CONFIRMED" && (
                  <p className="status-confirmed">✓ 참가 확정</p>
                )}
                {myParticipation.status === "WAITING" && (
                  <p className="status-waiting">
                    ⏱ 대기 중 (
                    {waitingParticipants.findIndex(
                      (p) => p.userId === currentUserId
                    ) + 1}
                    번째)
                  </p>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {/* 참가신청 시작 시간 안내 */}
            {schedule?.participationStartAt ? (
              (() => {
                const now = new Date();
                const startAt = new Date(schedule.participationStartAt);
                const isStarted = now >= startAt;

                return (
                  <div
                    className={`participation-start-info ${
                      isStarted ? "started" : "pending"
                    }`}
                  >
                    <p>
                      참가신청 시작 시간:{" "}
                      {format(startAt, "yyyy년 M월 d일 HH:mm")}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="participation-start-info started">
                <p>참가신청 시작 시간: 즉시 신청 가능</p>
              </div>
            )}

            <div className="modal-actions">
              {currentUserId && myParticipation ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel-participation"
                  disabled={
                    loading || !schedule || isPastDate(schedule.scheduledAt)
                  }
                  title={
                    schedule && isPastDate(schedule.scheduledAt)
                      ? "이미 지난 일정에는 신청 취소할 수 없습니다."
                      : undefined
                  }
                >
                  {loading ? "취소 중..." : "신청 취소"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  className="btn-join"
                  disabled={
                    loading ||
                    !currentUserId ||
                    !schedule ||
                    !validateParticipation(
                      schedule.scheduledAt,
                      schedule.participationStartAt
                    ).isValid
                  }
                >
                  {loading ? "신청 중..." : "참가 신청"}
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="btn-delete"
                disabled={loading}
              >
                {loading ? "삭제 중..." : "삭제"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (schedule && isPastDate(schedule.scheduledAt)) {
                    setError("과거 날짜에는 일정을 수정할 수 없습니다.");
                    return;
                  }
                  setIsEditMode(true);
                }}
                className="btn-primary"
                disabled={!schedule || isPastDate(schedule.scheduledAt)}
                title={
                  schedule && isPastDate(schedule.scheduledAt)
                    ? "과거 날짜에는 일정을 수정할 수 없습니다."
                    : undefined
                }
              >
                수정
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                닫기
              </button>
            </div>
          </div>
        ) : (
          <ScheduleFormSection
            mode="update"
            currentUserId={currentUserId}
            initialData={{
              clubId: schedule.clubId,
              scheduledAt: `${selectedDate}T${selectedTime}:00`,
              courtName: formData.courtName,
              maxCapacity: formData.maxCapacity,
              cost: formData.cost,
              description: formData.description,
              reservedByUserId: formData.reservedByUserId,
              participationStartAt: schedule.participationStartAt || null,
            }}
            onSubmit={async (data) => {
              if (!schedule) {
                setError("일정 정보를 불러오는 중입니다.");
                throw new Error("일정 정보를 불러오는 중입니다.");
              }

              // 과거 날짜 체크
              const validation = validateScheduleCreation(data.scheduledAt);
              if (!validation.isValid) {
                setError(validation.errorMessage || "일정 수정에 실패했습니다.");
                throw new Error(validation.errorMessage || "일정 수정에 실패했습니다.");
              }

              setLoading(true);
              setError("");

              try {
                const requestData: CreateScheduleRequest = {
                  clubId: data.clubId,
                  scheduledAt: data.scheduledAt,
                  courtName: data.courtName,
                  maxCapacity: data.maxCapacity,
                  cost: data.cost,
                  description: data.description,
                  reservedByUserId: data.reservedByUserId,
                  participationStartAt: data.participationStartAt,
                };

                await scheduleService.updateSchedule(schedule.id, requestData);
                setIsEditMode(false); // 편집 모드 종료
                await loadScheduleAndParticipants(); // 데이터 새로고침
                onSuccess(); // 부모 컴포넌트 알림
              } catch (err) {
                console.error("일정 수정 실패:", err);
                setError("일정 수정에 실패했습니다.");
                throw err;
              } finally {
                setLoading(false);
              }
            }}
            onCancel={() => setIsEditMode(false)}
            loading={loading}
            error={error}
            submitButtonText="저장"
          />
        )}
      </div>

      {/* 대진 생성 모달 */}
      {showDrawCreateModal && schedule && (
        <DrawCreateModal
          scheduleId={schedule.id}
          schedule={schedule}
          participants={participants}
          onClose={() => {
            setShowDrawCreateModal(false);
          }}
          onSuccess={async () => {
            setShowDrawCreateModal(false);
            await loadScheduleAndParticipants();
            onSuccess();
          }}
        />
      )}

      {/* 대진표 보기 모달 */}
      {showDrawViewModal && (
        <DrawViewModal
          schedule={schedule}
          participants={participants}
          onClose={() => {
            setShowDrawViewModal(false);
          }}
          onSuccess={async () => {
            setShowDrawViewModal(false);
            await loadScheduleAndParticipants();
            onSuccess();
          }}
        />
      )}

      {/* 참가자 관리 모달 */}
      {showParticipantManagementModal && schedule && (
        <ParticipantManagementModal
          scheduleId={schedule.id}
          schedule={schedule}
          currentParticipants={participants}
          clubMembers={clubMembers}
          onClose={() => setShowParticipantManagementModal(false)}
          onSuccess={async () => {
            setShowParticipantManagementModal(false);
            await loadScheduleAndParticipants();
            onSuccess();
          }}
        />
      )}
    </div>
  );
};

export default ScheduleDetailModal;
