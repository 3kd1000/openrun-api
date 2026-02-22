import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clubService } from "../../../services/clubService";
import type { CreateClubRequest } from "../../../types/club";
import BackButton from "../../../components/common/BackButton";
import RegionSelector from "../../../components/common/RegionSelector";

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
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={handleBack} />
        <h1 className="text-xl font-semibold">클럽 만들기</h1>
        <div className="w-10" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 border border-red-500 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            클럽 이름 <span className="text-red-500 ml-0.5">*</span>
          </span>
          <input
            className="w-full border border-input rounded-lg px-3 py-2 text-base bg-background text-foreground"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="예) 오픈런 테니스 클럽"
            maxLength={100}
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          지역 (선택)
          <RegionSelector
            depth1={form.regionDepth1 ?? ""}
            depth2={form.regionDepth2 ?? ""}
            onChangeDepth1={(value) => setForm((p) => ({ ...p, regionDepth1: value }))}
            onChangeDepth2={(value) => setForm((p) => ({ ...p, regionDepth2: value }))}
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          소개 (선택)
          <textarea
            className="w-full border border-input rounded-lg px-3 py-2 text-base bg-background text-foreground min-h-[120px] resize-y"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="클럽을 한두 문장으로 소개해주세요"
            maxLength={5000}
            disabled={loading}
          />
        </label>

        <button
          className="mt-2 px-6 py-3 border-none rounded-lg bg-slate-700 text-white font-semibold text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? "생성 중..." : "클럽 만들기"}
        </button>
      </form>
    </div>
  );
};

export default ClubCreatePage;
