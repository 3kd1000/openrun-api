import { MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Club } from "@/lib/types/club";

interface ClubCardProps {
  club: Club;
  onClick?: () => void;
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
  const region = [club.regionDepth1, club.regionDepth2]
    .filter(Boolean)
    .join(" ") || club.region;

  return (
    <Card
      className="cursor-pointer gap-0 py-0 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="px-3 py-2.5">
        {/* Header: Club name + Badge */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {club.name}
          </span>
          {club.autoJoinEnabled ? (
            <Badge variant="default" className="bg-primary text-xs">
              바로가입
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              승인제
            </Badge>
          )}
        </div>

        {/* Info rows + Description */}
        <div className="space-y-1 text-sm text-muted-foreground">
          {region && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{region}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{club.memberCount ?? 0}명</span>
          </div>
          {club.description && (
            <p className="line-clamp-2">
              {club.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
