import { CalendarDays, MapPin, Users, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PublicRecruitSchedule } from "@/lib/types/schedule";
import { formatScheduleDateTime } from "@/lib/utils/date-utils";

const matchTypeLabels: Record<string, string> = {
  MEN_DOUBLES: "남복",
  WOMEN_DOUBLES: "여복",
  MIXED_DOUBLES: "혼복",
  SINGLES: "단식",
  NONE: "",
};

const matchTypeColors: Record<string, string> = {
  MEN_DOUBLES: "bg-blue-100 text-blue-700",
  WOMEN_DOUBLES: "bg-pink-100 text-pink-700",
  MIXED_DOUBLES: "bg-purple-100 text-purple-700",
  SINGLES: "bg-amber-100 text-amber-700",
};

interface ScheduleCardProps {
  schedule: PublicRecruitSchedule;
  onClick?: () => void;
}

export default function ScheduleCard({ schedule, onClick }: ScheduleCardProps) {
  const participationRate =
    schedule.maxCapacity > 0
      ? (schedule.currentParticipants / schedule.maxCapacity) * 100
      : 0;

  const matchLabel = matchTypeLabels[schedule.matchType] || "";
  const matchColor = matchTypeColors[schedule.matchType] || "";

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header: Club name + Match type badge */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {schedule.clubName}
          </span>
          {matchLabel && (
            <Badge variant="secondary" className={matchColor}>
              {matchLabel}
            </Badge>
          )}
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formatScheduleDateTime(schedule.scheduledAt)}</span>
            {schedule.durationMinutes && (
              <span className="text-xs">
                ({schedule.durationMinutes}분)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{schedule.courtName}</span>
            {schedule.clubRegion && (
              <span className="text-xs text-muted-foreground/70">
                · {schedule.clubRegion}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {schedule.currentParticipants}/{schedule.maxCapacity}명
              </span>
            </div>
            {schedule.cost > 0 && (
              <div className="flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-foreground">
                  {schedule.cost.toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={participationRate} className="mt-3 h-1.5" />

        {/* Note */}
        {schedule.note && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {schedule.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
