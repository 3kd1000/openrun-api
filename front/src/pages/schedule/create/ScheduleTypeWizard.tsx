import { useState } from "react";
import { Users, Globe } from "lucide-react";
import { AppHeader } from "../../../components/common/AppHeader";
import { cn } from "../../../lib/utils";

interface ScheduleTypeWizardProps {
  hasClub: boolean;
  onSelect: (isPublic: boolean, dontShowAgain: boolean) => void;
  onBack: () => void;
}

export default function ScheduleTypeWizard({ hasClub, onSelect, onBack }: ScheduleTypeWizardProps) {
  const [selected, setSelected] = useState<"club" | "public" | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div className="page-container">
      <AppHeader title="일정 등록" onBack={onBack} />

      <div className="flex flex-col gap-6 py-4">
        <div className="text-center">
          <h2 className="text-base font-semibold text-foreground mb-1">
            어떤 일정을 만들까요?
          </h2>
          <p className="text-xs text-muted-foreground">
            목적에 맞는 일정 유형을 선택하세요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* 클럽일정 카드 */}
          <button
            type="button"
            disabled={!hasClub}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer bg-card",
              selected === "club"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
              !hasClub && "opacity-40 cursor-not-allowed hover:border-border"
            )}
            onClick={() => hasClub && setSelected("club")}
          >
            <div className="flex items-start gap-3">
              <Users className={cn(
                "mt-0.5 h-8 w-8 shrink-0",
                selected === "club" ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  클럽일정
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  소속 클럽 멤버만 참가할 수 있는 일정입니다.
                  클럽 내 코트 예약, 정기 모임 등에 활용하세요.
                </p>
                {!hasClub && (
                  <p className="text-xs text-destructive mt-1">
                    가입한 클럽이 없어 선택할 수 없습니다
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* 공개일정 카드 */}
          <button
            type="button"
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer bg-card",
              selected === "public"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
            onClick={() => setSelected("public")}
          >
            <div className="flex items-start gap-3">
              <Globe className={cn(
                "mt-0.5 h-8 w-8 shrink-0",
                selected === "public" ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  공개일정
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  누구나 참가 신청할 수 있는 일정입니다.
                  다른 클럽이나 개인 플레이어와 함께 칠 수 있습니다.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* 하단: 다음부터 보지않기 + 다음 버튼 */}
        <div className="flex flex-col gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer self-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-xs text-muted-foreground">다음부터 보지않기</span>
          </label>

          <button
            type="button"
            disabled={!selected}
            className={cn(
              "w-full py-3 rounded-lg text-sm font-medium transition-colors",
              selected
                ? "bg-primary text-white cursor-pointer hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={() => {
              if (selected) {
                onSelect(selected === "public", dontShowAgain);
              }
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
