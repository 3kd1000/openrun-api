import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { ArrowLeftIcon, AlertTriangleIcon } from "../../../components/common/Icons";
import { getOpenRunSession, setOpenRunSession } from "../../../utils/openrunSession";
import { normalizeClubRole } from "../../../utils/role";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import type { ClubMembership } from "../../../types/club";
import { useToast } from "../../../contexts/ToastContext";

const CONFIRMATION_TEXT = "클럽장 권한을 양도합니다";

const ClubTransferOwnershipPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  const [candidates, setCandidates] = useState<ClubMembership[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OWNER 권한 체크
  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const isOwner = myRole === "OWNER";

  useEffect(() => {
    if (!isOwner) {
      navigate(`/clubs/${clubId}/manage`, { replace: true });
      return;
    }

    if (clubId) {
      loadCandidates();
    }
  }, [clubId, isOwner]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/clubs/${clubId}/membership`, {
        params: { status: "ACTIVE" },
      });

      // OWNER 본인 제외한 모든 ACTIVE 멤버
      const members = response.data.filter(
        (member: ClubMembership) => member.role !== "OWNER"
      );
      setCandidates(members);
    } catch (error: unknown) {
      logError("클럽원 목록 조회", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}/manage`);
  };

  const isConfirmationValid = confirmationInput === CONFIRMATION_TEXT;
  const canSubmit = selectedUserId !== null && isConfirmationValid && !submitting;

  const handleTransfer = async () => {
    if (!canSubmit || !selectedUserId) return;

    try {
      setSubmitting(true);
      setError(null);

      await axiosInstance.post(`/clubs/${clubId}/transfer-ownership`, {
        newOwnerUserId: selectedUserId,
      });

      // 세션 역할 업데이트 (기존 OWNER -> ADMIN)
      setOpenRunSession({ currentClubRole: "ADMIN" });

      // 클럽 메인으로 이동
      showToast("클럽장 권한이 성공적으로 양도되었습니다", "success");
      navigate(`/clubs/${clubId}`, { replace: true });
    } catch (error: unknown) {
      logError("클럽장 권한 양도", error);
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="py-10 text-center text-sm text-gray-400">로딩 중...</div>
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
        <span className="flex-1 text-center text-sm font-bold text-foreground">클럽장 권한 양도</span>
        <div className="w-9 h-9" />
      </div>

      {/* 경고 메시지 */}
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-3">
        <AlertTriangleIcon size={20} />
        <span>이 작업은 되돌릴 수 없습니다.</span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-3 py-2 mb-3 bg-red-50 border border-red-300 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ADMIN 목록 */}
      <div className="bg-white rounded-xl border border-border p-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-800 m-0 mb-3">양도 대상 선택</h2>

        {candidates.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm mb-2">권한을 양도할 수 있는 클럽원이 없습니다.</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              클럽에 다른 멤버가 없어 양도할 수 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((member) => (
              <label
                key={member.userId}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                  selectedUserId === member.userId
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-transparent bg-gray-50 hover:border-indigo-400"
                }`}
              >
                <input
                  type="radio"
                  name="newOwner"
                  value={member.userId}
                  checked={selectedUserId === member.userId}
                  onChange={() => setSelectedUserId(member.userId)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-gray-800">
                    {member.name}
                    {member.role === "ADMIN" && (
                      <span className="ml-1.5 text-xs font-medium text-emerald-600">운영진</span>
                    )}
                  </span>
                  {member.email && (
                    <span className="text-xs text-gray-400">
                      {member.email}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 확인 문구 입력 */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-800 m-0 mb-3">확인 문구 입력</h2>
          <p className="text-xs text-gray-400 mb-2">
            "{CONFIRMATION_TEXT}"를 입력하세요
          </p>
          <input
            type="text"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
          />
        </div>
      )}

      {/* 양도 버튼 */}
      {candidates.length > 0 && (
        <button
          className={`w-full py-3 bg-red-500 text-white rounded-lg font-medium text-sm transition-all ${
            !canSubmit ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 cursor-pointer"
          }`}
          onClick={handleTransfer}
          disabled={!canSubmit}
        >
          {submitting ? "양도 중..." : "양도하기"}
        </button>
      )}
    </div>
  );
};

export default ClubTransferOwnershipPage;
