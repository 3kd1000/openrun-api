import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  SettingsIcon,
  EditIcon,
  ChevronRightIcon,
} from "../../../components/common/Icons";
import BackButton from "../../../components/common/BackButton";
import { clubService } from "../../../services/clubService";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { useToast } from "../../../contexts/ToastContext";

const ClubCreateOnboardingPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const id = clubId ? Number(clubId) : null;

  const [recruitmentNote, setRecruitmentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClubPolicy = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get<Club>(`/clubs/${id}`);
      setRecruitmentNote(res.data.memberRecruitmentNote ?? "");
    } catch (e) {
      console.error("Failed to fetch club policy:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClubPolicy();
  }, [fetchClubPolicy]);

  const handleBack = () => {
    if (!clubId) {
      navigate("/clubs/explore");
      return;
    }
    navigate(`/clubs/${clubId}`);
  };

  const handleSaveRecruitmentNote = async () => {
    if (!id) return;
    try {
      setSaving(true);
      // 신규 생성된 클럽의 기본값 + 작성된 모집글로 저장
      await clubService.updateClubPolicy(id, {
        autoJoinEnabled: false,
        interclubRecruitmentOpen: false,
        memberRecruitmentOpen: true,
        memberRecruitmentNote: recruitmentNote.trim() || null,
      });
      setSaved(true);
    } catch (e) {
      console.error("Failed to save recruitment note:", e);
      showToast("모집글 저장에 실패했습니다", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!id || !Number.isFinite(id)) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <BackButton onClick={() => navigate("/clubs/explore")} />
          <h1 className="text-sm font-semibold">클럽 만들기 완료</h1>
          <div className="w-10" />
        </div>
        <div className="p-4 border border-red-500 bg-red-50 text-red-600 rounded-lg">
          클럽 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <BackButton onClick={handleBack} />
          <h1 className="text-sm font-semibold">클럽 만들기 완료</h1>
          <div className="w-10" />
        </div>
        <div className="text-center p-8 text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={handleBack} />
        <h1 className="text-sm font-semibold">클럽 만들기 완료</h1>
        <div className="w-10" />
      </div>

      {/* 모집글 작성 섹션 */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="text-lg font-semibold mb-1">
          회원 모집글 작성
        </div>
        <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
          가입 희망자에게 보여줄 모집 안내문을 작성해주세요.
          <br />
          가입 조건, 회비, 활동 일정 등을 안내하면 좋습니다.
        </div>

        <textarea
          className="w-full min-h-[100px] px-3 py-2 border border-input rounded-lg text-base font-[inherit] text-foreground bg-background resize-y mb-3 focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="예: 매주 토요일 오전 8시 정기 모임, 월 회비 3만원, 실력 무관 누구나 환영합니다!"
          value={recruitmentNote}
          onChange={(e) => {
            setRecruitmentNote(e.target.value);
            setSaved(false);
          }}
          disabled={saving}
          rows={5}
        />

        <button
          className="w-full py-3 px-6 border-none rounded-lg bg-primary text-white font-semibold text-base cursor-pointer hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSaveRecruitmentNote}
          disabled={saving}
        >
          {saving ? "저장 중..." : saved ? "저장 완료" : "모집글 저장"}
        </button>
      </div>

      {/* 추가 설정 CTA */}
      <div className="bg-white border border-border rounded-xl p-6 mt-4">
        <div className="text-lg font-semibold mb-1">
          다음 작업을 이어서 진행해보세요
        </div>
        <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
          가입 승인 방식은 <b>승인 필요</b>, 교류전 모집 상태는 <b>CLOSED</b>로
          시작합니다.
        </div>

        <button
          className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-white cursor-pointer mb-3 hover:bg-muted hover:border-primary transition-colors"
          onClick={() => navigate(`/clubs/${clubId}/manage/policy`)}
        >
          <span className="inline-flex items-center gap-3 font-semibold text-foreground">
            <SettingsIcon size={18} />
            운영 정책 설정
          </span>
          <ChevronRightIcon size={18} />
        </button>

        <button
          className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-white cursor-pointer mb-3 hover:bg-muted hover:border-primary transition-colors"
          onClick={() => navigate(`/clubs/${clubId}/manage/info`)}
        >
          <span className="inline-flex items-center gap-3 font-semibold text-foreground">
            <EditIcon size={18} />
            클럽 정보 수정
          </span>
          <ChevronRightIcon size={18} />
        </button>

        <button
          className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-white cursor-pointer mb-0 hover:bg-muted hover:border-primary transition-colors"
          onClick={() => navigate(`/clubs/${clubId}`)}
        >
          <span className="inline-flex items-center gap-3 font-semibold text-foreground">
            클럽 홈으로 이동
          </span>
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default ClubCreateOnboardingPage;
