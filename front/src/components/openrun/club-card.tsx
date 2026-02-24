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
      <CardContent className="px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-3">
          {/* 클럽 로고 썸네일 */}
          {club.logoThumbnailUrl ? (
            <img
              src={club.logoThumbnailUrl}
              alt={`${club.name} 로고`}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header: Club name + Badge */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {club.name}
              </span>
              {club.autoJoinEnabled ? (
                <Badge variant="default" className="bg-primary text-xs shrink-0">
                  바로가입
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs shrink-0">
                  승인제
                </Badge>
              )}
            </div>

            {/* Info rows + Description */}
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                {region && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {region}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {club.memberCount ?? 0}명
                </span>
              </div>
              {club.description && (
                <p className="line-clamp-2 mb-0">
                  {club.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
