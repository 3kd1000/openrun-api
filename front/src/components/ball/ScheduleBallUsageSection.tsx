import React, { useEffect, useState, useCallback } from 'react';
import { ballService } from '../../services/ballService';
import type {
  BallTransactionResponse,
  BallKeeper,
  UseBallRequest,
} from '../../types/ball';
import { getOpenRunSession } from '../../utils/openrunSession';
import { normalizeClubRole } from '../../utils/role';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import './ScheduleBallUsageSection.css';

interface Props {
  clubId: number;
  scheduleId: number;
}

const ScheduleBallUsageSection: React.FC<Props> = ({ clubId, scheduleId }) => {
  const [usages, setUsages] = useState<BallTransactionResponse[]>([]);
  const [keepers, setKeepers] = useState<BallKeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedKeeperId, setSelectedKeeperId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const isAdmin = myRole === 'ADMIN' || myRole === 'OWNER';
  const currentUserId = session.userId ?? null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usageData, summaryData] = await Promise.all([
        ballService.getScheduleUsages(clubId, scheduleId),
        ballService.getBallSummary(clubId),
      ]);
      setUsages(usageData);
      setKeepers(summaryData.keepers);
    } catch (err) {
      logError('공용구 사용 내역 조회', err);
    } finally {
      setLoading(false);
    }
  }, [clubId, scheduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 현재 사용자가 보유자인지 확인
  const myKeeperInfo = keepers.find((k) => k.userId === currentUserId);
  const canRecordUsage = isAdmin || myKeeperInfo != null;

  // 사용 가능한 보유자 목록 (본인이 보유자면 본인만, Admin이면 전체)
  const availableKeepers = isAdmin
    ? keepers
    : myKeeperInfo
      ? [myKeeperInfo]
      : [];

  const selectedKeeper = keepers.find((k) => k.memberId === selectedKeeperId);
  const maxQuantity = selectedKeeper?.quantity ?? 0;

  const handleSubmit = async () => {
    if (selectedKeeperId === '' || quantity < 1) return;

    setSubmitting(true);
    try {
      const request: UseBallRequest = {
        fromMemberId: selectedKeeperId as number,
        scheduleId,
        quantity,
        description: description || undefined,
      };
      await ballService.useBalls(clubId, request);
      setShowForm(false);
      setSelectedKeeperId('');
      setQuantity(1);
      setDescription('');
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm('이 사용 기록을 삭제하시겠습니까? 수량이 복원됩니다.')) return;

    try {
      await ballService.deleteTransaction(clubId, transactionId);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // 삭제 권한 확인 (본인 or ADMIN+)
  const canDelete = (usage: BallTransactionResponse) => {
    if (isAdmin) return true;
    // 본인이 보유자인 경우만 삭제 가능
    return myKeeperInfo && usage.fromMemberId === myKeeperInfo.memberId;
  };

  if (loading) {
    return (
      <div className="schedule-ball-section">
        <div className="section-header-with-button">
          <label>공용구</label>
        </div>
        <div className="schedule-ball-section__loading">로딩 중...</div>
      </div>
    );
  }

  // 보유자가 없으면 섹션 숨김
  if (keepers.length === 0) {
    return null;
  }

  return (
    <div className="schedule-ball-section">
      <div className="section-header-with-button">
        <label>공용구</label>
        {canRecordUsage && !showForm && (
          <button
            className="manage-ball-button"
            onClick={() => setShowForm(true)}
          >
            + 사용기록
          </button>
        )}
      </div>

      {showForm && (
        <div className="schedule-ball-section__form">
          <div className="schedule-ball-section__form-row schedule-ball-section__form-row--inline">
            <select
              value={selectedKeeperId}
              onChange={(e) => setSelectedKeeperId(Number(e.target.value))}
            >
              <option value="">보유자 선택</option>
              {availableKeepers.map((k) => (
                <option key={k.memberId} value={k.memberId}>
                  {k.userName} ({k.quantity}캔)
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <span className="schedule-ball-section__unit">캔</span>
          </div>
          <div className="schedule-ball-section__form-row schedule-ball-section__form-row--memo">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="메모 (선택)"
            />
            <button
              className="schedule-ball-section__btn--primary"
              onClick={handleSubmit}
              disabled={
                submitting ||
                selectedKeeperId === '' ||
                quantity < 1 ||
                quantity > maxQuantity
              }
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
            <button
              className="schedule-ball-section__btn--cancel"
              onClick={() => {
                setShowForm(false);
                setSelectedKeeperId('');
                setQuantity(1);
                setDescription('');
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {usages.length > 0 ? (
        <div className="schedule-ball-section__usages">
          {usages.map((usage) => (
            <div key={usage.id} className="schedule-ball-section__usage-item">
              <div className="schedule-ball-section__usage-main">
                <span className="schedule-ball-section__usage-info">
                  {usage.fromMemberName} -{usage.quantity}캔
                </span>
                <span className="schedule-ball-section__usage-date">
                  ({formatDate(usage.createdAt)})
                </span>
                {usage.description && (
                  <span className="schedule-ball-section__usage-desc">
                    {usage.description}
                  </span>
                )}
              </div>
              {canDelete(usage) && (
                <button
                  className="schedule-ball-section__delete-btn"
                  onClick={() => handleDelete(usage.id)}
                  title="삭제"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="schedule-ball-section__empty">
          이 일정에서 사용된 공용구가 없습니다.
        </div>
      )}
    </div>
  );
};

export default ScheduleBallUsageSection;
