import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { clubService } from "../../../services/clubService";
import type { UserResponse } from "../../../services/userService";
import type {
  Schedule,
  CreateScheduleRequest,
  Participant,
  MatchType,
} from "../../../types/schedule";
import DrawCreateModal from "../draw/DrawCreateModal";
import DrawViewModal from "../draw/DrawViewModal";
import ParticipantManagementModal from "./ParticipantManagementModal";
import ScheduleFormSection from "./ScheduleFormSection";
import ScheduleBallUsageSection from "../../../components/ball/ScheduleBallUsageSection";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import {
  validateParticipation,
  validateScheduleCreation,
  isPastDate,
} from "../../../utils/scheduleValidation";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { EditIcon, LinkIcon } from "../../../components/common/Icons";
import UserNameWithBadge from "../../../components/common/UserNameWithBadge";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import { FEATURE_FLAGS } from "../../../config/featureFlags";
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
  const { showToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipation, setMyParticipation] = useState<Participant | null>(
    null
  );
  const [showDrawCreateModal, setShowDrawCreateModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [showParticipantManagementModal, setShowParticipantManagementModal] =
    useState(false);
  const [guestRecruitNote, setGuestRecruitNote] = useState("");
  const [interclubRecruitNote, setInterclubRecruitNote] = useState("");
  const [editingRecruitType, setEditingRecruitType] = useState<
    "guest" | "interclub" | null
  >(null);
  const [tempRecruitNote, setTempRecruitNote] = useState("");
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  // 클럽 회원 목록 (참가자 관리 모달용)
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);

  // 로그인한 사용자 ID 가져오기
  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;

  // MatchType을 라벨로 변환하는 함수
  const getMatchTypeLabel = (matchType: MatchType): string => {
    if (!matchType || matchType === "NONE") return "";
    if (matchType === "MEN_DOUBLES") return "남복";
    if (matchType === "WOMEN_DOUBLES") return "여복";
    if (matchType === "MIXED_DOUBLES") return "혼복";
    else return "단식";
  };

  // 삭제 권한: API 응답의 canManageSchedule 필드 사용
  const canDelete = schedule?.canManageSchedule ?? false;

  // 링크 복사 기능
  const handleCopyLink = async () => {
    if (!schedule) return;

    const url = `${window.location.origin}/schedules/club?scheduleId=${schedule.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었습니다", "success");
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("링크가 복사되었습니다", "success");
    }
  };

  const handleTogglePinned = async () => {
    if (!schedule) return;
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const nextPinned = !(schedule.pinned === true);
      const updated = await scheduleService.updateSchedulePinned(
        schedule.id,
        nextPinned,
        currentUserId
      );
      setSchedule(updated);
      onSuccess(); // 목록/위젯 새로고침
    } catch (err) {
      console.error("PIN 설정 실패:", err);
      setError("PIN 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGuestRecruit = async () => {
    if (!schedule) return;
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }

    const currentOpen = schedule.guestRecruitOpen === true;

    // OFF → ON: 편집 모드 진입
    if (!currentOpen) {
      setEditingRecruitType("guest");
      setTempRecruitNote(guestRecruitNote);
      return;
    }

    // ON → OFF: 바로 API 호출 (note는 유지)
    try {
      setLoading(true);
      setError("");
      const updated = await scheduleService.updateGuestRecruit(
        schedule.id,
        false,
        currentUserId,
        schedule.guestRecruitNote || null
      );
      setSchedule(updated);
      setEditingRecruitType(null);
      onSuccess();
    } catch (err) {
      console.error("게스트 모집 설정 실패:", err);
      setError("게스트 모집 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInterclubRecruit = async () => {
    if (!schedule) return;
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }

    const currentOpen = schedule.interclubRecruitOpen === true;

    // OFF → ON: 편집 모드 진입
    if (!currentOpen) {
      setEditingRecruitType("interclub");
      setTempRecruitNote(interclubRecruitNote);
      return;
    }

    // ON → OFF: 바로 API 호출 (note는 유지)
    try {
      setLoading(true);
      setError("");
      const updated = await scheduleService.updateInterclubRecruit(
        schedule.id,
        false,
        currentUserId,
        schedule.interclubRecruitNote || null
      );
      setSchedule(updated);
      setEditingRecruitType(null);
      onSuccess();
    } catch (err) {
      console.error("교류전 모집 설정 실패:", err);
      setError("교류전 모집 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRecruitNote = async () => {
    if (!schedule || !currentUserId || !editingRecruitType) return;

    try {
      setLoading(true);
      setError("");

      if (editingRecruitType === "guest") {
        const updated = await scheduleService.updateGuestRecruit(
          schedule.id,
          true,
          currentUserId,
          tempRecruitNote || null
        );
        setSchedule(updated);
        setGuestRecruitNote(updated.guestRecruitNote ?? "");
      } else {
        const updated = await scheduleService.updateInterclubRecruit(
          schedule.id,
          true,
          currentUserId,
          tempRecruitNote || null
        );
        setSchedule(updated);
        setInterclubRecruitNote(updated.interclubRecruitNote ?? "");
      }

      setEditingRecruitType(null);
      setTempRecruitNote("");
      onSuccess();
    } catch (err) {
      console.error("모집글 등록 실패:", err);
      setError("모집글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRecruitNote = () => {
    setEditingRecruitType(null);
    setTempRecruitNote("");
  };

  // 클럽 회원 목록 조회 (참가자 관리 모달 열릴 때)
  useEffect(() => {
    if (!showParticipantManagementModal) return;

    const fetchClubMembers = async () => {
      try {
        const session = getOpenRunSession();
        const currentClubId = parseInt(session.currentClubId ?? "1");
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
    } else if (
      !showDrawCreateModal &&
      !showDrawViewModal &&
      !showParticipantManagementModal
    ) {
      // 다른 모달이 열려있지 않을 때만 상세 모달 닫기
      onClose();
    }
  }, [
    isEditMode,
    showDrawCreateModal,
    showDrawViewModal,
    showParticipantManagementModal,
    onClose,
  ]);

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
    matchType: schedule?.matchType || null,
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
      setGuestRecruitNote(scheduleData.guestRecruitNote ?? "");
      setInterclubRecruitNote(scheduleData.interclubRecruitNote ?? "");

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
        matchType: scheduleData.matchType || null,
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
      await scheduleService.deleteSchedule(schedule.id, currentUserId ?? undefined);
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
      showToast("로그인이 필요합니다", "warning");
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
        <div className="modal-header schedule-detail-modal__header">
          <div className="schedule-detail-modal__header-top">
            <h2>{isEditMode ? "일정 수정" : "일정 상세"}</h2>
            <div className="schedule-detail-modal__header-right">
              {!isEditMode && (
                <button
                  type="button"
                  className="btn-copy-link"
                  onClick={handleCopyLink}
                  title="링크 복사"
                  aria-label="링크 복사"
                >
                  <LinkIcon size={16} />
                  <span>링크복사</span>
                </button>
              )}
              <button className="btn-close" onClick={onClose}>
                &times;
              </button>
            </div>
          </div>

          {!isEditMode && canDelete && (
            <div className="schedule-detail-modal__header-actions">
              <button
                type="button"
                onClick={handleTogglePinned}
                className={`btn-toggle-header ${
                  schedule.pinned ? "is-on" : "is-off"
                }`}
                disabled={loading}
                title="고정"
              >
                <span className="btn-toggle-header__text">
                  {schedule.pinned ? "고정 ON" : "고정 OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleGuestRecruit}
                className={`btn-toggle-header ${
                  schedule.guestRecruitOpen ? "is-on" : "is-off"
                }`}
                disabled={loading}
                title="게스트 모집"
              >
                <span className="btn-toggle-header__text">
                  게스트 {schedule.guestRecruitOpen ? "ON" : "OFF"}
                </span>
              </button>

              {FEATURE_FLAGS.INTERCLUB_ENABLED && (
                <button
                  type="button"
                  onClick={handleToggleInterclubRecruit}
                  className={`btn-toggle-header ${
                    schedule.interclubRecruitOpen ? "is-on" : "is-off"
                  }`}
                  disabled={loading}
                  title="교류전 모집"
                >
                  <span className="btn-toggle-header__text">
                    교류전 {schedule.interclubRecruitOpen ? "ON" : "OFF"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {!isEditMode && editingRecruitType && (
          <div className="recruit-note-section">
            <label className="recruit-note-label">
              {editingRecruitType === "guest" ? "게스트" : "교류전"} 모집 메시지
            </label>
            <textarea
              className="recruit-note-textarea"
              placeholder={
                editingRecruitType === "guest"
                  ? "예시) NTRP 3.5 이상, 구력 2년 이상 환영\n주차 가능, 라켓 대여 불가"
                  : "예시) 4vs4 교류전 예정 (오후 2시~6시)\n평균 구력 3년, 복식 중심\n장소: 강남테니스클럽"
              }
              value={tempRecruitNote}
              onChange={(e) => setTempRecruitNote(e.target.value)}
              disabled={loading}
              rows={3}
            />
            <div className="recruit-note-actions">
              <button
                type="button"
                onClick={handleCancelRecruitNote}
                className="btn-cancel-recruit"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitRecruitNote}
                className="btn-submit-recruit"
                disabled={loading}
              >
                등록
              </button>
            </div>
          </div>
        )}

        {!isEditMode ? (
          <div className="schedule-detail-view">
            {schedule.clubName && (
              <div className="detail-item">
                <label>클럽</label>
                <p>{schedule.clubName}</p>
              </div>
            )}
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
                {formatScheduleDateTime(
                  schedule.scheduledAt,
                  schedule.durationMinutes
                )}
              </p>
            </div>

            {schedule.matchType && (
              <div className="detail-item">
                <label>모임 타입</label>
                <p>{getMatchTypeLabel(schedule.matchType)}</p>
              </div>
            )}

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

            {/* 대진표 섹션 - 한 줄로 통합 */}
            <div className="draw-section draw-section--inline">
              <label>대진표</label>
              {schedule.drawType ? (
                // 대진이 있는 경우: 유효/무효 + 보기 + 삭제
                <>
                  <span
                    className={`btn-draw-inline ${
                      schedule.isDrawValid ? "btn-draw-inline--valid" : "btn-draw-inline--invalid"
                    }`}
                  >
                    {schedule.isDrawValid ? "유효" : "무효"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDrawViewModal(true)}
                    className="btn-draw-inline"
                  >
                    보기
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDraw}
                    className="btn-draw-inline btn-draw-inline--danger"
                    disabled={loading || isPastDate(schedule.scheduledAt)}
                    title={
                      isPastDate(schedule.scheduledAt)
                        ? "이미 지난 경기에는 대진표를 삭제할 수 없습니다."
                        : undefined
                    }
                  >
                    삭제
                  </button>
                </>
              ) : (
                // 대진이 없는 경우: 생성 버튼 + 안내문구
                <>
                  <button
                    type="button"
                    onClick={() => setShowDrawCreateModal(true)}
                    className="btn-draw-inline btn-draw-inline--primary"
                    disabled={schedule.maxCapacity < 4}
                    title={
                      schedule.maxCapacity < 4
                        ? `대진 생성은 4인 이상의 모임일 때 가능합니다. (현재 모임 총원: ${schedule.maxCapacity}명)`
                        : undefined
                    }
                  >
                    생성
                  </button>
                  {schedule.maxCapacity < 4 && (
                    <span className="draw-inline-notice">
                      4인 이상 모임에서 가능 (현재 {schedule.maxCapacity}명)
                    </span>
                  )}
                </>
              )}
            </div>

            {/* 참가자 목록 */}
            <div className="participants-section">
              <div className="section-header-with-button">
                <label>참가자 목록 - 총원 {schedule.maxCapacity}명</label>
                {schedule?.canManageSchedule && !isEditMode && (
                  <button
                    className="manage-participants-button"
                    onClick={() => setShowParticipantManagementModal(true)}
                  >
                    <EditIcon size={16} />
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
                          {idx + 1}. <UserNameWithBadge userId={p.userId} userName={p.userName} awardTypes={p.awardTypes} />
                          {p.asGuest ? (
                            <span className="guest-badge"> 게스트</span>
                          ) : null}
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
                          {idx + 1}. <UserNameWithBadge userId={p.userId} userName={p.userName} awardTypes={p.awardTypes} />
                          {p.asGuest ? (
                            <span className="guest-badge"> 게스트</span>
                          ) : null}
                          {p.userId === currentUserId && (
                            <span className="me-badge"> (나)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {participants.length === 0 && (
                  <div className="participant-group">
                    <p
                      style={{
                        textAlign: "center",
                        color: "var(--color-text-secondary)",
                        padding: "var(--space-m)",
                      }}
                    >
                      아직 참가자가 없습니다
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 공용구 섹션 */}
            <ScheduleBallUsageSection
              clubId={schedule.clubId}
              scheduleId={schedule.id}
            />

            {error && <div className="error-message">{error}</div>}

            {/* 참가신청 시작 시간 안내 - 지정된 경우에만 표시 */}
            {schedule?.participationStartAt && (
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
                      {format(startAt, "yyyy년 M월 d일 (E) HH:mm", {
                        locale: ko,
                      })}
                    </p>
                  </div>
                );
              })()
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
                disabled={loading || !canDelete}
                title={
                  !canDelete ? "관리자만 일정을 삭제할 수 있습니다." : undefined
                }
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
              durationMinutes: schedule.durationMinutes || 120,
              courtName: formData.courtName,
              maxCapacity: formData.maxCapacity,
              cost: formData.cost,
              description: formData.description,
              reservedByUserId: formData.reservedByUserId,
              participationStartAt: schedule.participationStartAt || null,
              matchType: formData.matchType,
            }}
            onSubmit={async (data) => {
              if (!schedule) {
                setError("일정 정보를 불러오는 중입니다.");
                throw new Error("일정 정보를 불러오는 중입니다.");
              }

              // 과거 날짜 체크
              const validation = validateScheduleCreation(data.scheduledAt);
              if (!validation.isValid) {
                setError(
                  validation.errorMessage || "일정 수정에 실패했습니다."
                );
                throw new Error(
                  validation.errorMessage || "일정 수정에 실패했습니다."
                );
              }

              // 참가신청 시작시간 검증
              if (data.participationStartAt) {
                const scheduledDate = new Date(data.scheduledAt);
                const participationStartDate = new Date(
                  data.participationStartAt
                );

                if (participationStartDate >= scheduledDate) {
                  setError(
                    "참가신청 시작시간은 일정 시간보다 이전이어야 합니다."
                  );
                  throw new Error(
                    "참가신청 시작시간은 일정 시간보다 이전이어야 합니다."
                  );
                }
              }

              setLoading(true);
              setError("");

              try {
                const requestData: CreateScheduleRequest = {
                  clubId: data.clubId,
                  scheduledAt: data.scheduledAt,
                  durationMinutes: data.durationMinutes,
                  courtName: data.courtName,
                  maxCapacity: data.maxCapacity,
                  cost: data.cost,
                  description: data.description,
                  reservedByUserId: data.reservedByUserId,
                  participationStartAt: data.participationStartAt,
                  matchType: data.matchType,
                };

                await scheduleService.updateSchedule(schedule.id, requestData, currentUserId ?? undefined);
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
