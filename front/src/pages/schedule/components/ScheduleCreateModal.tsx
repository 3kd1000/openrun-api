import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { scheduleService } from "../../../services/scheduleService";
import { clubService } from "../../../services/clubService";
import type { CreateScheduleRequest } from "../../../types/schedule";
import type { UserResponse } from "../../../services/userService";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { validateScheduleCreation } from "../../../utils/scheduleValidation";
import "./ScheduleCreateModal.css";

interface Props {
  initialDate?: string;
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

const ScheduleCreateModal: React.FC<Props> = ({
  initialDate,
  onClose,
  onSuccess,
}) => {
  // 초기 날짜 및 시간 분리
  const now = new Date();
  const defaultDate = initialDate
    ? initialDate.split("T")[0]
    : format(now, "yyyy-MM-dd");
  const defaultTime = initialDate
    ? initialDate.split("T")[1]?.substring(0, 5) || "06:00"
    : "06:00";

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [formData, setFormData] = useState({
    clubId: 1, // TODO: 실제 클럽 ID로 변경
    courtName: "",
    maxCapacity: 4,
    cost: undefined as number | undefined,
    description: "",
    reservedByUserId: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 클럽 회원 관련 state
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReservedBy, setSelectedReservedBy] =
    useState<UserResponse | null>(null);

  // 참가신청 시작시간 관련 state
  const [participationStartEnabled, setParticipationStartEnabled] =
    useState(false);
  const [participationStartDate, setParticipationStartDate] =
    useState(defaultDate);
  const [participationStartAmPm, setParticipationStartAmPm] = useState<"AM" | "PM">("AM");
  const [participationStartHour, setParticipationStartHour] = useState(6);
  const [participationStartMinute, setParticipationStartMinute] = useState<0 | 30>(0);
  
  // 참가신청 시작시간을 HH:mm 형식으로 변환
  const getParticipationStartTime = (): string => {
    let hour24 = participationStartHour;
    if (participationStartAmPm === "PM" && participationStartHour !== 12) {
      hour24 = participationStartHour + 12;
    } else if (participationStartAmPm === "AM" && participationStartHour === 12) {
      hour24 = 0;
    }
    return `${String(hour24).padStart(2, "0")}:${String(participationStartMinute).padStart(2, "0")}`;
  };

  // 클럽 회원 목록 조회
  useEffect(() => {
    const fetchClubMembers = async () => {
      try {
        const members = await clubService.getClubMembers(1); // TODO: 실제 클럽 ID로 변경
        setClubMembers(members);
      } catch (err) {
        console.error("클럽 회원 목록 조회 실패:", err);
      }
    };
    fetchClubMembers();
  }, []);

  // ESC 키로 모달 닫기
  useEscapeKey(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courtName || !selectedDate || !selectedTime) {
      setError("코트명, 날짜, 시간은 필수입니다.");
      return;
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;

    // 과거 날짜 체크
    const validation = validateScheduleCreation(scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "일정 생성에 실패했습니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const participationStartAt = participationStartEnabled
        ? `${participationStartDate}T${getParticipationStartTime()}:00`
        : null;

      const requestData: CreateScheduleRequest = {
        ...formData,
        scheduledAt,
        participationStartAt,
      };

      await scheduleService.createSchedule(requestData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("일정 생성 실패:", err);
      setError("일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 예약자 선택
  const handleSelectReservedBy = (member: UserResponse) => {
    setSelectedReservedBy(member);
    setFormData({ ...formData, reservedByUserId: member.id });
    setSearchQuery("");
  };

  // 예약자 선택 해제
  const handleClearReservedBy = () => {
    setSelectedReservedBy(null);
    setFormData({ ...formData, reservedByUserId: undefined });
  };

  // LIKE 검색 (이름에 검색어가 포함된 회원 필터링)
  const filteredMembers = searchQuery.trim()
    ? clubMembers.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const timeOptions = generateTimeOptions();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일정 생성</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group" style={{ flex: "1.5" }}>
              <label>날짜 *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: "1" }}>
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
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={participationStartEnabled}
                onChange={(e) => setParticipationStartEnabled(e.target.checked)}
                style={{ width: "auto", margin: 0 }}
              />
              참가신청 시작 시간 설정
            </label>
          </div>

          {participationStartEnabled && (
            <>
              <div className="form-group">
                <label>시작 날짜 *</label>
                <input
                  type="date"
                  value={participationStartDate}
                  onChange={(e) => setParticipationStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: "0.8" }}>
                  <label>오전/오후 *</label>
                  <select
                    value={participationStartAmPm}
                    onChange={(e) => setParticipationStartAmPm(e.target.value as "AM" | "PM")}
                    required
                  >
                    <option value="AM">오전</option>
                    <option value="PM">오후</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: "1" }}>
                  <label>시간 *</label>
                  <select
                    value={participationStartHour}
                    onChange={(e) => setParticipationStartHour(parseInt(e.target.value))}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}시
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: "1" }}>
                  <label>분 *</label>
                  <select
                    value={participationStartMinute}
                    onChange={(e) => setParticipationStartMinute(parseInt(e.target.value) as 0 | 30)}
                    required
                  >
                    <option value={0}>00분</option>
                    <option value={30}>30분</option>
                  </select>
                </div>
              </div>
            </>
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
            <label>참가 비용 (선택)</label>
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    padding: "8px 12px",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                  }}
                >
                  {selectedReservedBy.name}
                </span>
                <button
                  type="button"
                  onClick={handleClearReservedBy}
                  style={{
                    padding: "4px 8px",
                    background: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
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
                    if (e.key === "Enter") {
                      e.preventDefault(); // 엔터키로 form submit 방지
                    }
                  }}
                  placeholder="클럽원 이름 검색... (타이핑하면 자동 검색됩니다)"
                />
                {filteredMembers.length > 0 && (
                  <div
                    style={{
                      marginTop: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      maxHeight: "150px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectReservedBy(member)}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f5f5f5")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "white")
                        }
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
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "생성 중..." : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleCreateModal;
