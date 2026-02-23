import React from "react";
import type { MyClub } from "../services/api/userApi";

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

  const selectClassName = [
    "px-2 py-1 text-base font-bold border-0 border-b border-gray-300 rounded-none bg-white",
    "cursor-pointer min-h-[36px] text-center text-gray-900 transition-all",
    "focus:outline-none focus:border-b-primary focus:shadow-none",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50",
    "hover:enabled:border-b-primary",
    // Tablet
    "min-[426px]:max-[768px]:text-[length:var(--font-size-m)] min-[426px]:max-[768px]:min-h-[34px]",
    // Mobile Large
    "min-[360px]:max-[425px]:text-[length:var(--font-size-m)] min-[360px]:max-[425px]:min-h-[32px]",
    // Mobile Small
    "max-[359px]:text-[length:var(--font-size-s)] max-[359px]:px-1 max-[359px]:py-1 max-[359px]:min-h-[28px]",
    // Desktop
    "min-[769px]:text-[length:var(--font-size-l)] min-[769px]:min-h-[40px] min-[769px]:px-4 min-[769px]:py-2",
  ].join(" ");

  if (isLoading) {
    return (
      <div className={`flex justify-center w-full ${className}`}>
        <select className={selectClassName} disabled>
          <option>로딩 중...</option>
        </select>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className={`flex justify-center w-full ${className}`}>
        <select className={selectClassName} disabled>
          <option>가입한 클럽이 없습니다</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`flex justify-center w-full ${className}`}>
      <select
        className={selectClassName}
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
