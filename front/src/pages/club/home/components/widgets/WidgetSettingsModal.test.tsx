import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WidgetSettingsModal, {
  WIDGET_CONFIGS,
  getDefaultSelectedWidgets,
  DEFAULT_SELECTED_WIDGETS_ADMIN,
  DEFAULT_SELECTED_WIDGETS_REGULAR,
} from "./WidgetSettingsModal";

describe("WidgetSettingsModal", () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("렌더링", () => {
    it("모달 제목이 표시되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole("heading", { name: "위젯 설정" })).toBeInTheDocument();
    });

    it("일반 사용자에게는 운영진 전용 위젯이 표시되지 않아야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          isAdmin={false}
        />
      );

      expect(screen.queryByText("외부 요청")).not.toBeInTheDocument();
      expect(screen.getByText("다가오는 일정(클럽)")).toBeInTheDocument();
    });

    it("운영진에게는 외부 요청 위젯이 표시되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          isAdmin={true}
        />
      );

      expect(screen.getByText("외부 요청")).toBeInTheDocument();
    });

    it("운영진 배지가 표시되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          isAdmin={true}
        />
      );

      expect(screen.getByText("운영진")).toBeInTheDocument();
    });

    it("선택된 위젯 개수가 표시되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules", "mySchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          maxWidgets={3}
        />
      );

      expect(screen.getByText("2 / 3개 선택됨")).toBeInTheDocument();
    });
  });

  describe("위젯 선택", () => {
    it("위젯을 선택할 수 있어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          maxWidgets={3}
        />
      );

      const mySchedulesCheckbox = screen.getByRole("checkbox", {
        name: /다가오는 일정\(개인\)/,
      });
      fireEvent.click(mySchedulesCheckbox);

      expect(mySchedulesCheckbox).toBeChecked();
    });

    it("이미 선택된 위젯을 해제할 수 있어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules", "mySchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          maxWidgets={3}
        />
      );

      const mySchedulesCheckbox = screen.getByRole("checkbox", {
        name: /다가오는 일정\(개인\)/,
      });
      fireEvent.click(mySchedulesCheckbox);

      expect(mySchedulesCheckbox).not.toBeChecked();
    });

    it("최대 개수에 도달하면 추가 선택이 불가능해야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules", "mySchedules", "topPlayers"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          maxWidgets={3}
        />
      );

      const myRecentMatchesCheckbox = screen.getByRole("checkbox", {
        name: /나의 최근 전적/,
      });

      expect(myRecentMatchesCheckbox).toBeDisabled();
    });

    it("위젯을 해제하면 다른 위젯 선택이 가능해져야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules", "mySchedules", "topPlayers"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
          maxWidgets={3}
        />
      );

      // 하나 해제
      const topPlayersCheckbox = screen.getByRole("checkbox", {
        name: /최근 3개월 승점/,
      });
      fireEvent.click(topPlayersCheckbox);

      // 다른 위젯이 활성화되어야 함
      const myRecentMatchesCheckbox = screen.getByRole("checkbox", {
        name: /나의 최근 전적/,
      });
      expect(myRecentMatchesCheckbox).not.toBeDisabled();
    });
  });

  describe("저장 및 취소", () => {
    it("저장 버튼 클릭 시 onSave가 호출되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules", "mySchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "저장" }));

      expect(mockOnSave).toHaveBeenCalledWith(["upcomingSchedules", "mySchedules"]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("취소 버튼 클릭 시 onClose만 호출되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "취소" }));

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("선택된 위젯이 없으면 저장 버튼이 비활성화되어야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={[]}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    });
  });

  describe("모달 오버레이", () => {
    it("모달 내부 클릭 시 닫히지 않아야 함", () => {
      render(
        <WidgetSettingsModal
          selectedWidgets={["upcomingSchedules"]}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // 모달 내부 클릭
      fireEvent.click(screen.getByRole("heading", { name: "위젯 설정" }));

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});

describe("위젯 설정 유틸리티", () => {
  describe("WIDGET_CONFIGS", () => {
    it("5개의 위젯이 정의되어 있어야 함", () => {
      expect(WIDGET_CONFIGS).toHaveLength(5);
    });

    it("외부 요청이 첫 번째로 정의되어 있어야 함 (운영진용)", () => {
      expect(WIDGET_CONFIGS[0].id).toBe("externalRequests");
      expect(WIDGET_CONFIGS[0].adminOnly).toBe(true);
    });

    it("모든 위젯에 id, label, description이 있어야 함", () => {
      WIDGET_CONFIGS.forEach((widget) => {
        expect(widget.id).toBeTruthy();
        expect(widget.label).toBeTruthy();
        expect(widget.description).toBeTruthy();
      });
    });
  });

  describe("getDefaultSelectedWidgets", () => {
    it("운영진인 경우 외부요청, 다가오는일정(클럽), 나의최근전적을 반환해야 함", () => {
      const result = getDefaultSelectedWidgets(true);

      expect(result).toEqual(DEFAULT_SELECTED_WIDGETS_ADMIN);
      expect(result).toContain("externalRequests");
      expect(result).toContain("upcomingSchedules");
      expect(result).toContain("myRecentMatches");
    });

    it("일반 회원인 경우 다가오는일정(클럽), 최근3개월승점, 나의최근전적을 반환해야 함", () => {
      const result = getDefaultSelectedWidgets(false);

      expect(result).toEqual(DEFAULT_SELECTED_WIDGETS_REGULAR);
      expect(result).toContain("upcomingSchedules");
      expect(result).toContain("topPlayers");
      expect(result).toContain("myRecentMatches");
      expect(result).not.toContain("externalRequests");
    });
  });
});
