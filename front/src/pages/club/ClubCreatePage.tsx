import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clubService } from "../../services/clubService";
import type { CreateClubRequest } from "../../types/club";
import { ArrowLeftIcon } from "../../components/common/Icons";
import RegionSelector from "../../components/common/RegionSelector";
import "./ClubCreatePage.css";

const ClubCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateClubRequest>({
    name: "",
    regionDepth1: "",
    regionDepth2: "",
    description: "",
  });

  const handleBack = () => navigate("/clubs/explore");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("클럽 이름은 필수입니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const created = await clubService.createClub({
        name: form.name.trim(),
        regionDepth1: form.regionDepth1?.trim() || undefined,
        regionDepth2: form.regionDepth2?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
      // 생성 직후 온보딩(CTA) 화면으로 이동
      // 정책 기본값: 승인필요/교류전 CLOSED (백엔드 기본값으로 적용)
      navigate(`/clubs/${created.id}/manage/onboarding`);
    } catch (err: unknown) {
      console.error("클럽 생성 실패:", err);
      setError("클럽 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="club-create-page">
      <div className="club-create-page__header">
        <button className="club-create-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-create-page__title">클럽 만들기</h1>
        <div className="club-create-page__header-spacer" />
      </div>

      <form className="club-create-page__form" onSubmit={handleSubmit}>
        {error && <div className="club-create-page__error">{error}</div>}

        <label className="club-create-page__label">
          <span className="club-create-page__label-row">
            클럽 이름 <span className="club-create-page__required">*</span>
          </span>
          <input
            className="club-create-page__input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="예) 오픈런 테니스 클럽"
            maxLength={100}
            disabled={loading}
          />
        </label>

        <label className="club-create-page__label">
          지역 (선택)
          <RegionSelector
            depth1={form.regionDepth1 ?? ""}
            depth2={form.regionDepth2 ?? ""}
            onChangeDepth1={(value) => setForm((p) => ({ ...p, regionDepth1: value }))}
            onChangeDepth2={(value) => setForm((p) => ({ ...p, regionDepth2: value }))}
            disabled={loading}
          />
        </label>

        <label className="club-create-page__label">
          소개 (선택)
          <textarea
            className="club-create-page__textarea"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="클럽을 한두 문장으로 소개해주세요"
            maxLength={5000}
            disabled={loading}
          />
        </label>

        <button className="club-create-page__submit" type="submit" disabled={loading}>
          {loading ? "생성 중..." : "클럽 생성"}
        </button>
      </form>
    </div>
  );
};

export default ClubCreatePage;

