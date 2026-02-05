import { useState, useEffect, useMemo } from "react";
import type { ClubMemberInfo } from "../services/notificationService";
import { getClubMembers } from "../services/notificationService";
import "./MemberSelectModal.css";

interface MemberSelectModalProps {
  clubId: number;
  initialSelectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  onClose: () => void;
}

function MemberSelectModal({
  clubId,
  initialSelectedIds,
  onConfirm,
  onClose,
}: MemberSelectModalProps) {
  const [members, setMembers] = useState<ClubMemberInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialSelectedIds)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getClubMembers(clubId)
      .then(setMembers)
      .catch(() => setError("멤버 목록 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, [clubId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        String(m.id).includes(query)
    );
  }, [members, searchQuery]);

  const handleToggle = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredMembers.map((m) => m.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    const allFilteredIds = new Set(filteredMembers.map((m) => m.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const allFilteredSelected = filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.id));

  return (
    <div className="member-modal__backdrop" onClick={handleBackdropClick}>
      <div className="member-modal">
        <div className="member-modal__header">
          <h3>클럽원 선택</h3>
          <button className="member-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="member-modal__search">
          <input
            type="text"
            placeholder="이름 또는 ID로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="member-modal__actions">
          <button
            type="button"
            className="member-modal__action-btn"
            onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
          >
            {allFilteredSelected ? "전체 해제" : "전체 선택"}
          </button>
          <span className="member-modal__count">
            {selectedIds.size}명 선택됨
          </span>
        </div>

        <div className="member-modal__body">
          {loading && <p className="member-modal__status">로딩 중...</p>}
          {error && <p className="member-modal__status member-modal__status--error">{error}</p>}
          {!loading && !error && filteredMembers.length === 0 && (
            <p className="member-modal__status">
              {searchQuery ? "검색 결과가 없습니다." : "활성 멤버가 없습니다."}
            </p>
          )}
          {!loading && !error && filteredMembers.length > 0 && (
            <table className="member-modal__table">
              <thead>
                <tr>
                  <th className="member-modal__th-check"></th>
                  <th>ID</th>
                  <th>이름</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={selectedIds.has(member.id) ? "selected" : ""}
                    onClick={() => handleToggle(member.id)}
                  >
                    <td className="member-modal__td-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => handleToggle(member.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{member.id}</td>
                    <td>{member.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="member-modal__footer">
          <button
            type="button"
            className="member-modal__cancel-btn"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="member-modal__confirm-btn"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            선택 완료 ({selectedIds.size}명)
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberSelectModal;
