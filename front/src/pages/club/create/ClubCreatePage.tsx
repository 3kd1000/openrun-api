import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { CreateClubRequest } from "../../../types/club";
import RegionSelector from "../../../components/common/RegionSelector";
import { AppHeader } from "../../../components/common/AppHeader";
import { UsersIcon } from "../../../components/common/Icons";

const ClubCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateClubRequest>({
    name: "",
    regionDepth1: "",
    regionDepth2: "",
    description: "",
  });

  const handleBack = () => navigate("/explore");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

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

      // 로고 파일이 선택된 경우 업로드
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        await axiosInstance.post(`/clubs/${created.id}/logo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 생성 직후 온보딩(CTA) 화면으로 이동
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
      <AppHeader title="클럽 만들기" onBack={handleBack} />

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

        {/* 클럽 로고 */}
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          클럽 로고 (선택)
          <div className="bg-background rounded-lg border border-input p-3">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="클럽 로고 미리보기"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <UsersIcon size={24} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="text-sm font-medium text-primary border border-primary/40 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={loading}
                >
                  {logoPreview ? "로고 변경" : "로고 선택"}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={handleLogoRemove}
                    disabled={loading}
                  >
                    선택 취소
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WebP · 최대 5MB</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

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
            placeholder="클럽에 대해 소개해주세요."
            maxLength={5000}
            disabled={loading}
          />
        </label>

        <p className="text-xs text-muted-foreground text-center">
          클럽 로고는 생성 후 <span className="font-medium">클럽 관리 &gt; 클럽 정보</span>에서도 변경할 수 있어요
        </p>

        <button
          className="px-6 py-3 border-none rounded-lg bg-slate-700 text-white font-semibold text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
