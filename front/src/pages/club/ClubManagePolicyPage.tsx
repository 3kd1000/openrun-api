import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import { clubService } from "../../services/clubService";
import type { Club, UpdateClubPolicyRequest } from "../../types/club";
import { ArrowLeftIcon, StarIcon } from "../../components/common/Icons";
import "./ClubManagePolicyPage.css";

const ClubManagePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [club, setClub] = useState<Club | null>(null);
  const [policy, setPolicy] = useState<UpdateClubPolicyRequest>({
    joinPolicy: "APPROVAL",
    interclubRecruitmentStatus: "CLOSED",
    memberRecruitmentStatus: "OPEN",
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
        setClub(res.data);
        setPolicy({
          joinPolicy: res.data.joinPolicy ?? "APPROVAL",
          interclubRecruitmentStatus:
            res.data.interclubRecruitmentStatus ?? "CLOSED",
          memberRecruitmentStatus: res.data.memberRecruitmentStatus ?? "OPEN",
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
      const updated = await clubService.updateClubPolicy(Number(clubId), policy);
      setClub(updated);
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
        <button className="club-manage-policy-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-policy-page__title">운영 정책</h1>
        <div className="club-manage-policy-page__header-spacer" />
      </div>

      {club?.name && (
        <div className="club-manage-policy-page__hint">
          <StarIcon size={16} /> {club.name}의 운영 룰을 설정합니다.
        </div>
      )}

      {error && <div className="club-manage-policy-page__error">{error}</div>}

      <div className="club-manage-policy-page__section">
        <div className="club-manage-policy-page__row">
          <div className="club-manage-policy-page__row-title">가입 승인 방식</div>
          <div className="club-manage-policy-page__row-desc">
            기본값은 <b>승인 필요</b>입니다.
          </div>
          <div className="club-manage-policy-page__seg">
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.joinPolicy === "APPROVAL" ? "active" : ""
              }`}
              onClick={() => setPolicy((p) => ({ ...p, joinPolicy: "APPROVAL" }))}
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

        <div className="club-manage-policy-page__divider" />

        <div className="club-manage-policy-page__row">
          <div className="club-manage-policy-page__row-title">교류전 모집 상태</div>
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
                setPolicy((p) => ({ ...p, interclubRecruitmentStatus: "CLOSED" }))
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

        <div className="club-manage-policy-page__divider" />

        <div className="club-manage-policy-page__row">
          <div className="club-manage-policy-page__row-title">신규회원 모집 상태</div>
          <div className="club-manage-policy-page__row-desc">
            기본값은 <b>모집중(OPEN)</b>입니다.
          </div>
          <div className="club-manage-policy-page__seg">
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.memberRecruitmentStatus === "OPEN" ? "active" : ""
              }`}
              onClick={() => setPolicy((p) => ({ ...p, memberRecruitmentStatus: "OPEN" }))}
              disabled={saving}
            >
              모집중
            </button>
            <button
              type="button"
              className={`club-manage-policy-page__seg-btn ${
                policy.memberRecruitmentStatus === "CLOSED" ? "active" : ""
              }`}
              onClick={() => setPolicy((p) => ({ ...p, memberRecruitmentStatus: "CLOSED" }))}
              disabled={saving}
            >
              모집안함
            </button>
          </div>
        </div>
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

