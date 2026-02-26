import React, { useState, useEffect } from "react";
import { scheduleTemplateService } from "../../../services/scheduleTemplateService";
import type {
  ScheduleTemplate,
  TemplateType,
  CreateScheduleTemplateRequest,
} from "../../../types/scheduleTemplate";
import Toast from "../../../components/common/Toast";
import { cn } from "../../../lib/utils";

const MAX_TEMPLATES = 3;
const MAX_NAME_LENGTH = 20;

/** MatchType enum → 한글 표시 */
const matchTypeLabel: Record<string, string> = {
  MEN_DOUBLES: "남복",
  WOMEN_DOUBLES: "여복",
  MIXED_DOUBLES: "혼복",
  SINGLES: "단식",
};

interface TemplateSectionProps {
  templateType: TemplateType;
  currentUserId: number;
  title: string;
  onTemplateSelect?: (template: ScheduleTemplate) => void;
  onTemplateDeselect?: () => void;

  /** 템플릿 저장을 위한 현재 폼 데이터 */
  saveFormData?: {
    courtName?: string;
    maxCapacity?: number;
    cost?: number;
    courtAddress?: string;
    region?: string;
    matchType?: string | null;
    numberOfCourts?: number;
    participationStartPattern?: string | null;
  };
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({
  templateType,
  currentUserId,
  title,
  onTemplateSelect,
  onTemplateDeselect,
  saveFormData,
}) => {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // 인라인 이름변경
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, [currentUserId, templateType]);

  const fetchTemplates = async () => {
    try {
      const allTemplates = await scheduleTemplateService.getUserTemplates();
      setTemplates(allTemplates.filter((t) => t.templateType === templateType));
    } catch (err) {
      console.error("템플릿 목록 조회 실패:", err);
      setError("즐겨찾기 목록을 불러오는데 실패했습니다.");
    }
  };

  // 선택/해제
  const handleSelectTemplate = (templateId: number) => {
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      onTemplateDeselect?.();
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    onTemplateSelect?.(template);
  };

  // SCHEDULE 자동 이름: 코트명-정원-코트수-모임타입
  const generateAutoName = (): string => {
    if (!saveFormData) return "";

    if (templateType === "SCHEDULE") {
      const parts: string[] = [];
      const court = (saveFormData.courtName || "").trim();
      if (court) parts.push(court);
      const cap = saveFormData.maxCapacity;
      if (cap && cap > 0) parts.push(`${cap}명`);
      const courts = saveFormData.numberOfCourts;
      if (courts && courts > 0) parts.push(`${courts}면`);
      const mt = saveFormData.matchType;
      if (mt && mt !== "NONE" && matchTypeLabel[mt]) parts.push(matchTypeLabel[mt]);
      return parts.join("-").substring(0, MAX_NAME_LENGTH);
    } else {
      // PARTICIPATION_START: 패턴 자체를 이름으로
      return saveFormData.participationStartPattern || "";
    }
  };

  // 저장 가능 여부
  const canSave = !!saveFormData && (
    templateType === "SCHEDULE"
      ? !!(saveFormData.courtName?.trim())
      : !!(saveFormData.participationStartPattern)
  );

  // 저장 카드 노출 여부: 미선택+<MAX → 새로 저장, 선택됨 → 덮어쓰기
  const showSaveCard = !!saveFormData && (
    (!selectedTemplateId && templates.length < MAX_TEMPLATES) || !!selectedTemplateId
  );

