import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { ArrowLeftIcon, AlertTriangleIcon } from "../../../components/common/Icons";
import { getOpenRunSession, setOpenRunSession } from "../../../utils/openrunSession";
import { normalizeClubRole } from "../../../utils/role";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import type { ClubMembership } from "../../../types/club";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubTransferOwnershipPage.css";

const CONFIRMATION_TEXT = "클럽장 권한을 양도합니다";

const ClubTransferOwnershipPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  const [adminMembers, setAdminMembers] = useState<ClubMembership[]>([]);
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
      loadAdminMembers();
    }
  }, [clubId, isOwner]);

  const loadAdminMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/clubs/${clubId}/membership`, {
        params: { status: "ACTIVE" },
      });

      // ADMIN만 필터링
      const admins = response.data.filter(
        (member: ClubMembership) => member.role === "ADMIN"
      );
      setAdminMembers(admins);
    } catch (error: unknown) {
      logError("운영진 목록 조회", error);
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
      <div className="club-transfer-ownership-page">
        <div className="club-transfer-ownership-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-transfer-ownership-page">
      {/* 헤더 */}
      <div className="club-transfer-ownership-page__header">
        <button className="club-transfer-ownership-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-transfer-ownership-page__title">클럽장 권한 양도</h1>
        <div className="club-transfer-ownership-page__header-spacer" />
      </div>

      {/* 경고 메시지 */}
      <div className="club-transfer-ownership-page__warning">
        <AlertTriangleIcon size={20} />
        <span>이 작업은 되돌릴 수 없습니다.</span>
      </div>

      {error && <div className="club-transfer-ownership-page__error">{error}</div>}

      {/* ADMIN 목록 */}
      <div className="club-transfer-ownership-page__section">
        <h2 className="club-transfer-ownership-page__section-title">운영진 선택</h2>

        {adminMembers.length === 0 ? (
          <div className="club-transfer-ownership-page__empty">
            <p>권한을 양도할 수 있는 운영진이 없습니다.</p>
            <p className="club-transfer-ownership-page__empty-hint">
              클럽장 권한은 운영진(ADMIN)에게만 양도할 수 있습니다.
              <br />
              먼저 클럽원 관리에서 운영진을 지정해주세요.
            </p>
          </div>
        ) : (
          <div className="club-transfer-ownership-page__admin-list">
            {adminMembers.map((member) => (
              <label
                key={member.userId}
                className={`club-transfer-ownership-page__admin-item ${
                  selectedUserId === member.userId ? "club-transfer-ownership-page__admin-item--selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="newOwner"
                  value={member.userId}
                  checked={selectedUserId === member.userId}
                  onChange={() => setSelectedUserId(member.userId)}
                  className="club-transfer-ownership-page__radio"
                />
                <div className="club-transfer-ownership-page__admin-info">
                  <span className="club-transfer-ownership-page__admin-name">
                    {member.name}
                  </span>
                  {member.email && (
                    <span className="club-transfer-ownership-page__admin-email">
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
      {adminMembers.length > 0 && (
        <div className="club-transfer-ownership-page__section">
          <h2 className="club-transfer-ownership-page__section-title">확인 문구 입력</h2>
          <p className="club-transfer-ownership-page__hint">
            "{CONFIRMATION_TEXT}"를 입력하세요
          </p>
          <input
            type="text"
            className="club-transfer-ownership-page__input"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
          />
        </div>
      )}

      {/* 양도 버튼 */}
      {adminMembers.length > 0 && (
        <button
          className="club-transfer-ownership-page__submit"
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
