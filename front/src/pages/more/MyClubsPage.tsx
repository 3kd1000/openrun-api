import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { MyClub } from "../../services/api/userApi";
import { getMyClubs, syncClubList } from "../../services/api/userApi";
import axiosInstance from "../../services/api/axiosInstance";
import { clubService } from "../../services/clubService";
import { isNotEmpty } from "../../utils/isEmpty";
import { UsersIcon } from "../../components/common/Icons";
import { AppHeader } from "../../components/common/AppHeader";
import { useToast } from "../../contexts/ToastContext";

const MyClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingClubId, setLeavingClubId] = useState<number | null>(null);
  const [unreadByClubId, setUnreadByClubId] = useState<Record<number, number>>(
    {}
  );

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const data = await getMyClubs();
      setClubs(data);
      // 공지 unread dot
      const results = await Promise.allSettled(
        data.map(async (c) => {
          const res = await clubService.getClubNoticeUnreadCount(c.id);
          return [c.id, res.unreadCount] as const;
        })
      );
      const next: Record<number, number> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          const [id, count] = r.value;
          next[id] = count;
        }
      }
      setUnreadByClubId(next);
    } catch (error) {
      console.error("내 클럽 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveClub = async (clubId: number, clubName: string) => {
    if (!confirm(`'${clubName}' 클럽에서 탈퇴하시겠습니까?`)) {
      return;
    }

    setLeavingClubId(clubId);
    try {
      await axiosInstance.delete(`/clubs/${clubId}/members/me`);
      showToast("클럽 탈퇴가 완료되었습니다", "success");
      loadClubs(); // 목록 새로고침
      await syncClubList(); // 세션 clubList 업데이트
    } catch (error: unknown) {
      console.error("클럽 탈퇴 실패:", error);
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errorMessage || "클럽 탈퇴에 실패했습니다", "error");
    } finally {
      setLeavingClubId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="가입한 클럽" onBack={() => navigate(-1)} />
      <div className="max-w-[600px] mx-auto p-4">

        {isLoading ? (
          <div className="text-center py-8 text-base text-muted-foreground">로딩 중...</div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4 flex items-center justify-center text-muted-foreground">
              <UsersIcon size={64} />
            </p>
            <p className="text-base text-muted-foreground m-0">가입한 클럽이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="bg-card border border-border rounded-md p-6 max-[768px]:p-4 max-[425px]:p-3 max-[359px]:p-3 transition-all duration-200 hover:shadow-md hover:border-primary"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="shrink-0 w-12 h-12 max-[768px]:w-11 max-[768px]:h-11 max-[425px]:w-10 max-[425px]:h-10 max-[359px]:w-9 max-[359px]:h-9 flex items-center justify-center bg-muted rounded-full text-muted-foreground">
                    <UsersIcon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mb-1">
                      {club.name}
                      {(unreadByClubId[club.id] ?? 0) > 0 && (
                        <span
                          className="inline-block w-1.5 h-1.5 ml-1.5 rounded-full bg-red-500 align-middle"
                          aria-label="읽지 않은 공지 있음"
                        />
                      )}
                    </div>
                    {isNotEmpty(club.description) && (
                      <div className="text-sm max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{club.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 max-[425px]:px-3 max-[425px]:py-1 max-[359px]:px-3 max-[359px]:py-1 rounded-sm text-sm max-[425px]:text-sm max-[359px]:text-sm font-semibold cursor-pointer transition-all duration-200 border border-primary bg-primary text-white min-w-[80px] max-[768px]:min-w-[70px] max-[425px]:min-w-[60px] max-[359px]:min-w-[55px] hover:bg-primary/90 hover:-translate-y-px hover:shadow-sm"
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    바로가기
                  </button>
                  <button
                    className="px-4 py-2 max-[425px]:px-3 max-[425px]:py-1 max-[359px]:px-3 max-[359px]:py-1 rounded-sm text-sm max-[425px]:text-sm max-[359px]:text-sm font-semibold cursor-pointer transition-all duration-200 border border-destructive bg-card text-destructive min-w-[80px] max-[768px]:min-w-[70px] max-[425px]:min-w-[60px] max-[359px]:min-w-[55px] enabled:hover:bg-destructive enabled:hover:text-white enabled:hover:-translate-y-px enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleLeaveClub(club.id, club.name)}
                    disabled={leavingClubId === club.id}
                  >
                    {leavingClubId === club.id ? "처리중..." : "탈퇴"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClubsPage;
