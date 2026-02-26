import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 위젯 메타데이터 정의 (확장 용이)
export interface WidgetConfig {
  id: string;
  label: string;
  description: string;
  adminOnly?: boolean; // 운영진 전용 위젯
}

// 위젯 목록 순서 (운영진인 경우 외부요청이 맨 위)
export const WIDGET_CONFIGS: WidgetConfig[] = [
  {
    id: "externalRequests",
    label: "외부 요청",
    description: "게스트/교류전 신청 현황을 보여줍니다",
    adminOnly: true,
  },
  {
    id: "upcomingSchedules",
    label: "다가오는 일정(클럽)",
    description: "클럽의 예정된 일정을 보여줍니다",
  },
  {
    id: "mySchedules",
    label: "다가오는 일정(개인)",
    description: "내가 참가 신청한 일정을 보여줍니다",
  },
  {
    id: "topPlayers",
    label: "최근 3개월 승점 Top 3",
    description: "클럽 내 상위 랭킹 멤버를 보여줍니다",
  },
  {
    id: "myRecentMatches",
    label: "나의 클럽 전적",
    description: "클럽 내 누적 전적과 최근 경기를 보여줍니다",
  },
];

// 역할별 기본 선택 위젯
export const DEFAULT_SELECTED_WIDGETS_ADMIN = [
  "externalRequests",
  "upcomingSchedules",
  "myRecentMatches",
];

export const DEFAULT_SELECTED_WIDGETS_REGULAR = [
  "upcomingSchedules",
  "topPlayers",
  "myRecentMatches",
];

// 기본 선택 위젯 (역할에 따라 반환)
export const getDefaultSelectedWidgets = (isAdmin: boolean): string[] => {
  return isAdmin ? DEFAULT_SELECTED_WIDGETS_ADMIN : DEFAULT_SELECTED_WIDGETS_REGULAR;
};

// 하위 호환용 (기존 코드에서 사용)
export const DEFAULT_SELECTED_WIDGETS = DEFAULT_SELECTED_WIDGETS_REGULAR;

interface Props {
  selectedWidgets: string[];
  onSave: (selected: string[]) => void;
  onClose: () => void;
  maxWidgets?: number;
  isAdmin?: boolean;
}

const WidgetSettingsModal: React.FC<Props> = ({
  selectedWidgets,
  onSave,
  onClose,
  maxWidgets = 3,
  isAdmin = false,
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedWidgets);

  // 외부에서 selectedWidgets가 변경되면 동기화
  useEffect(() => {
    setLocalSelected(selectedWidgets);
  }, [selectedWidgets]);

  const handleToggle = (widgetId: string) => {
    setLocalSelected((prev) => {
      if (prev.includes(widgetId)) {
        // 체크 해제
        return prev.filter((id) => id !== widgetId);
      } else {
        // 체크 추가 (최대 개수 제한)
        if (prev.length >= maxWidgets) {
          return prev; // 최대 개수 초과 시 무시
        }
        return [...prev, widgetId];
      }
    });
  };

  const handleSave = () => {
    onSave(localSelected);
    onClose();
  };

  // 표시할 위젯 목록 (운영진이 아니면 adminOnly 제외)
  const availableWidgets = WIDGET_CONFIGS.filter(
    (w) => !w.adminOnly || isAdmin
  );

  const isMaxSelected = localSelected.length >= maxWidgets;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>위젯 설정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            홈 화면에 표시할 위젯을 선택하세요 (최대 {maxWidgets}개)
          </p>

          <div className="flex flex-col gap-3">
            {availableWidgets.map((widget) => {
              const isSelected = localSelected.includes(widget.id);
              const isDisabled = !isSelected && isMaxSelected;

              return (
                <label
                  key={widget.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-white"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(widget.id)}
                    disabled={isDisabled}
                    className="w-[18px] h-[18px] mt-0.5 shrink-0 accent-primary cursor-inherit"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      {widget.label}
                      {widget.adminOnly && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          운영진
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {widget.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center font-medium">
            {localSelected.length} / {maxWidgets}개 선택됨
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={localSelected.length === 0}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetSettingsModal;
