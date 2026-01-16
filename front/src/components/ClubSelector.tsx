import React, { useState, useEffect } from "react";
import { getMyClubs, type MyClub } from "../services/api/userApi";
import "./ClubSelector.css";

interface ClubSelectorProps {
  selectedClubId: number | null;
  onClubChange: (clubId: number | null) => void;
  className?: string;
}

/**
 * ClubSelector 컴포넌트
 * - 사용자가 가입한 클럽 목록을 드롭다운으로 표시
 * - 클럽 선택 시 콜백 호출
 * - 가입한 클럽이 없으면 안내 메시지 표시
 */
export const ClubSelector: React.FC<ClubSelectorProps> = ({
  selectedClubId,
  onClubChange,
  className = "",
}) => {
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClubs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyClubs();
      setClubs(data);

      // 클럽이 있는데 선택된 클럽이 없으면 첫 번째 클럽 자동 선택
      if (data.length > 0 && !selectedClubId) {
        onClubChange(data[0].id);
      }
    } catch (err) {
      console.error("클럽 목록 조회 실패:", err);
      setError("클럽 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className={`club-selector ${className}`}>
        <select className="club-selector__select" disabled>
          <option>{error}</option>
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
