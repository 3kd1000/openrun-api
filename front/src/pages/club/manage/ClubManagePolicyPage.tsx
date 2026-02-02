import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { Club, UpdateClubPolicyRequest } from "../../../types/club";
import { ArrowLeftIcon } from "../../../components/common/Icons";
import { FEATURE_FLAGS } from "../../../config/featureFlags";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubManagePolicyPage.css";

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
      <div className="club-manage-policy-page">
        <div className="club-manage-policy-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-manage-policy-page">
      <div className="club-manage-policy-page__header">
        <button
          className="club-manage-policy-page__back-btn"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-policy-page__title">운영 정책</h1>
        <div className="club-manage-policy-page__header-spacer" />
      </div>

      <div className="club-manage-policy-page__hint">
        클럽의 운영 정책을 설정합니다.
      </div>

      {error && <div className="club-manage-policy-page__error">{error}</div>}

      <div className="club-manage-policy-page__section">
        {/* 자동 가입 승인 */}
        <div className="club-manage-policy-page__toggle-row">
          <div className="club-manage-policy-page__toggle-label">
            <span className="club-manage-policy-page__toggle-title">자동 가입 승인</span>
            <span className="club-manage-policy-page__toggle-desc">활성화 시 가입 신청이 자동으로 승인됩니다</span>
          </div>
          <button
            type="button"
            className={`club-manage-policy-page__toggle ${policy.autoJoinEnabled ? "active" : ""}`}
            onClick={() => setPolicy((p) => ({ ...p, autoJoinEnabled: !p.autoJoinEnabled }))}
            disabled={saving}
            aria-label="자동 가입 승인 토글"
          >
            <span className="club-manage-policy-page__toggle-slider" />
          </button>
        </div>

        {FEATURE_FLAGS.INTERCLUB_ENABLED && (
          <>
            <div className="club-manage-policy-page__divider" />

            {/* 교류전 모집 */}
            <div className="club-manage-policy-page__toggle-row">
              <div className="club-manage-policy-page__toggle-label">
                <span className="club-manage-policy-page__toggle-title">교류전 모집</span>
                <span className="club-manage-policy-page__toggle-desc">활성화 시 다른 클럽에서 교류전 신청 가능</span>
              </div>
              <button
                type="button"
                className={`club-manage-policy-page__toggle ${policy.interclubRecruitmentOpen ? "active" : ""}`}
                onClick={() => setPolicy((p) => ({ ...p, interclubRecruitmentOpen: !p.interclubRecruitmentOpen }))}
                disabled={saving}
                aria-label="교류전 모집 토글"
              >
                <span className="club-manage-policy-page__toggle-slider" />
              </button>
            </div>
          </>
        )}

        <div className="club-manage-policy-page__divider" />

        {/* 신규회원 모집 */}
        <div className="club-manage-policy-page__toggle-row">
          <div className="club-manage-policy-page__toggle-label">
            <span className="club-manage-policy-page__toggle-title">신규회원 모집</span>
            <span className="club-manage-policy-page__toggle-desc">활성화 시 클럽 상세에서 가입 신청 가능</span>
          </div>
          <button
            type="button"
            className={`club-manage-policy-page__toggle ${policy.memberRecruitmentOpen ? "active" : ""}`}
            onClick={() => setPolicy((p) => ({ ...p, memberRecruitmentOpen: !p.memberRecruitmentOpen }))}
            disabled={saving}
            aria-label="신규회원 모집 토글"
          >
            <span className="club-manage-policy-page__toggle-slider" />
          </button>
        </div>

        {policy.memberRecruitmentOpen && (
          <>
            <div className="club-manage-policy-page__divider" />

            <div className="club-manage-policy-page__row">
              <div className="club-manage-policy-page__row-title">
                신규회원 모집 안내문
              </div>
              <div className="club-manage-policy-page__row-desc">
                클럽 상세 페이지에서 가입 희망자에게 표시됩니다.
              </div>
              <textarea
                className="club-manage-policy-page__textarea"
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

      <button
        className="club-manage-policy-page__save"
        type="button"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
};

export default ClubManagePolicyPage;
