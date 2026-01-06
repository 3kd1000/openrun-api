import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { clubService } from "../../../services/clubService";
import type { UserResponse } from "../../../services/userService";
import type { ScheduleTemplate } from "../../../types/scheduleTemplate";
import TemplateSection from "./TemplateSection";
import {
  parseParticipationPattern,
  createParticipationPattern,
} from "../../../utils/participationPatternUtils";
import "./ScheduleFormSection.css";

// 시간 옵션 생성 (정시만, 00시부터 23시까지)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    options.push(time);
  }
  return options;
};

export interface ScheduleFormData {
  clubId: number;
  scheduledAt: string;
  courtName: string;
  maxCapacity: number;
  cost?: number;
  description: string;
  reservedByUserId?: number;
  participationStartAt: string | null;
}

interface ScheduleFormSectionProps {
  mode: "create" | "update";
  currentUserId: number | null;
  initialData?: {
    clubId?: number;
    scheduledAt?: string;
    courtName?: string;
    maxCapacity?: number;
    cost?: number;
    description?: string;
    reservedByUserId?: number;
    participationStartAt?: string | null;
  };
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string;
  submitButtonText?: string;
}

export const ScheduleFormSection: React.FC<ScheduleFormSectionProps> = ({
  mode,
  currentUserId,
  initialData,
  onSubmit,
  onCancel,
  loading,
  error,
  submitButtonText = mode === "create" ? "생성" : "저장",
}) => {
  // 초기 날짜 및 시간 분리
  const now = new Date();
  const defaultDate = initialData?.scheduledAt
    ? initialData.scheduledAt.split("T")[0]
    : format(now, "yyyy-MM-dd");
  const defaultTime = initialData?.scheduledAt
    ? initialData.scheduledAt.split("T")[1]?.substring(0, 5) || "06:00"
    : "06:00";

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [formData, setFormData] = useState({
    clubId: initialData?.clubId || 1,
    courtName: initialData?.courtName || "",
    maxCapacity: initialData?.maxCapacity || 4,
    cost: initialData?.cost,
    description: initialData?.description || "",
    reservedByUserId: initialData?.reservedByUserId,
  });

  // 클럽 회원 관련 state
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReservedBy, setSelectedReservedBy] =
    useState<UserResponse | null>(null);

  // 참가신청 시작시간 관련 state
  const [participationStartEnabled, setParticipationStartEnabled] = useState(
    !!initialData?.participationStartAt
  );
  const [isEditingParticipationStart, setIsEditingParticipationStart] =
    useState(false);
  const [participationStartDate, setParticipationStartDate] = useState("");
  const [participationStartHour, setParticipationStartHour] = useState(0); // 0~23시
  const [participationStartMinute, setParticipationStartMinute] = useState<
    0 | 30
  >(0);

  // 템플릿 관련 state
  const [scheduleTemplateName, setScheduleTemplateName] = useState("");
  const [participationTemplateName, setParticipationTemplateName] =
    useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(
    null
  );
  const [editingTemplateType, setEditingTemplateType] = useState<
    "SCHEDULE" | "PARTICIPATION_START" | null
  >(null);

  // 초기 데이터로 participationStartAt 설정
  useEffect(() => {
    if (initialData?.participationStartAt) {
      const participationDate = initialData.participationStartAt.split("T")[0];
      const participationTime = initialData.participationStartAt.split("T")[1];
      setParticipationStartDate(participationDate);

      if (participationTime) {
        const [hourStr, minuteStr] = participationTime.split(":");
        const hour24 = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        setParticipationStartHour(hour24);
        setParticipationStartMinute(minute as 0 | 30);
      }
    } else {
      setParticipationStartDate(defaultDate);
    }
  }, [initialData?.participationStartAt, defaultDate]);

  // 클럽 회원 목록 조회
  useEffect(() => {
    const fetchClubMembers = async () => {
      try {
        const currentClubId = initialData?.clubId || 1;
        const members = await clubService.getClubMembers(currentClubId);
        setClubMembers(members);

        // 예약자가 설정되어 있으면 찾아서 선택
        if (initialData?.reservedByUserId) {
          const reservedMember = members.find(
            (m) => m.id === initialData.reservedByUserId
          );
          if (reservedMember) {
            setSelectedReservedBy(reservedMember);
          }
        }
      } catch (err) {
        console.error("클럽 회원 목록 조회 실패:", err);
      }
    };
    fetchClubMembers();
  }, [initialData?.clubId, initialData?.reservedByUserId]);

  // 참가신청 시작시간을 HH:mm 형식으로 변환 (24시간제)
  const getParticipationStartTime = (): string => {
    return `${String(participationStartHour).padStart(2, "0")}:${String(
      participationStartMinute
    ).padStart(2, "0")}`;
  };

  // 참가신청 시작시간을 포맷팅된 문자열로 변환 (yyyy.mm.dd HH:mm)
  const getFormattedParticipationStart = (): string => {
    if (!participationStartDate) return "";
    const date = new Date(participationStartDate);
    const formattedDate = format(date, "yyyy.MM.dd");
    const formattedTime = getParticipationStartTime();
    return `${formattedDate} ${formattedTime}`;
  };

  // 템플릿 콜백 함수들
  const handleScheduleTemplateSelect = (template: ScheduleTemplate) => {
    setFormData({
      ...formData,
      courtName: template.courtName || "",
      maxCapacity: template.maxCapacity || 4,
      cost: template.cost || undefined,
    });
  };

  const handleScheduleTemplateDeselect = () => {
    setFormData({
      ...formData,
      courtName: "",
      maxCapacity: 4,
      cost: undefined,
    });
  };

  const handleParticipationTemplateSelect = (template: ScheduleTemplate) => {
    if (template.participationStartPattern) {
      setParticipationStartEnabled(true);
      const parsed = parseParticipationPattern(
        template.participationStartPattern
      );
      if (parsed) {
        const { day, hour, minute } = parsed;

        // 오늘 날짜를 기준으로 참가신청 시작 날짜 계산 (등록 시점의 월 사용)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 해당 월의 마지막 날 계산
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const actualDay = Math.min(day, lastDay);

        const participationDate = new Date(
          currentYear,
          currentMonth,
          actualDay
        );
        setParticipationStartDate(format(participationDate, "yyyy-MM-dd"));

        // 시간 설정 (24시간제)
        setParticipationStartHour(hour);
        setParticipationStartMinute(minute as 0 | 30);
      }
    }
  };

  const handleParticipationTemplateDeselect = () => {
    setParticipationStartEnabled(false);
    setParticipationStartDate(defaultDate);
    setParticipationStartHour(0);
    setParticipationStartMinute(0);
  };

  const handleScheduleTemplateEdit = (template: ScheduleTemplate) => {
    setFormData({
      ...formData,
      courtName: template.courtName || "",
      maxCapacity: template.maxCapacity || 4,
      cost: template.cost || undefined,
    });
    setScheduleTemplateName(template.templateName);
  };

  const handleParticipationTemplateEdit = (template: ScheduleTemplate) => {
    if (template.participationStartPattern) {
      const parsed = parseParticipationPattern(
        template.participationStartPattern
      );
      if (parsed) {
        const { day, hour, minute } = parsed;

        // 오늘 날짜를 기준으로 참가신청 시작 날짜 계산 (등록 시점의 월 사용)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 해당 월의 마지막 날 계산
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const actualDay = Math.min(day, lastDay);

        const participationDate = new Date(
          currentYear,
          currentMonth,
          actualDay
        );
        setParticipationStartDate(format(participationDate, "yyyy-MM-dd"));

        // 시간 설정 (24시간제)
        setParticipationStartHour(hour);
        setParticipationStartMinute(minute as 0 | 30);
      }
    }
    setParticipationTemplateName(template.templateName);
  };

  const handleEditModeChange = (
    isEditing: boolean,
    templateId: number | null,
    templateType?: "SCHEDULE" | "PARTICIPATION_START"
  ) => {
    setEditingTemplateId(isEditing ? templateId : null);
    setEditingTemplateType(isEditing && templateType ? templateType : null);
  };

  const handleTemplateSaved = (
    templateType: "SCHEDULE" | "PARTICIPATION_START"
  ) => {
    if (templateType === "SCHEDULE") {
      setScheduleTemplateName("");
    } else {
      setParticipationTemplateName("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    const participationStartAt = participationStartEnabled
      ? `${participationStartDate}T${getParticipationStartTime()}:00`
      : null;

    const submitData: ScheduleFormData = {
      clubId: formData.clubId,
      scheduledAt,
      courtName: formData.courtName,
      maxCapacity: formData.maxCapacity,
      cost: formData.cost,
      description: formData.description,
      reservedByUserId: formData.reservedByUserId,
      participationStartAt,
    };

    await onSubmit(submitData);
  };

  const timeOptions = generateTimeOptions();

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}

      {/* 일정 템플릿 (코트명, 정원, 비용) - 기본 닫힘 */}
      {currentUserId && (
        <TemplateSection
          templateType="SCHEDULE"
          currentUserId={currentUserId}
          title="일정 템플릿"
          onTemplateSelect={handleScheduleTemplateSelect}
          onTemplateDeselect={handleScheduleTemplateDeselect}
          onEditTemplate={handleScheduleTemplateEdit}
          onEditModeChange={(isEditing, templateId) =>
            handleEditModeChange(isEditing, templateId, "SCHEDULE")
          }
          editingTemplateId={
            editingTemplateType === "SCHEDULE" ? editingTemplateId : null
          }
          saveFormData={{
            templateName: scheduleTemplateName,
            courtName: formData.courtName,
            maxCapacity: formData.maxCapacity,
            cost: formData.cost,
          }}
          onTemplateNameChange={setScheduleTemplateName}
          onSaveTemplate={() => handleTemplateSaved("SCHEDULE")}
          defaultCollapsed={true}
        />
      )}

      {/* 참가신청 시작시간 템플릿 - 항상 표시, 기본 닫힘 */}
      {currentUserId && (
        <TemplateSection
          templateType="PARTICIPATION_START"
          currentUserId={currentUserId}
          title="참가시작 템플릿"
          onTemplateSelect={handleParticipationTemplateSelect}
          onTemplateDeselect={handleParticipationTemplateDeselect}
          onEditTemplate={handleParticipationTemplateEdit}
          onEditModeChange={(isEditing, templateId) =>
            handleEditModeChange(isEditing, templateId, "PARTICIPATION_START")
          }
          editingTemplateId={
            editingTemplateType === "PARTICIPATION_START"
              ? editingTemplateId
              : null
          }
          saveFormData={{
            templateName: participationTemplateName,
            participationStartPattern: participationStartEnabled
              ? createParticipationPattern(
                  new Date(participationStartDate).getDate(),
                  participationStartHour,
                  participationStartMinute
                )
              : null,
          }}
          onTemplateNameChange={setParticipationTemplateName}
          onSaveTemplate={() => handleTemplateSaved("PARTICIPATION_START")}
          defaultCollapsed={true}
        />
      )}

      <div className="form-row">
        <div className="form-group" style={{ flex: "1.2 1 0%", minWidth: 0 }}>
          <label>날짜 *</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: "1 1 0%", minWidth: 0 }}>
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
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={participationStartEnabled}
            onChange={(e) => {
              setParticipationStartEnabled(e.target.checked);
              if (!e.target.checked) {
                setIsEditingParticipationStart(false);
              } else if (e.target.checked && !participationStartDate) {
                // 체크박스 활성화 시 날짜가 없으면 수정 모드로 진입
                setIsEditingParticipationStart(true);
              }
            }}
            style={{ width: "auto", margin: 0 }}
          />
          참가신청 시작 시간 설정
        </label>
      </div>

      {/* 참가신청 시작시간 - 체크 여부와 상관없이 항상 표시 */}
      {!isEditingParticipationStart ? (
        <div className="form-group">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: participationStartEnabled ? "#f9f9f9" : "#f5f5f5",
              opacity: participationStartEnabled ? 1 : 0.6,
            }}
          >
            <span style={{ fontSize: "14px", color: "#333" }}>
              {participationStartDate
                ? getFormattedParticipationStart()
                : "날짜와 시간을 설정해주세요"}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingParticipationStart(true)}
              disabled={!participationStartEnabled}
              style={{
                padding: "4px 12px",
                background: participationStartEnabled ? "#4a90e2" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: participationStartEnabled ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              수정
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="form-row">
            <div className="form-group" style={{ flex: "1.2", minWidth: 0 }}>
              <label>시작 날짜 *</label>
              <input
                type="date"
                value={participationStartDate}
                onChange={(e) => setParticipationStartDate(e.target.value)}
                disabled={!participationStartEnabled}
                required
              />
            </div>
            <div className="form-group" style={{ flex: "1", minWidth: 0 }}>
              <label>시간 *</label>
              <select
                value={participationStartHour}
                onChange={(e) =>
                  setParticipationStartHour(parseInt(e.target.value))
                }
                disabled={!participationStartEnabled}
                required
              >
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}시
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: "1", minWidth: 0 }}>
              <label>분 *</label>
              <select
                value={participationStartMinute}
                onChange={(e) =>
                  setParticipationStartMinute(
                    parseInt(e.target.value) as 0 | 30
                  )
                }
                disabled={!participationStartEnabled}
                required
              >
                <option value={0}>00분</option>
                <option value={30}>30분</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <button
              type="button"
              onClick={() => {
                if (participationStartDate) {
                  setIsEditingParticipationStart(false);
                }
              }}
              style={{
                padding: "6px 16px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              완료
            </button>
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              placeholder="클럽원 이름 검색"
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
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          취소
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || editingTemplateId !== null}
          title={
            editingTemplateId !== null
              ? "템플릿 수정 모드에서는 일정을 저장할 수 없습니다"
              : ""
          }
        >
          {loading ? `${submitButtonText} 중...` : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default ScheduleFormSection;
