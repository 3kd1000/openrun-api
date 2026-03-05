import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  InboxIcon,
  FileTextIcon,
  ChevronRightIcon,
  EditIcon,
  SettingsIcon,
  CrownIcon,
  ScaleIcon,
  TrophyIcon,
} from "../../../components/common/Icons";
import { Headphones, Lock } from "lucide-react";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { canManageClub, normalizeClubRole } from "../../../utils/role";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import { userService } from "../../../services/userService";
import { useToast } from "../../../contexts/ToastContext";

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, danger, last, disabled }) => (
  <button
    className={`flex items-center gap-3 w-full px-4 py-3 min-h-[52px] bg-transparent border-none cursor-pointer transition-colors hover:bg-muted text-sm text-left ${
      !last ? "border-b border-border" : ""
    } ${danger ? "text-amber-700" : "text-foreground"} ${disabled ? "opacity-50" : ""}`}
    onClick={onClick}
  >
    <span className={`flex items-center ${danger ? "text-amber-600" : "text-muted-foreground"}`}>
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    {disabled ? (
      <Lock size={14} className="text-muted-foreground" />
    ) : (
      <ChevronRightIcon size={16} className="text-muted-foreground" />
    )}
  </button>
);

const ClubManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<number | null>(null);

  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const isOwner = myRole === "OWNER";
  const canManage = canManageClub(myRole);

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const operator = await userService.getOperatorProfile();
      setOperatorId(operator.id);
    } catch (error: unknown) {
      logError("클럽 관리 데이터 조회", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}`);
  };

  const handleAdminAction = (path: string) => {
    if (!canManage) {
      showToast("운영진 이상만 이용 가능합니다", "info");
      return;
    }
    navigate(path);
  };

  if (loading) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="py-10 text-center text-muted-foreground text-sm">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="flex items-center justify-between py-2 mb-3">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground" onClick={handleBack}>
            <ArrowLeftIcon size={20} />
          </button>
          <span className="flex-1 text-center text-sm font-bold text-foreground">클럽 관리</span>
          <div className="w-9 h-9" />
        </div>
        <div className="py-10 text-center text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container px-3 py-2 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">
          클럽 관리
        </span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex flex-col gap-4">
        {/* 기본 설정 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">기본 설정</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<EditIcon size={18} />} label="클럽 정보" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/info`)} disabled={!canManage} />
            <MenuItem icon={<SettingsIcon size={18} />} label="운영 정책" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/policy`)} disabled={!canManage} last />
          </div>
        </div>

        {/* 콘텐츠 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">콘텐츠 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<FileTextIcon size={18} />} label="공지사항 / 회칙" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/content`)} disabled={!canManage} last />
          </div>
        </div>

        {/* 회원 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">회원 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<InboxIcon size={18} />} label="가입관리" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/external-requests`)} disabled={!canManage} last />
          </div>
        </div>

        {/* 활동 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">활동 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<TrophyIcon size={18} />} label="랭킹 & 어워드 설정" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/award`)} disabled={!canManage} />
            <MenuItem icon={<ScaleIcon size={18} />} label="공용구 관리" onClick={() => handleAdminAction(`/clubs/${clubId}/manage/balls`)} disabled={!canManage} last />
          </div>
        </div>

        {/* 클럽장 전용 — 파괴적/민감 행위이므로 OWNER에게만 표시 */}
        {isOwner && (
          <div>
            <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">클럽장 전용</p>
            <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
              <MenuItem icon={<CrownIcon size={18} />} label="클럽장 권한 양도" onClick={() => navigate(`/clubs/${clubId}/manage/transfer-ownership`)} danger last />
            </div>
          </div>
        )}

        {/* 운영자 문의 */}
        {operatorId && (
          <button
            type="button"
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer transition-colors hover:bg-primary/10 text-left"
            onClick={() => navigate(`/messages/${operatorId}`)}
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Headphones size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-primary">운영자에게 문의하기</div>
              <p className="text-xs text-muted-foreground">설정 방법, 기능 안내 등 도움이 필요하면 DM을 보내세요</p>
            </div>
            <ChevronRightIcon size={16} className="text-primary/50" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClubManagePage;
