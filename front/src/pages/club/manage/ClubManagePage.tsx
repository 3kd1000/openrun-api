import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
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
import { getOpenRunSession } from "../../../utils/openrunSession";
import { normalizeClubRole } from "../../../utils/role";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
}> = ({ icon, label, onClick, danger, last }) => (
  <button
    className={`flex items-center gap-3 w-full px-4 py-3 min-h-[52px] bg-transparent border-none cursor-pointer transition-colors hover:bg-muted text-sm text-left ${
      !last ? "border-b border-border" : ""
    } ${danger ? "text-amber-700" : "text-foreground"}`}
    onClick={onClick}
  >
    <span className={`flex items-center ${danger ? "text-amber-600" : "text-muted-foreground"}`}>
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    <ChevronRightIcon size={16} className="text-muted-foreground" />
  </button>
);

const ClubManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const isOwner = myRole === "OWNER";

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.get(`/clubs/${clubId}`);
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
            <MenuItem icon={<EditIcon size={18} />} label="클럽 정보" onClick={() => navigate(`/clubs/${clubId}/manage/info`)} />
            <MenuItem icon={<SettingsIcon size={18} />} label="운영 정책" onClick={() => navigate(`/clubs/${clubId}/manage/policy`)} last />
          </div>
        </div>

        {/* 콘텐츠 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">콘텐츠 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<FileTextIcon size={18} />} label="공지사항 / 회칙" onClick={() => navigate(`/clubs/${clubId}/manage/content`)} last />
          </div>
        </div>

        {/* 회원 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">회원 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<InboxIcon size={18} />} label="가입관리" onClick={() => navigate(`/clubs/${clubId}/manage/external-requests`)} last />
          </div>
        </div>

        {/* 활동 관리 */}
        <div>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">활동 관리</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <MenuItem icon={<TrophyIcon size={18} />} label="어워드 관리" onClick={() => navigate(`/clubs/${clubId}/manage/award`)} />
            <MenuItem icon={<ScaleIcon size={18} />} label="공용구 관리" onClick={() => navigate(`/clubs/${clubId}/manage/balls`)} last />
          </div>
        </div>

        {/* 클럽장 전용 */}
        {isOwner && (
          <div>
            <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">클럽장 전용</p>
            <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
              <MenuItem icon={<CrownIcon size={18} />} label="클럽장 권한 양도" onClick={() => navigate(`/clubs/${clubId}/manage/transfer-ownership`)} danger last />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubManagePage;
