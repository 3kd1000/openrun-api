import React, { useState, useEffect } from "react";
import { scheduleTemplateService } from "../../../services/scheduleTemplateService";
import type {
  ScheduleTemplate,
  TemplateType,
  CreateScheduleTemplateRequest,
} from "../../../types/scheduleTemplate";
import Toast from "../../../components/common/Toast";
import { cn } from "../../../lib/utils";

interface TemplateSectionProps {
  /** 템플릿 타입 (SCHEDULE 또는 PARTICIPATION_START) */
  templateType: TemplateType;

  /** 현재 사용자 ID */
  currentUserId: number;

  /** 섹션 제목 */
  title: string;

  /** 템플릿 선택 시 호출되는 콜백 */
  onTemplateSelect?: (template: ScheduleTemplate) => void;

  /** 템플릿 선택 해제 시 호출되는 콜백 (폼 초기화용) */
  onTemplateDeselect?: () => void;

  /** Edit mode 진입 시 호출되는 콜백 (템플릿 데이터 전달) */
  onEditTemplate?: (template: ScheduleTemplate) => void;

  /** Edit mode 상태 변경 시 호출 (일정 생성 버튼 비활성화 용도) */
  onEditModeChange?: (isEditing: boolean, templateId: number | null) => void;

  /** 현재 Edit mode인 템플릿 ID (외부에서 관리) */
  editingTemplateId?: number | null;

  /** 템플릿 저장을 위한 현재 폼 데이터 */
  saveFormData?: {
    templateName: string;
    courtName?: string;
    maxCapacity?: number;
    cost?: number;
    participationStartPattern?: string | null;
  };

  /** 템플릿 이름 변경 시 호출 */
  onTemplateNameChange?: (value: string) => void;

  /** 템플릿 저장 버튼 클릭 시 호출 */
  onSaveTemplate?: () => void;

