import React from "react";
import type { MyClub } from "../services/api/userApi";
import "./ClubSelector.css";

interface ClubSelectorProps {
  selectedClubId: number | null;
  onClubChange: (clubId: number | null) => void;
  clubs: MyClub[];
  isLoading: boolean;
  className?: string;
}

/**
 * ClubSelector 컴포넌트
 * - 사용자가 가입한 클럽 목록을 드롭다운으로 표시
 * - 클럽 선택 시 콜백 호출
 * - 가입한 클럽이 없으면 안내 메시지 표시
 * - 상위 컴포넌트(ClubLayout)에서 clubs와 isLoading을 props로 받음
 */
export const ClubSelector: React.FC<ClubSelectorProps> = ({
  selectedClubId,
  onClubChange,
  clubs,
  isLoading,
  className = "",
}) => {

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clubId = e.target.value ? parseInt(e.target.value) : null;
    onClubChange(clubId);
  };

  if (isLoading) {
    return (
      <div className={`club-selector ${className}`}>
        <select className="club-selector__select" disabled>
          <option>로딩 중...</option>
        </select>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className={`club-selector ${className}`}>
        <select className="club-selector__select" disabled>
          <option>가입한 클럽이 없습니다</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`club-selector ${className}`}>
      <select
        className="club-selector__select"
        value={selectedClubId ?? ""}
        onChange={handleChange}
      >
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  );
};
