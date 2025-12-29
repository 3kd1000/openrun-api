import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { userService, type UserResponse } from "../../../services/userService";
import { clubService } from "../../../services/clubService";
import type {
  Schedule,
  CreateScheduleRequest,
  Participant,
} from "../../../types/schedule";
import { DEV_USERS } from "../../../components/DevUserSwitcher";
import DrawCreateModal from "./DrawCreateModal";
import DrawViewModal from "./DrawViewModal";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import "./ScheduleDetailModal.css";

interface Props {
  scheduleId: number;
  onClose: () => void;
  onSuccess: () => void;
}

// 시간 옵션 생성 (정시만, 00시부터 23시까지)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    options.push(time);
  }
  return options;
};

const ScheduleDetailModal: React.FC<Props> = ({
  scheduleId,
  onClose,
  onSuccess,
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
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  // 게스트 사용자 목록
  const [guestUsers, setGuestUsers] = useState<UserResponse[]>([]);

  // 클럽 회원 관련 state
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservedBy, setSelectedReservedBy] = useState<UserResponse | null>(null);

  // 참가신청 시작시간 관련 state
  const [participationStartEnabled, setParticipationStartEnabled] = useState(false);
  const [participationStartDate, setParticipationStartDate] = useState('');
  const [participationStartTime, setParticipationStartTime] = useState('06:00');

  // 로그인한 사용자 ID 가져오기
  const userId = localStorage.getItem("user_id");
  const currentUserId = userId ? parseInt(userId) : null;

  // 게스트 사용자 목록 로드
  useEffect(() => {
    const fetchGuestUsers = async () => {
      try {
        const guests = await userService.getGuestUsers();
        setGuestUsers(guests);
      } catch (err) {
        console.error("게스트 사용자 목록 조회 실패:", err);
      }
    };
    fetchGuestUsers();
  }, []);

  // 클럽 회원 목록 조회
  useEffect(() => {
    const fetchClubMembers = async () => {
      try {
        const members = await clubService.getClubMembers(1); // TODO: 실제 클럽 ID로 변경
        setClubMembers(members);
      } catch (err) {
        console.error('클럽 회원 목록 조회 실패:', err);
      }
    };
    fetchClubMembers();
  }, []);

  // 사용자 ID로 이름 가져오기
  const getUserName = (userId: number): string => {
    // 게스트 사용자 확인 (우선순위 1)
    const guest = guestUsers.find((g) => g.id === userId);
    if (guest) return guest.name;

    // 일반 사용자 확인
    const user = DEV_USERS.find((u) => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  // 초기 날짜 및 시간 분리
  const scheduledAtDate = schedule
    ? new Date(schedule.scheduledAt)
    : new Date();
  const defaultDate = format(scheduledAtDate, "yyyy-MM-dd");
  const defaultTime = format(scheduledAtDate, "HH:mm");

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);

  // ESC 키로 모달 닫기 (편집 모드가 아니고 다른 모달이 열려있지 않을 때만)
  useEscapeKey(
    onClose,
    !isEditMode && !showDrawCreateModal && !showDrawViewModal
  );

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
        scheduleService.getScheduleById(scheduleId),
        participantService.getParticipants(scheduleId),
        currentUserId
          ? participantService.getMyParticipation(scheduleId, currentUserId)
          : Promise.resolve(null),
      ]);

      setSchedule(scheduleData);
      setParticipants(participantsList);
      setMyParticipation(myStatus);

      // 폼 데이터 초기화
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

      // 예약자 정보 초기화
      if (scheduleData.reservedByUserId) {
        const reservedUser = clubMembers.find(m => m.id === scheduleData.reservedByUserId);
        setSelectedReservedBy(reservedUser || null);
      } else {
        setSelectedReservedBy(null);
      }

      // 참가신청 시작시간 초기화
      if (scheduleData.participationStartAt) {
        setParticipationStartEnabled(true);
        const participationStart = new Date(scheduleData.participationStartAt);
        setParticipationStartDate(format(participationStart, "yyyy-MM-dd"));
        setParticipationStartTime(format(participationStart, "HH:mm"));
      } else {
        setParticipationStartEnabled(false);
        setParticipationStartDate(format(scheduledAt, "yyyy-MM-dd"));
        setParticipationStartTime('06:00');
      }
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schedule) {
      setError("일정 정보를 불러오는 중입니다.");
      return;
    }

    if (!formData.courtName || !selectedDate || !selectedTime) {
      setError("코트명, 날짜, 시간은 필수입니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const scheduledAt = `${selectedDate}T${selectedTime}:00`;
      const participationStartAt = participationStartEnabled
        ? `${participationStartDate}T${participationStartTime}:00`
        : null;

      const requestData: CreateScheduleRequest = {
        ...formData,
        scheduledAt,
        participationStartAt
      };

      await scheduleService.updateSchedule(schedule.id, requestData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("일정 수정 실패:", err);
      setError("일정 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleJoin = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다. /dev/login 페이지에서 로그인해주세요.");
      return;
    }

    if (!schedule) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await participantService.joinSchedule(schedule.id, currentUserId);
      await loadScheduleAndParticipants(); // 전체 데이터 새로고침
      onSuccess(); // 부모 컴포넌트 일정 목록 새로고침
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

  // 예약자 선택
  const handleSelectReservedBy = (member: UserResponse) => {
    setSelectedReservedBy(member);
    setFormData({ ...formData, reservedByUserId: member.id });
    setSearchQuery('');
  };

  // 예약자 선택 해제
  const handleClearReservedBy = () => {
    setSelectedReservedBy(null);
    setFormData({ ...formData, reservedByUserId: undefined });
  };

  // LIKE 검색 (이름에 검색어가 포함된 회원 필터링)
  const filteredMembers = searchQuery.trim()
    ? clubMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const confirmedParticipants = participants.filter(
    (p) => p.status === "CONFIRMED"
  );
  const waitingParticipants = participants.filter(
    (p) => p.status === "WAITING"
  );

  const timeOptions = generateTimeOptions();

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

            {schedule.cost && (
              <div className="detail-item">
                <label>총 비용</label>
                <p>{schedule.cost.toLocaleString()}원</p>
              </div>
            )}

            {schedule.description && (
              <div className="detail-item">
                <label>설명</label>
                <p className="detail-description">{schedule.description}</p>
              </div>
            )}

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
              // 대진이 있는 경우: 보기 버튼만 (수정/재생성은 대진표 보기 모달에서)
              <div className="draw-view-action">
                <button
                  type="button"
                  onClick={() => setShowDrawViewModal(true)}
                  className="btn-view-draw"
                >
                  📋 대진표 보기
                </button>
              </div>
            ) : (
              // 대진이 없는 경우: 생성 버튼
              confirmedParticipants.length >= 4 && (
                <div className="draw-create-action">
                  <button
                    type="button"
                    onClick={() => setShowDrawCreateModal(true)}
                    className="btn-create-draw"
                  >
                    🎯 대진 생성
                  </button>
                </div>
              )
            )}

            {/* 참가자 목록 */}
            {participants.length > 0 && (
              <div className="participants-section">
                <label>참가자 목록</label>
                <div className="participants-list">
                  {confirmedParticipants.length > 0 && (
                    <div className="participant-group">
                      <h4>확정 ({confirmedParticipants.length}명)</h4>
                      <ul>
                        {confirmedParticipants.map((p, idx) => (
                          <li key={p.id}>
                            {idx + 1}. {getUserName(p.userId)}
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
                            {idx + 1}. {getUserName(p.userId)}
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

            <div className="modal-actions">
              {currentUserId && myParticipation ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel-participation"
                  disabled={loading}
                >
                  {loading ? "취소 중..." : "신청 취소"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  className="btn-join"
                  disabled={loading || !currentUserId}
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
                onClick={() => setIsEditMode(true)}
                className="btn-primary"
              >
                수정
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                닫기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group" style={{ flex: '1.5' }}>
                <label>날짜 *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: '1' }}>
                <label>시간 *</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="time-select"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={participationStartEnabled}
                  onChange={(e) => setParticipationStartEnabled(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                참가신청 시작시간 설정
              </label>
            </div>

            {participationStartEnabled && (
              <div className="form-row">
                <div className="form-group" style={{ flex: '1.5' }}>
                  <label>참가신청 시작 날짜 *</label>
                  <input
                    type="date"
                    value={participationStartDate}
                    onChange={(e) => setParticipationStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label>참가신청 시작 시간 *</label>
                  <select
                    value={participationStartTime}
                    onChange={(e) => setParticipationStartTime(e.target.value)}
                    required
                    className="time-select"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>코트명 *</label>
              <input
                type="text"
                value={formData.courtName}
                onChange={(e) =>
                  setFormData({ ...formData, courtName: e.target.value })
                }
                placeholder="예: 골드 3번 코트"
                required
              />
            </div>

            <div className="form-group">
              <label>최대 정원 *</label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxCapacity: parseInt(e.target.value),
                  })
                }
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>총 비용 (선택)</label>
              <input
                type="number"
                value={formData.cost || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cost: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="25000"
              />
            </div>

            <div className="form-group">
              <label>예약자 (선택)</label>
              {selectedReservedBy ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRadius: '4px' }}>
                    {selectedReservedBy.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearReservedBy}
                    style={{ padding: '4px 8px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // 엔터키로 form submit 방지
                      }
                    }}
                    placeholder="클럽원 이름 검색... (타이핑하면 자동 검색됩니다)"
                  />
                  {filteredMembers.length > 0 && (
                    <div style={{
                      marginTop: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      background: 'white'
                    }}>
                      {filteredMembers.map(member => (
                        <div
                          key={member.id}
                          onClick={() => handleSelectReservedBy(member)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          {member.name}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-group">
              <label>설명 (선택)</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="일정 설명"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="btn-secondary"
                disabled={loading}
              >
                취소
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 대진 생성 모달 */}
      {showDrawCreateModal && (
        <DrawCreateModal
          scheduleId={schedule.id}
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
    </div>
  );
};

export default ScheduleDetailModal;