  // 새로 저장
  const handleCreateNew = async () => {
    if (!saveFormData || !canSave) return;

    const templateName = generateAutoName();
    if (!templateName) {
      setError("즐겨찾기 이름을 생성할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: CreateScheduleTemplateRequest = {
        templateType,
        templateName,
        courtName: saveFormData.courtName,
        maxCapacity: saveFormData.maxCapacity,
        cost: saveFormData.cost,
        courtAddress: saveFormData.courtAddress,
        region: saveFormData.region,
        matchType: saveFormData.matchType,
        numberOfCourts: saveFormData.numberOfCourts,
        participationStartPattern: saveFormData.participationStartPattern,
      };

      await scheduleTemplateService.createTemplate(request);
      await fetchTemplates();
      setToastMessage("즐겨찾기가 저장되었습니다.");
    } catch (err: unknown) {
      console.error("즐겨찾기 저장 실패:", err);
      const msg = err instanceof Error && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || "즐겨찾기 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 덮어쓰기 (선택된 템플릿에 현재 폼 값 저장, 이름은 기존 유지)
  const handleOverwrite = async () => {
    if (!saveFormData || !selectedTemplateId || !canSave) return;

    const selected = templates.find((t) => t.id === selectedTemplateId);
    if (!selected) return;

    try {
      setLoading(true);
      setError("");

      await scheduleTemplateService.updateTemplate(selectedTemplateId, {
        templateName: selected.templateName, // 기존 이름 유지
        courtName: saveFormData.courtName,
        maxCapacity: saveFormData.maxCapacity,
        cost: saveFormData.cost,
        courtAddress: saveFormData.courtAddress,
        region: saveFormData.region,
        matchType: saveFormData.matchType,
        numberOfCourts: saveFormData.numberOfCourts,
        participationStartPattern: saveFormData.participationStartPattern,
      });

      await fetchTemplates();
      setToastMessage("즐겨찾기가 덮어쓰기 되었습니다.");
    } catch (err: unknown) {
      console.error("즐겨찾기 덮어쓰기 실패:", err);
      const msg = err instanceof Error && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || "즐겨찾기 덮어쓰기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이름변경 시작
  const startRename = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setRenamingId(templateId);
    setRenamingValue(template.templateName);
  };

  // 이름변경 저장
  const handleRenameSave = async () => {
    if (!renamingId) return;
    const template = templates.find((t) => t.id === renamingId);
    if (!template) return;

    const trimmed = renamingValue.trim();
    if (!trimmed || trimmed === template.templateName) {
      setRenamingId(null);
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`이름은 최대 ${MAX_NAME_LENGTH}자까지 입력 가능합니다.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await scheduleTemplateService.updateTemplate(renamingId, {
        templateName: trimmed,
        courtName: template.courtName,
        maxCapacity: template.maxCapacity,
        cost: template.cost,
        courtAddress: template.courtAddress,
        region: template.region,
        matchType: template.matchType,
        numberOfCourts: template.numberOfCourts,
        participationStartPattern: template.participationStartPattern,
      });

      await fetchTemplates();
      setRenamingId(null);
      setToastMessage("이름이 변경되었습니다.");
    } catch (err) {
      console.error("이름 변경 실패:", err);
      setError("이름 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 삭제
  const handleDelete = async (templateId: number) => {
    if (!confirm("정말로 이 즐겨찾기를 삭제하시겠습니까?")) return;

    try {
      await scheduleTemplateService.deleteTemplate(templateId);
      await fetchTemplates();
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
      setToastMessage("즐겨찾기가 삭제되었습니다.");
    } catch (err) {
      console.error("즐겨찾기 삭제 실패:", err);
      setToastMessage("즐겨찾기 삭제에 실패했습니다.");
    }
  };

  const autoName = generateAutoName();

  return (
    <div className="mb-3 p-2.5 md:p-2 bg-muted rounded-lg border border-border">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-2 md:mb-1.5">
        <div className="text-sm md:text-[13px] font-semibold text-foreground">
          {title}
        </div>
        <span className="text-xs md:text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded-[10px] border border-border">
          {templates.length} / {MAX_TEMPLATES}
        </span>
      </div>

      {error && (
        <div className="py-2 px-3 bg-red-50 text-red-800 rounded text-[13px] mb-2">
          {error}
        </div>
      )}

      {/* 카드 리스트 */}
      <div className="flex flex-col gap-1.5">
        {templates.length === 0 && !showSaveCard && (
          <p className="text-muted-foreground text-[13px] md:text-xs italic m-0">
            저장된 즐겨찾기가 없습니다.
          </p>
        )}

        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "flex items-center gap-2 py-2 px-3 md:py-1.5 md:px-2.5 border rounded-lg bg-background transition-all",
              renamingId === template.id
                ? "border-primary ring-1 ring-primary/20"
                : selectedTemplateId === template.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 cursor-pointer"
                  : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
            )}
            onClick={() => renamingId !== template.id && handleSelectTemplate(template.id)}
          >
            {renamingId === template.id ? (
              /* 인라인 이름변경 모드 */
              <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={renamingValue}
                  onChange={(e) => setRenamingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleRenameSave(); }
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus
                  className="flex-1 min-w-0 text-[13px] md:text-xs font-medium bg-transparent border-b border-primary outline-none py-0.5"
                />
                <button
                  type="button"
                  className="px-1.5 py-0.5 rounded text-[11px] text-primary hover:bg-primary/10 transition-colors font-medium shrink-0"
                  onClick={handleRenameSave}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted transition-colors shrink-0"
                  onClick={() => setRenamingId(null)}
                >
                  취소
                </button>
              </div>
            ) : (
              /* 일반 모드 */
              <>
                <span className={cn(
                  "flex-1 text-[13px] md:text-xs font-medium truncate",
                  selectedTemplateId === template.id ? "text-primary" : "text-foreground"
                )}>
                  {template.templateName}
                </span>

                {/* 이름변경 / 삭제 */}
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => startRename(template.id)}
                  >
                    이름변경
                  </button>
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => handleDelete(template.id)}
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* 저장 / 덮어쓰기 카드 */}
        {showSaveCard && (
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-3 md:py-1.5 md:px-2.5 border border-dashed rounded-lg transition-all",
              canSave
                ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                : "border-border bg-muted/30 cursor-not-allowed"
            )}
            onClick={canSave ? (selectedTemplateId ? handleOverwrite : handleCreateNew) : undefined}
          >
            <span className={cn(
              "flex-1 text-[13px] md:text-xs font-medium truncate",
              canSave ? "text-emerald-700" : "text-muted-foreground"
            )}>
              {loading
                ? "저장 중..."
                : selectedTemplateId
                  ? "현재 설정으로 덮어쓰기"
                  : canSave
                    ? `${autoName} 으로 저장`
                    : templateType === "SCHEDULE"
                      ? "코트명을 입력하면 저장할 수 있습니다"
                      : "패턴을 설정하면 저장할 수 있습니다"
              }
            </span>
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
};

export default TemplateSection;
