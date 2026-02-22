import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../services/api/axiosInstance';
import type { Club } from '../../../types/club';
import { ArrowLeftIcon, CrownIcon, StarIcon, UserIcon, SettingsIcon, XIcon, ChevronRightIcon } from '../../../components/common/Icons';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import { canManageClub, normalizeClubRole } from '../../../utils/role';
import { getOpenRunSession } from '../../../utils/openrunSession';
import MemberProfileDrawer from '../../../components/MemberProfileDrawer';
import UserNameWithBadge from '../../../components/common/UserNameWithBadge';
import { useToast } from '../../../contexts/ToastContext';

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

  const { showToast } = useToast();
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
      showToast("저장되었습니다", "success");
    } catch (e: unknown) {
      logError("클럽원 역할 변경", e);
      showToast(getErrorMessage(e), "error");
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
      showToast("제명되었습니다", "success");
      await loadData();
    } catch (e: unknown) {
      logError("클럽원 제명", e);
      showToast(getErrorMessage(e), "error");
    } finally {
      setKickingUserId(null);
    }
  };

  const getRoleIcon = (role: string, size: number = 16) => {
    if (role === 'OWNER') {
      return <span className="text-primary"><CrownIcon size={size} /></span>;
    }
    if (role === 'ADMIN') {
      return <span className="text-primary/60"><StarIcon size={size} /></span>;
    }
    return <span className="text-muted-foreground"><UserIcon size={size} /></span>;
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

  // 역할에 따른 배지 색상 클래스
  const getRoleBadgeClass = (role: string) => {
    if (role === 'OWNER') {
      return 'text-primary font-medium';
    }
    if (role === 'ADMIN') {
      return 'text-primary/70 font-medium';
    }
    return 'text-muted-foreground';
  };

  // 역할에 따른 아이콘 컨테이너 배경색
  const getRoleIconBgClass = (role: string) => {
    if (role === 'OWNER') {
      return 'bg-primary/10';
    }
    if (role === 'ADMIN') {
      return 'bg-primary/5';
    }
    return 'bg-muted';
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
    <div className="page-container p-3 sm:p-4 lg:p-5 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">
          {club?.name ? `${club.name} 클럽원` : '클럽원 명단'}
        </span>
        {/* 편집 버튼이 없을 때도 레이아웃 균형 유지 */}
        {canEditRoles && !loading && !error ? (
          <button
            className="flex items-center gap-1 border border-gray-300 bg-white rounded-full px-3 py-2 text-sm font-semibold text-gray-700 cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => (isEditMode ? void handleSaveRoles() : setIsEditMode(true))}
            disabled={saving}
            type="button"
          >
            {isEditMode ? (
              dirtyCount > 0 ? `저장(${dirtyCount})` : "완료"
            ) : (
              <>
                <SettingsIcon size={16} />
                <span>권한편집</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* 멤버 수 요약 */}
      {!loading && !error && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-gray-200 mb-3 text-sm text-gray-500">
          <UserIcon size={16} />
          <span>총 {members.length}명</span>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            멤버 목록을 불러오는 중...
          </div>
        )}

        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && members.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-sm text-gray-400 m-0">아직 멤버가 없습니다.</p>
          </div>
        )}

        {!loading && !error && sortedMembers.length > 0 && (
          <div className="flex flex-col">
            {sortedMembers.map((member) => (
              <div
                key={member.memberId}
                className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 last:border-b-0 min-h-[44px] transition-colors"
                onClick={() => !isEditMode && setSelectedUserId(member.userId)}
                style={{ cursor: isEditMode ? 'default' : 'pointer' }}
              >
                {/* 역할 아이콘 */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${getRoleIconBgClass(member.role)}`}
                >
                  {getRoleIcon(member.role, 24)}
                </div>

                {/* 멤버 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 이름 + 어워드 뱃지 */}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-0.5">
                    <UserNameWithBadge userId={member.userId} userName={member.name} showPrimaryOnly />
                  </div>
                  {/* 역할 */}
                  <div className={`text-xs ${getRoleBadgeClass(member.role)}`}>
                    {isEditMode && member.role !== "OWNER" ? (
                      <select
                        className="mt-1 border border-gray-300 bg-white rounded-lg px-2 py-1 text-xs text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                  {/* 부가 정보 (테니스 시작시기, 가입일) */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {formatTennisStarted(member.tennisStartedAt) && (
                      <>
                        <span className="whitespace-nowrap">{formatTennisStarted(member.tennisStartedAt)} 시작</span>
                        <span className="text-gray-300">·</span>
                      </>
                    )}
                    <span className="whitespace-nowrap">가입 {formatJoinedAt(member.joinedAt)}</span>
                  </div>
                </div>

                {/* 액션 영역 */}
                <div className="flex items-center gap-1">
                  {isEditMode && isOwner && member.role !== "OWNER" && (
                    <button
                      className="flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-gray-400 cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
