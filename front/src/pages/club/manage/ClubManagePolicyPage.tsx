import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { Club, UpdateClubPolicyRequest } from "../../../types/club";
import { ArrowLeftIcon } from "../../../components/common/Icons";
import { FEATURE_FLAGS } from "../../../config/featureFlags";
import { useToast } from "../../../contexts/ToastContext";

const ClubManagePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  const [policy, setPolicy] = useState<UpdateClubPolicyRequest>({
    autoJoinEnabled: false,
    interclubRecruitmentOpen: false,
    memberRecruitmentOpen: true,
    memberRecruitmentNote: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!clubId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get<Club>(`/clubs/${clubId}`);
        setPolicy({
          autoJoinEnabled: res.data.autoJoinEnabled ?? false,
          interclubRecruitmentOpen: res.data.interclubRecruitmentOpen ?? false,
          memberRecruitmentOpen: res.data.memberRecruitmentOpen ?? true,
          memberRecruitmentNote: res.data.memberRecruitmentNote ?? "",
        });
      } catch (e) {
        console.error(e);
        setError("운영 정책을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  const handleBack = () => navigate(`/clubs/${clubId}/manage`);

  const handleSave = async () => {
    if (!clubId) return;
    try {
      setSaving(true);
      setError(null);
      await clubService.updateClubPolicy(Number(clubId), policy);
      showToast("저장되었습니다", "success");
    } catch (e) {
      console.error(e);
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="text-center py-10 text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="page-container px-3 py-2 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">운영 정책</span>
        <div className="w-9 h-9" />
      </div>

      {/* Hint */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
        클럽의 운영 정책을 설정합니다.
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 mb-3 border border-red-400 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section Card */}
      <div className="bg-white border border-border rounded-xl p-4">
        {/* 자동 가입 승인 */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-900">자동 가입 승인</span>
            <span className="text-xs text-gray-400 leading-snug">활성화 시 가입 신청이 자동으로 승인됩니다</span>
          </div>
          <button
            type="button"
            onClick={() => setPolicy((p) => ({ ...p, autoJoinEnabled: !p.autoJoinEnabled }))}
            disabled={saving}
            aria-label="자동 가입 승인 토글"
            className={[
              "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              policy.autoJoinEnabled
                ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                : "bg-gray-300 hover:bg-gray-400",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                policy.autoJoinEnabled ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        {FEATURE_FLAGS.INTERCLUB_ENABLED && (
          <>
            <div className="h-px bg-border my-4" />

            {/* 교류전 모집 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">교류전 모집</span>
                <span className="text-xs text-gray-400 leading-snug">활성화 시 다른 클럽에서 교류전 신청 가능</span>
              </div>
              <button
                type="button"
                onClick={() => setPolicy((p) => ({ ...p, interclubRecruitmentOpen: !p.interclubRecruitmentOpen }))}
                disabled={saving}
                aria-label="교류전 모집 토글"
                className={[
                  "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  policy.interclubRecruitmentOpen
                    ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                    : "bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                    policy.interclubRecruitmentOpen ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </>
        )}

        <div className="h-px bg-border my-4" />

        {/* 신규회원 모집 */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-900">신규회원 모집</span>
            <span className="text-xs text-gray-400 leading-snug">활성화 시 클럽 상세에서 가입 신청 가능</span>
          </div>
          <button
            type="button"
            onClick={() => setPolicy((p) => ({ ...p, memberRecruitmentOpen: !p.memberRecruitmentOpen }))}
            disabled={saving}
            aria-label="신규회원 모집 토글"
            className={[
              "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              policy.memberRecruitmentOpen
                ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                : "bg-gray-300 hover:bg-gray-400",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                policy.memberRecruitmentOpen ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        {policy.memberRecruitmentOpen && (
          <>
            <div className="h-px bg-border my-4" />

            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold text-gray-900">
                신규회원 모집 안내문
              </div>
              <div className="text-xs text-gray-400">
                클럽 상세 페이지에서 가입 희망자에게 표시됩니다.
              </div>
              <textarea
                className={[
                  "w-full min-h-[100px] px-3 py-2 mt-2 border-[1.5px] border-gray-300 rounded-lg",
                  "text-sm font-[inherit] text-gray-900 bg-white resize-y box-border",
                  "focus:outline-none focus:border-primary",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
                placeholder="가입 조건, 회비, 활동 일정 등 안내 사항을 작성해주세요."
                value={policy.memberRecruitmentNote ?? ""}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, memberRecruitmentNote: e.target.value }))
                }
                disabled={saving}
                rows={5}
              />
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-3 py-3 bg-primary text-white rounded-lg font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
};

export default ClubManagePolicyPage;
