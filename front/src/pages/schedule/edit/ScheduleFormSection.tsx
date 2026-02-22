import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { clubService } from "../../../services/clubService";
import type { UserResponse } from "../../../services/userService";
import type { ScheduleTemplate } from "../../../types/scheduleTemplate";
import type { MatchType } from "../../../types/schedule";
import TemplateSection from "./TemplateSection";
import {
  parseParticipationPattern,
  createParticipationPattern,
} from "../../../utils/participationPatternUtils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// native select에 Input(h-9)과 동일한 높이/스타일 적용
const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
  durationMinutes: number;
  courtName: string;
  maxCapacity: number;
  numberOfCourts?: number;
  cost?: number;
  description: string;
  reservedByUserId?: number;
  participationStartAt: string | null;
  matchType?: MatchType;
}

interface ScheduleFormSectionProps {
  mode: "create" | "update";
  currentUserId: number | null;
  initialData?: {
    clubId?: number;
    scheduledAt?: string;
    durationMinutes?: number;
    courtName?: string;
    maxCapacity?: number;
    numberOfCourts?: number;
    cost?: number;
    description?: string;
    reservedByUserId?: number;
    participationStartAt?: string | null;
    matchType?: MatchType;
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
  const [selectedDuration, setSelectedDuration] = useState(
    initialData?.durationMinutes || 120
  );
  const [formData, setFormData] = useState<ScheduleFormData>({
    clubId: initialData?.clubId || 1,
    scheduledAt: initialData?.scheduledAt || "",
    durationMinutes: initialData?.durationMinutes || 120,
    courtName: initialData?.courtName || "",
    maxCapacity: initialData?.maxCapacity || 4,
    numberOfCourts: initialData?.numberOfCourts || undefined,
    cost: initialData?.cost,
    description: initialData?.description || "",
    reservedByUserId: initialData?.reservedByUserId,
    participationStartAt: initialData?.participationStartAt || null,
    matchType: initialData?.matchType,
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
      durationMinutes: selectedDuration,
      courtName: formData.courtName,
      maxCapacity: formData.maxCapacity,
      numberOfCourts: formData.numberOfCourts,
      cost: formData.cost,
      description: formData.description,
      reservedByUserId: formData.reservedByUserId,
      participationStartAt,
      matchType: formData.matchType,
    };

    await onSubmit(submitData);
  };

  const timeOptions = generateTimeOptions();

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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

      {/* 날짜 / 시간 / 기간 */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">날짜 *</Label>
          <div className="relative min-w-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Input
              type="text"
              value={selectedDate ? format(new Date(selectedDate + "T00:00:00"), "yy.MM.dd") : ""}
              readOnly
              tabIndex={-1}
              className="pointer-events-none"
            />
          </div>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">시간 *</Label>
          <select
            className={selectClassName}
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">기간</Label>
          <select
            className={selectClassName}
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
          >
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
            <option value={90}>1시간 30분</option>
            <option value={120}>2시간</option>
            <option value={150}>2시간 30분</option>
            <option value={180}>3시간</option>
            <option value={240}>4시간</option>
            <option value={300}>5시간</option>
          </select>
        </div>
      </div>

      {/* 참가신청 시작 시간 체크박스 */}
      <div className="mb-3 flex items-center gap-2">
        <Checkbox
          id="participation-start"
          checked={participationStartEnabled}
          onCheckedChange={(checked) => {
            const enabled = !!checked;
            setParticipationStartEnabled(enabled);
            if (!enabled) {
              setIsEditingParticipationStart(false);
            } else if (enabled && !participationStartDate) {
              setIsEditingParticipationStart(true);
            }
          }}
        />
        <Label
          htmlFor="participation-start"
          className="text-sm cursor-pointer"
        >
          참가신청 시작 시간 설정
        </Label>
      </div>

      {/* 참가신청 시작시간 - 체크 여부와 상관없이 항상 표시 */}
      {!isEditingParticipationStart ? (
        <div className="mb-3">
          <div
            className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm ${
              participationStartEnabled
                ? "bg-muted/50"
                : "bg-muted/30 opacity-60"
            }`}
          >
            <span className="flex-1">
              {participationStartDate
                ? getFormattedParticipationStart()
                : "날짜와 시간을 설정해주세요"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingParticipationStart(true)}
              disabled={!participationStartEnabled}
            >
              수정
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 시작 날짜 / 시간 / 분 */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                시작 날짜 *
              </Label>
              <Input
                type="date"
                value={participationStartDate}
                onChange={(e) => setParticipationStartDate(e.target.value)}
                disabled={!participationStartEnabled}
                required
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">시간 *</Label>
              <select
                className={selectClassName}
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
            <div className="flex-1 min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">분 *</Label>
              <select
                className={selectClassName}
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
          <Button
            type="button"
            size="sm"
            className="mb-3"
            onClick={() => {
              if (participationStartDate) {
                setIsEditingParticipationStart(false);
              }
            }}
          >
            완료
          </Button>
        </>
      )}

      {/* 코트명 */}
      <div className="mb-3 space-y-1.5">
        <Label className="text-xs text-muted-foreground">코트명 *</Label>
        <Input
          type="text"
          value={formData.courtName}
          onChange={(e) =>
            setFormData({ ...formData, courtName: e.target.value })
          }
          placeholder="예: 골드 3번 코트"
          required
        />
      </div>

      {/* 최대 정원 / 코트 수 / 모임 타입 */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">최대 정원 *</Label>
          <Input
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
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">코트 수</Label>
          <Input
            type="number"
            value={formData.numberOfCourts || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfCourts: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            min="1"
            placeholder="자동"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">모임 타입</Label>
          <select
            className={selectClassName}
            value={formData.matchType || "NONE"}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                matchType: (value === "NONE" ? null : value) as MatchType,
              });
            }}
          >
            <option value="NONE">선택안함</option>
            <option value="MEN_DOUBLES">남복</option>
            <option value="WOMEN_DOUBLES">여복</option>
            <option value="MIXED_DOUBLES">혼복</option>
            <option value="SINGLES">단식</option>
          </select>
        </div>
      </div>

      {/* 참가 비용 / 예약자 */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            참가 비용
          </Label>
          <Input
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
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            예약자
          </Label>
          {selectedReservedBy ? (
            <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
              <span className="flex-1 text-sm">{selectedReservedBy.name}</span>
              <button
                type="button"
                onClick={handleClearReservedBy}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="클럽원 이름 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />
              {filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md max-h-[150px] overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleSelectReservedBy(member)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                    >
                      {member.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 설명 */}
      <div className="mb-3 space-y-1.5">
        <Label className="text-xs text-muted-foreground">설명</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="일정 설명"
          rows={3}
        />
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex gap-3 mt-6 pb-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          disabled={loading || editingTemplateId !== null}
          title={
            editingTemplateId !== null
              ? "템플릿 수정 모드에서는 일정을 저장할 수 없습니다"
              : ""
          }
        >
          {loading ? `${submitButtonText} 중...` : submitButtonText}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleFormSection;
