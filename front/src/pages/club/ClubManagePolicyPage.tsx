import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import { clubService } from "../../services/clubService";
import type { Club, UpdateClubPolicyRequest } from "../../types/club";
import { ArrowLeftIcon } from "../../components/common/Icons";
import { FEATURE_FLAGS } from "../../config/featureFlags";
import "./ClubManagePolicyPage.css";

const ClubManagePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [policy, setPolicy] = useState<UpdateClubPolicyRequest>({
    joinPolicy: "APPROVAL",
    interclubRecruitmentStatus: "CLOSED",
    memberRecruitmentStatus: "OPEN",
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
          joinPolicy: res.data.joinPolicy ?? "APPROVAL",
          interclubRecruitmentStatus:
            res.data.interclubRecruitmentStatus ?? "CLOSED",
          memberRecruitmentStatus: res.data.memberRecruitmentStatus ?? "OPEN",
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
      alert("저장되었습니다.");
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
        <div className="club-manage-policy-page__row">
          <div className="club-manage-policy-page__row-title">
            가입 승인 방식
          </div>
          <div className="club-manage-policy-page__row-desc">
            기본값은 <b>승인 필요</b>입니다.
          </div>
          <div className="club-manage-policy-page__seg">
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.joinPolicy === "APPROVAL" ? "active" : ""
              }`}
              onClick={() =>
                setPolicy((p) => ({ ...p, joinPolicy: "APPROVAL" }))
              }
              disabled={saving}
            >
              승인 필요
            </button>
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.joinPolicy === "AUTO" ? "active" : ""
              }`}
              onClick={() => setPolicy((p) => ({ ...p, joinPolicy: "AUTO" }))}
              disabled={saving}
            >
              자동 승인
            </button>
          </div>
        </div>

        {FEATURE_FLAGS.INTERCLUB_ENABLED && (
          <>
            <div className="club-manage-policy-page__divider" />

            <div className="club-manage-policy-page__row">
              <div className="club-manage-policy-page__row-title">
                교류전 모집 상태
              </div>
              <div className="club-manage-policy-page__row-desc">
                기본값은 <b>CLOSED</b>입니다.
              </div>
              <div className="club-manage-policy-page__seg">
                <button
                  type="button"
                  className={`club-manage-policy-page__seg-btn ${
                    policy.interclubRecruitmentStatus === "CLOSED" ? "active" : ""
                  }`}
                  onClick={() =>
                    setPolicy((p) => ({
                      ...p,
                      interclubRecruitmentStatus: "CLOSED",
                    }))
                  }
                  disabled={saving}
                >
                  CLOSED
                </button>
                <button
                  type="button"
                  className={`club-manage-policy-page__seg-btn ${
                    policy.interclubRecruitmentStatus === "OPEN" ? "active" : ""
                  }`}
                  onClick={() =>
                    setPolicy((p) => ({ ...p, interclubRecruitmentStatus: "OPEN" }))
                  }
                  disabled={saving}
                >
                  OPEN
                </button>
              </div>
            </div>
          </>
        )}

        <div className="club-manage-policy-page__divider" />

        <div className="club-manage-policy-page__row">
          <div className="club-manage-policy-page__row-title">
            신규회원 모집 상태
          </div>
          <div className="club-manage-policy-page__row-desc">
            기본값은 <b>모집중(OPEN)</b>입니다.
          </div>
          <div className="club-manage-policy-page__seg">
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.memberRecruitmentStatus === "OPEN" ? "active" : ""
              }`}
              onClick={() =>
                setPolicy((p) => ({ ...p, memberRecruitmentStatus: "OPEN" }))
              }
              disabled={saving}
            >
              모집중
            </button>
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.memberRecruitmentStatus === "CLOSED" ? "active" : ""
              }`}
              onClick={() =>
                setPolicy((p) => ({ ...p, memberRecruitmentStatus: "CLOSED" }))
              }
              disabled={saving}
            >
              모집안함
            </button>
          </div>
        </div>

        {policy.memberRecruitmentStatus === "OPEN" && (
          <>
            <div className="club-manage-policy-page__divider" />

            <div className="club-manage-policy-page__row">
              <div className="club-manage-policy-page__row-title">
                모집 안내문
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
