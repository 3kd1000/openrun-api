import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { Club, UpdateClubRequest } from "../../../types/club";
import { ArrowLeftIcon, UsersIcon } from "../../../components/common/Icons";
import RegionSelector from "../../../components/common/RegionSelector";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errorHandler";

const ClubManageInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  const [form, setForm] = useState<UpdateClubRequest>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!clubId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get<Club>(`/clubs/${clubId}`);
        setForm({
          name: res.data.name ?? "",
          regionDepth1: res.data.regionDepth1 ?? "",
          regionDepth2: res.data.regionDepth2 ?? "",
          description: res.data.description ?? "",
        });
        setLogoUrl(res.data.logoUrl ?? null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clubId) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLogoUploading(true);
      const res = await axiosInstance.post<Club>(`/clubs/${clubId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoUrl(res.data.logoUrl ?? null);
      showToast("로고가 업로드되었습니다", "success");
    } catch (err: unknown) {
      showToast("로고 업로드 실패: " + getErrorMessage(err), "error");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!clubId || !logoUrl) return;
    if (!confirm("로고를 삭제하시겠습니까?")) return;
    try {
      setLogoUploading(true);
      await axiosInstance.delete(`/clubs/${clubId}/logo`);
      setLogoUrl(null);
      showToast("로고가 삭제되었습니다", "success");
    } catch (err: unknown) {
      showToast("로고 삭제 실패: " + getErrorMessage(err), "error");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!clubId) return;
    if (!form.name?.trim()) {
      setError("클럽 이름은 필수입니다.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await clubService.updateClub(Number(clubId), {
        name: form.name.trim(),
        regionDepth1: form.regionDepth1?.trim() || undefined,
        regionDepth2: form.regionDepth2?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
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
      {/* 헤더 */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">클럽 정보</span>
        <div className="w-9 h-9" />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-3 py-2 mb-3 rounded-lg border border-red-400 bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* 폼 */}
      <div className="flex flex-col gap-4">
        {/* 클럽 로고 */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">클럽 로고</span>
          <div className="bg-white rounded-lg border border-border p-3">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="클럽 로고"
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
                  disabled={logoUploading}
                >
                  {logoUploading ? "처리 중..." : "로고 변경"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={handleLogoDelete}
                    disabled={logoUploading}
                  >
                    로고 삭제
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
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">
            클럽 이름 <span className="text-red-500 ml-0.5">*</span>
          </span>
          <input
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white text-gray-900"
            value={form.name ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            maxLength={100}
            disabled={saving}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">지역</span>
          <RegionSelector
            depth1={form.regionDepth1 ?? ""}
            depth2={form.regionDepth2 ?? ""}
            onChangeDepth1={(value) => setForm((p) => ({ ...p, regionDepth1: value }))}
            onChangeDepth2={(value) => setForm((p) => ({ ...p, regionDepth2: value }))}
            disabled={saving}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">소개</span>
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white text-gray-900 min-h-[140px] resize-y"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            maxLength={5000}
            disabled={saving}
          />
        </label>

        <button
          className="w-full py-3 bg-primary text-white rounded-lg font-medium text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
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
