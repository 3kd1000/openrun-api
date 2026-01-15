import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import { clubService } from "../../services/clubService";
import type { Club, UpdateClubRequest } from "../../types/club";
import { ArrowLeftIcon } from "../../components/common/Icons";
import "./ClubManageInfoPage.css";

const ClubManageInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [club, setClub] = useState<Club | null>(null);
  const [form, setForm] = useState<UpdateClubRequest>({});
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
        setForm({
          name: res.data.name ?? "",
          region: res.data.region ?? "",
          description: res.data.description ?? "",
        });
      } catch (e) {
        console.error(e);
        setError("클럽 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  const handleBack = () => navigate(`/clubs/${clubId}/manage`);

  const handleSave = async () => {
    if (!clubId) return;
    if (!form.name?.trim()) {
      setError("클럽 이름은 필수입니다.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const updated = await clubService.updateClub(Number(clubId), {
        name: form.name.trim(),
        region: form.region?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
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
      <div className="club-manage-info-page">
        <div className="club-manage-info-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-manage-info-page">
      <div className="club-manage-info-page__header">
        <button className="club-manage-info-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-info-page__title">
          {club?.name ? "클럽 정보" : "클럽 정보"}
        </h1>
        <div className="club-manage-info-page__header-spacer" />
      </div>

      {error && <div className="club-manage-info-page__error">{error}</div>}

      <div className="club-manage-info-page__form">
        <label className="club-manage-info-page__label">
          클럽 이름 <span className="club-manage-info-page__required">*</span>
          <input
            className="club-manage-info-page__input"
            value={form.name ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            maxLength={100}
            disabled={saving}
          />
        </label>

        <label className="club-manage-info-page__label">
          지역
          <input
            className="club-manage-info-page__input"
            value={form.region ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
            maxLength={255}
            disabled={saving}
          />
        </label>

        <label className="club-manage-info-page__label">
          소개
          <textarea
            className="club-manage-info-page__textarea"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            maxLength={5000}
            disabled={saving}
          />
        </label>

        <button
          className="club-manage-info-page__save"
          type="button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};

export default ClubManageInfoPage;

