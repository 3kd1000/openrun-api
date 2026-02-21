import React, { useState, useEffect } from "react";
import { useEscapeKey } from "../../../../../hooks/useEscapeKey";
import "./WidgetSettingsModal.css";

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

  useEscapeKey(onClose);

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content widget-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>위젯 설정</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="widget-settings-modal__body">
          <p className="widget-settings-modal__hint">
            홈 화면에 표시할 위젯을 선택하세요 (최대 {maxWidgets}개)
          </p>

          <div className="widget-settings-modal__list">
            {availableWidgets.map((widget) => {
              const isSelected = localSelected.includes(widget.id);
              const isDisabled = !isSelected && isMaxSelected;

              return (
                <label
                  key={widget.id}
                  className={`widget-settings-modal__item ${
                    isDisabled ? "disabled" : ""
                  } ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(widget.id)}
                    disabled={isDisabled}
                  />
                  <div className="widget-settings-modal__item-content">
                    <span className="widget-settings-modal__item-label">
                      {widget.label}
                      {widget.adminOnly && (
                        <span className="widget-settings-modal__admin-badge">
                          운영진
                        </span>
                      )}
                    </span>
                    <span className="widget-settings-modal__item-desc">
                      {widget.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="widget-settings-modal__count">
            {localSelected.length} / {maxWidgets}개 선택됨
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={localSelected.length === 0}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsModal;