  /** 초기 접기 상태 (기본값: false - 펼쳐진 상태) */
  defaultCollapsed?: boolean;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({
  templateType,
  currentUserId,
  title,
  onTemplateSelect,
  onTemplateDeselect,
  onEditTemplate,
  onEditModeChange,
  editingTemplateId,
  saveFormData,
  onTemplateNameChange,
  onSaveTemplate,
  defaultCollapsed = false,
}) => {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // 템플릿 목록 로드
  useEffect(() => {
    fetchTemplates();
  }, [currentUserId, templateType]);

  const fetchTemplates = async () => {
    try {
      const allTemplates = await scheduleTemplateService.getUserTemplates(
        currentUserId
      );
      // 해당 타입의 템플릿만 필터링
      const filteredTemplates = allTemplates.filter(
        (t) => t.templateType === templateType
      );
      setTemplates(filteredTemplates);
    } catch (err) {
      console.error("템플릿 목록 조회 실패:", err);
      setError("템플릿 목록을 불러오는데 실패했습니다.");
    }
  };

  // 템플릿 선택/해제
  const handleSelectTemplate = (templateId: number) => {
    // 같은 템플릿을 다시 클릭하면 선택 해제
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      if (onTemplateDeselect) {
        onTemplateDeselect();
      }
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  // 템플릿 수정 모드 진입
  const handleEditTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (onEditModeChange) {
      onEditModeChange(true, templateId);
    }
    if (onEditTemplate) {
      onEditTemplate(template);
    }
  };

  // 템플릿 저장 (신규 생성)
  const handleCreateTemplate = async () => {
    if (!saveFormData) return;

    if (!saveFormData.templateName.trim()) {
      setError("템플릿 이름을 입력해주세요.");
      return;
    }

    if (saveFormData.templateName.length > 5) {
      setError("템플릿 이름은 최대 5자까지 입력 가능합니다.");
      return;
    }

    if (templates.length >= 5) {
      setError("템플릿은 최대 5개까지 저장할 수 있습니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: CreateScheduleTemplateRequest = {
        templateType,
        templateName: saveFormData.templateName,
        courtName: saveFormData.courtName,
        maxCapacity: saveFormData.maxCapacity,
        cost: saveFormData.cost,
        participationStartPattern: saveFormData.participationStartPattern,
      };

      await scheduleTemplateService.createTemplate(currentUserId, request);
      await fetchTemplates();

      if (onSaveTemplate) {
        onSaveTemplate();
      }

      setToastMessage("템플릿이 저장되었습니다.");
    } catch (err: unknown) {
      console.error("템플릿 저장 실패:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || "템플릿 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 업데이트
  const handleUpdateTemplate = async () => {
    if (!saveFormData || !editingTemplateId) return;

    if (!saveFormData.templateName.trim()) {
      setError("템플릿 이름을 입력해주세요.");
      return;
    }

    if (saveFormData.templateName.length > 5) {
      setError("템플릿 이름은 최대 5자까지 입력 가능합니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await scheduleTemplateService.updateTemplate(
        currentUserId,
        editingTemplateId,
        {
          templateName: saveFormData.templateName,
          courtName: saveFormData.courtName,
          maxCapacity: saveFormData.maxCapacity,
          cost: saveFormData.cost,
          participationStartPattern: saveFormData.participationStartPattern,
        }
      );

      await fetchTemplates();

      // Edit mode 종료
      if (onEditModeChange) {
        onEditModeChange(false, null);
      }

      if (onSaveTemplate) {
        onSaveTemplate();
      }

      setToastMessage("템플릿이 수정되었습니다.");
    } catch (err: unknown) {
      console.error("템플릿 수정 실패:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || "템플릿 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await scheduleTemplateService.deleteTemplate(currentUserId, templateId);
      await fetchTemplates();

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }

      // Edit mode 종료
      if (editingTemplateId === templateId && onEditModeChange) {
        onEditModeChange(false, null);
      }

      setToastMessage("템플릿이 삭제되었습니다.");
    } catch (err) {
      console.error("템플릿 삭제 실패:", err);
      setToastMessage("템플릿 삭제에 실패했습니다.");
    }
  };

  // Edit mode 취소
  const handleCancelEdit = () => {
    if (onEditModeChange) {
      onEditModeChange(false, null);
    }
  };

  const isEditMode =
    editingTemplateId !== null && editingTemplateId !== undefined;

  return (
    <div className="mb-3 p-2.5 md:p-2 bg-muted rounded-lg border border-border">
      <div className="flex justify-between items-center mb-2 md:mb-1.5">
        <div className="text-sm md:text-[13px] font-semibold text-foreground flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs md:text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded-[10px] border border-border">
            {templates.length} / 5
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="py-0.5 px-1.5 md:px-[5px] bg-transparent border border-border rounded text-muted-foreground text-[11px] md:text-[10px] cursor-pointer transition-all min-w-7 md:min-w-6 hover:bg-muted hover:border-primary hover:text-primary"
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {error && (
        <div className="py-2 px-3 bg-red-50 text-red-800 rounded text-[13px] mb-3">
          {error}
        </div>
      )}

      {/* 템플릿 pill-style 선택 (닫힘 상태에서도 표시) */}
      <div className="flex flex-wrap gap-1.5 min-h-0">
        {templates.length === 0 ? (
          <p className="text-muted-foreground text-[13px] md:text-xs italic m-0">
            저장된 템플릿이 없습니다.
          </p>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-1">
              <button
                type="button"
                className={cn(
                  "py-1.5 px-3 md:py-[5px] md:px-2.5 border-[1.5px] border-border bg-background rounded-2xl md:rounded-[14px] text-[13px] md:text-xs font-medium text-muted-foreground cursor-pointer transition-all whitespace-nowrap hover:border-primary hover:bg-primary/5 hover:text-primary",
                  selectedTemplateId === template.id &&
                    "border-2 border-primary bg-primary text-primary-foreground",
                  editingTemplateId === template.id &&
                    "border-2 border-amber-500 bg-amber-50 text-amber-800"
                )}
                onClick={() => handleSelectTemplate(template.id)}
              >
                {template.templateName}
              </button>

              {/* 선택된 템플릿에 대해 수정/삭제 버튼 표시 (열림 상태에서만) */}
              {!collapsed && selectedTemplateId === template.id && (
                <div className="flex gap-1.5 mt-1">
                  {editingTemplateId === template.id ? (
                    <button
                      type="button"
                      className="py-1 px-3 text-xs border-none rounded cursor-pointer transition-all font-medium bg-muted-foreground text-background hover:bg-muted-foreground/90"
                      onClick={handleCancelEdit}
                    >
                      취소
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="py-1 px-3 text-xs border-none rounded cursor-pointer transition-all font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      수정
                    </button>
                  )}
                  <button
                    type="button"
                    className="py-1 px-3 text-xs border-none rounded cursor-pointer transition-all font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 템플릿 저장 섹션 (열림 상태에서만 표시) */}
      {!collapsed && saveFormData && (
        <div className="p-3 md:p-2.5 bg-background rounded-md border border-dashed border-border mt-2">
          <div className="block text-sm md:text-[13px] font-semibold text-foreground mb-2">
            {isEditMode ? "템플릿 수정" : "새 템플릿 저장"}
          </div>
          <div className="flex gap-2 items-center max-[425px]:flex-col max-[425px]:gap-1.5">
            <input
              type="text"
              value={saveFormData.templateName}
              onChange={(e) => {
                if (onTemplateNameChange) {
                  onTemplateNameChange(e.target.value);
                }
              }}
              placeholder="템플릿 이름 (최대 5자)"
              maxLength={5}
              className="flex-1 py-2 px-3 md:py-1.5 md:px-2.5 border border-border rounded text-base bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed max-[425px]:w-full"
            />
            <button
              type="button"
              onClick={isEditMode ? handleUpdateTemplate : handleCreateTemplate}
              disabled={loading || (!isEditMode && templates.length >= 5)}
              className="py-2 px-4 md:py-1.5 md:px-3 bg-emerald-500 text-white border-none rounded text-sm md:text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed max-[425px]:w-full"
            >
              {loading ? "저장 중..." : isEditMode ? "수정" : "저장"}
            </button>
          </div>
          {!isEditMode && templates.length >= 5 && (
            <p className="mt-2 text-xs text-destructive">
              템플릿은 최대 5개까지 저장할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
};

export default TemplateSection;
