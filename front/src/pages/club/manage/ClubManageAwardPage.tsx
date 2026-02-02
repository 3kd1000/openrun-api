import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { Club, UpdateAwardPolicyRequest } from "../../../types/club";
import { ArrowLeftIcon } from "../../../components/common/Icons";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubManageAwardPage.css";

const ClubManageAwardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  const [policy, setPolicy] = useState<UpdateAwardPolicyRequest>({
    awardPeriod: "HALF_YEAR",
    awardAttendanceEnabled: true,
    awardPointsEnabled: true,
    awardBookingEnabled: true,
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
          awardPeriod: res.data.awardPeriod ?? "HALF_YEAR",
          awardAttendanceEnabled: res.data.awardAttendanceEnabled ?? true,
          awardPointsEnabled: res.data.awardPointsEnabled ?? true,
          awardBookingEnabled: res.data.awardBookingEnabled ?? true,
        });
      } catch (e) {
        console.error(e);
        setError("어워드 정책을 불러오지 못했습니다.");
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
      await clubService.updateAwardPolicy(Number(clubId), policy);
      showToast("저장되었습니다", "success");
    } catch (e) {
      console.error(e);
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAward = (key: keyof Omit<UpdateAwardPolicyRequest, 'awardPeriod'>) => {
    setPolicy((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) {
    return (
      <div className="club-manage-award-page">
        <div className="club-manage-award-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-manage-award-page">
      <div className="club-manage-award-page__header">
        <button
          className="club-manage-award-page__back-btn"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-award-page__title">어워드 정책</h1>
        <div className="club-manage-award-page__header-spacer" />
      </div>

      <div className="club-manage-award-page__hint">
        클럽의 어워드 정책을 설정합니다.
      </div>

      {error && <div className="club-manage-award-page__error">{error}</div>}

      <div className="club-manage-award-page__section">
        <div className="club-manage-award-page__row">
          <div className="club-manage-award-page__row-title">
            정산 주기
          </div>
          <div className="club-manage-award-page__row-desc">
            어워드 랭킹을 집계하는 기간입니다. 기준일은 1월 1일 / 7월 1일입니다.
          </div>
          <div className="club-manage-award-page__seg">
            <button
              type="button"
              className={`club-manage-award-page__seg-btn ${
                policy.awardPeriod === "HALF_YEAR" ? "active" : ""
              }`}
              onClick={() =>
                setPolicy((p) => ({ ...p, awardPeriod: "HALF_YEAR" }))
              }
              disabled={saving}
            >
              반기 (6개월)
            </button>
            <button
              type="button"
              className={`club-manage-award-page__seg-btn ${
                policy.awardPeriod === "YEARLY" ? "active" : ""
              }`}
              onClick={() => setPolicy((p) => ({ ...p, awardPeriod: "YEARLY" }))}
              disabled={saving}
            >
              연간 (1년)
            </button>
          </div>
        </div>

        <div className="club-manage-award-page__divider" />

        <div className="club-manage-award-page__row">
          <div className="club-manage-award-page__row-title">
            어워드 타입 활성화
          </div>
          <div className="club-manage-award-page__row-desc">
            기록 탭과 클럽 메인 위젯에 표시할 어워드를 선택합니다.
          </div>
        </div>

        <div className="club-manage-award-page__toggle-row">
          <div className="club-manage-award-page__toggle-label">
            <span className="club-manage-award-page__toggle-title">다참</span>
            <span className="club-manage-award-page__toggle-desc">가장 많이 참석한 멤버</span>
          </div>
          <button
            type="button"
            className={`club-manage-award-page__toggle ${policy.awardAttendanceEnabled ? "active" : ""}`}
            onClick={() => toggleAward("awardAttendanceEnabled")}
            disabled={saving}
          />
        </div>

        <div className="club-manage-award-page__toggle-row">
          <div className="club-manage-award-page__toggle-label">
            <span className="club-manage-award-page__toggle-title">다승점</span>
            <span className="club-manage-award-page__toggle-desc">가장 높은 승점을 기록한 멤버</span>
          </div>
          <button
            type="button"
            className={`club-manage-award-page__toggle ${policy.awardPointsEnabled ? "active" : ""}`}
            onClick={() => toggleAward("awardPointsEnabled")}
            disabled={saving}
          />
        </div>

        <div className="club-manage-award-page__toggle-row">
          <div className="club-manage-award-page__toggle-label">
            <span className="club-manage-award-page__toggle-title">예약왕</span>
            <span className="club-manage-award-page__toggle-desc">가장 많이 예약을 등록한 멤버</span>
          </div>
          <button
            type="button"
            className={`club-manage-award-page__toggle ${policy.awardBookingEnabled ? "active" : ""}`}
            onClick={() => toggleAward("awardBookingEnabled")}
            disabled={saving}
          />
        </div>
      </div>

      <button
        className="club-manage-award-page__save"
        type="button"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
};

export default ClubManageAwardPage;
