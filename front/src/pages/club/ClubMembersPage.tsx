import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInstance';
import type { Club } from '../../types/club';
import { ArrowLeftIcon, CrownIcon, StarIcon, UserIcon, SettingsIcon, XIcon, ChevronRightIcon } from '../../components/common/Icons';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { canManageClub, normalizeClubRole } from '../../utils/role';
import { getOpenRunSession } from '../../utils/openrunSession';
import MemberProfileDrawer from '../../components/MemberProfileDrawer';
import './ClubMembersPage.css';

// 신규 API 응답 형식: GET /clubs/{clubId}/membership
interface ClubMembershipResponse {
  memberId: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'REGULAR';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  joinedAt: string;
  userId: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  tennisStartedAt: string | null; // 테니스 시작시기 (YYYY-MM-DD)
}

// 테니스 시작시기 포맷: "2021년 05월"
const formatTennisStarted = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}년 ${month}월`;
};

// 클럽 가입일 포맷: "2025.12.29"
const formatJoinedAt = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const ClubMembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [members, setMembers] = useState<ClubMembershipResponse[]>([]);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [roleDraftByUserId, setRoleDraftByUserId] = useState<Record<number, ClubMembershipResponse["role"]>>({});
  const [saving, setSaving] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const canManage = canManageClub(myRole);
  const isOwner = myRole === 'OWNER';
  // 역할 변경은 OWNER 전용이지만, 프론트에서는 우선 canManage(ADMIN+)에서 버튼 노출 후
  // 서버에서 최종 권한(OWNER)으로 한 번 더 막는다.
  const canEditRoles = canManage;

  const dirtyCount = useMemo(() => {
    const currentByUserId = new Map(members.map((m) => [m.userId, m.role]));
    return Object.entries(roleDraftByUserId).filter(([uid, role]) => currentByUserId.get(Number(uid)) !== role).length;
  }, [members, roleDraftByUserId]);

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 클럽 정보와 멤버 목록 동시 조회
      const [clubResponse, membersResponse] = await Promise.all([
        axiosInstance.get(`/clubs/${clubId}`),
        axiosInstance.get(`/clubs/${clubId}/membership`, {
          params: { status: 'ACTIVE' }
        })
      ]);

      setClub(clubResponse.data);
      setMembers(membersResponse.data);
      setRoleDraftByUserId(
        Object.fromEntries(
          (membersResponse.data as ClubMembershipResponse[]).map((m) => [m.userId, m.role])
        )
      );
    } catch (error: unknown) {
      logError('클럽원 목록 조회', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}`);
  };

  const handleSaveRoles = async () => {
    if (!clubId) return;
    const currentByUserId = new Map(members.map((m) => [m.userId, m.role]));
    const items = Object.entries(roleDraftByUserId)
      .map(([userIdStr, role]) => ({ userId: Number(userIdStr), role }))
      .filter((x) => Number.isFinite(x.userId))
      .filter((x) => currentByUserId.get(x.userId) !== x.role)
      // OWNER 변경은 서버에서 거절되지만 UX 상 미리 제거
      .filter((x) => x.role !== "OWNER");

    if (items.length === 0) {
      setIsEditMode(false);
      return;
    }

    if (!confirm(`역할 변경 ${items.length}건을 저장할까요?`)) return;
    try {
      setSaving(true);
      await axiosInstance.patch(`/clubs/${clubId}/members/roles`, { items });
      await loadData();
      setIsEditMode(false);
      alert("저장되었습니다.");
    } catch (e: unknown) {
      logError("클럽원 역할 변경", e);
      alert(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleKickMember = async (memberId: number, userName: string) => {
    if (!clubId) return;
    if (!confirm(`'${userName}' 님을 클럽에서 제명하시겠습니까?`)) return;

    try {
      setKickingUserId(memberId);
      await axiosInstance.delete(`/clubs/${clubId}/members/${memberId}`);
      alert("제명되었습니다.");
      await loadData();
    } catch (e: unknown) {
      logError("클럽원 제명", e);
      alert(getErrorMessage(e));
    } finally {
      setKickingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'OWNER') {
      return <CrownIcon size={16} color="#FFD700" />;
    }
    if (role === 'ADMIN') {
      return <StarIcon size={16} color="#4A90D9" />;
    }
    return null;
  };

  const getRoleName = (role: string) => {
    if (role === 'OWNER') {
      return '클럽장';
    }
    if (role === 'ADMIN') {
      return '운영진';
    }
    // legacy MEMBER, REGULAR
    return '정회원';
  };

  // 멤버를 역할순으로 정렬 (OWNER > ADMIN > REGULAR/MEMBER)
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = {
      OWNER: 0,
      ADMIN: 1,
      REGULAR: 2,
      MEMBER: 2, // legacy
    };
    return (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2);
  });

  return (
    <div className="club-members-page">
      {/* 헤더 */}
      <div className="club-members-page__header">
        <button className="club-members-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-members-page__title">
          {club?.name ? `${club.name} 클럽원` : '클럽원 명단'}
        </h1>
        <div className="club-members-page__header-spacer" />
        {canEditRoles && !loading && !error && (
          <button
            className="club-members-page__edit-btn"
            onClick={() => (isEditMode ? void handleSaveRoles() : setIsEditMode(true))}
            disabled={saving}
            type="button"
          >
            {isEditMode ? (
              dirtyCount > 0 ? `저장(${dirtyCount})` : "완료"
            ) : (
              <>
                <SettingsIcon size={16} />
                <span>편집</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 멤버 수 요약 */}
      {!loading && !error && (
        <div className="club-members-page__summary">
          <UserIcon size={16} />
          <span>총 {members.length}명</span>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="club-members-page__content">
        {loading && (
          <div className="club-members-page__loading">멤버 목록을 불러오는 중...</div>
        )}

        {error && (
          <div className="club-members-page__error">{error}</div>
        )}

        {!loading && !error && members.length === 0 && (
          <div className="club-members-page__empty">
            <p className="club-members-page__empty-icon">👥</p>
            <p className="club-members-page__empty-message">아직 멤버가 없습니다.</p>
          </div>
        )}

        {!loading && !error && sortedMembers.length > 0 && (
          <div className="club-members-page__list">
            {sortedMembers.map((member) => (
              <div
                key={member.memberId}
                className="club-members-page__item"
                onClick={() => !isEditMode && setSelectedUserId(member.userId)}
                style={{ cursor: isEditMode ? 'default' : 'pointer' }}
              >
                <div className="club-members-page__item-avatar">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} />
                  ) : (
                    <UserIcon size={24} />
                  )}
                </div>
                <div className="club-members-page__item-info">
                  <div className="club-members-page__item-name">
                    {member.name}
                    {getRoleIcon(member.role)}
                  </div>
                  <div className="club-members-page__item-role">
                    {isEditMode && member.role !== "OWNER" ? (
                      <select
                        className="club-members-page__role-select"
                        value={roleDraftByUserId[member.userId] ?? member.role}
                        onChange={(e) =>
                          setRoleDraftByUserId((prev) => ({
                            ...prev,
                            [member.userId]: e.target.value as ClubMembershipResponse["role"],
                          }))
                        }
                        disabled={saving}
                      >
                        <option value="REGULAR">정회원</option>
                        <option value="ADMIN">운영진</option>
                      </select>
                    ) : (
                      getRoleName(member.role)
                    )}
                  </div>
                  <div className="club-members-page__item-sub-info">
                    {formatTennisStarted(member.tennisStartedAt) && (
                      <span>{formatTennisStarted(member.tennisStartedAt)} 시작</span>
                    )}
                    <span>가입 {formatJoinedAt(member.joinedAt)}</span>
                  </div>
                </div>
                <div className="club-members-page__item-actions">
                  {isEditMode && isOwner && member.role !== "OWNER" && (
                    <button
                      className="club-members-page__item-kick"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKickMember(member.memberId, member.name);
                      }}
                      disabled={kickingUserId === member.memberId}
                      title="제명 (클럽장 전용)"
                    >
                      <XIcon size={18} />
                    </button>
                  )}
                  {!isEditMode && (
                    <ChevronRightIcon size={18} color="#999" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 멤버 프로필 드로어 */}
      {selectedUserId && clubId && (
        <MemberProfileDrawer
          clubId={Number(clubId)}
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default ClubMembersPage;
