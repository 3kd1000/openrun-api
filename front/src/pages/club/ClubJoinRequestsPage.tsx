import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import type { ClubMember } from "../../types/club";
import { ArrowLeftIcon, CheckIcon, XIcon } from "../../components/common/Icons";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import "./ClubJoinRequestsPage.css";

const ClubJoinRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMembers, setPendingMembers] = useState<ClubMember[]>([]);

  useEffect(() => {
    if (!clubId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const load = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      setError(null);
      const pendingResponse = await axiosInstance.get(
        `/clubs/${clubId}/members`,
        {
          params: { status: "PENDING" },
        }
      );
      setPendingMembers(pendingResponse.data);
    } catch (e: unknown) {
      logError("가입 신청 조회", e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(`/clubs/${clubId}/manage`);

  const handleApprove = async (userId: number) => {
    if (!clubId) return;
    if (!confirm("승인하시겠습니까?")) return;
    try {
      await axiosInstance.post(`/clubs/${clubId}/members/${userId}/approve`);
      setPendingMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (e: unknown) {
      logError("가입 승인", e);
      alert(getErrorMessage(e));
    }
  };

  const handleReject = async (userId: number) => {
    if (!clubId) return;
    if (!confirm("거절하시겠습니까?")) return;
    try {
      await axiosInstance.post(`/clubs/${clubId}/members/${userId}/reject`);
      setPendingMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (e: unknown) {
      logError("가입 거절", e);
      alert(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="club-join-requests-page">
        <div className="club-join-requests-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-join-requests-page">
      <div className="club-join-requests-page__header">
        <button
          className="club-join-requests-page__back-btn"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-join-requests-page__title">가입 신청 관리</h1>
        <div className="club-join-requests-page__header-spacer" />
      </div>

      {error && <div className="club-join-requests-page__error">{error}</div>}

      <div className="club-join-requests-page__list">
        {pendingMembers.length === 0 ? (
          <div className="club-join-requests-page__empty">
            대기 중인 가입 신청이 없습니다.
          </div>
        ) : (
          pendingMembers.map((m) => (
            <div key={m.id} className="club-join-requests-page__item">
              <div className="club-join-requests-page__info">
                <div className="club-join-requests-page__name">
                  {m.user.name}
                </div>
                <div className="club-join-requests-page__email">
                  {m.user.email}
                </div>
              </div>
              <div className="club-join-requests-page__actions">
                <button
                  className="club-join-requests-page__btn club-join-requests-page__btn--approve"
                  onClick={() => handleApprove(m.user.id)}
                  title="승인"
                >
                  <CheckIcon size={18} />
                </button>
                <button
                  className="club-join-requests-page__btn club-join-requests-page__btn--reject"
                  onClick={() => handleReject(m.user.id)}
                  title="거절"
                >
                  <XIcon size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubJoinRequestsPage;
