import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ballService } from '../../services/ballService';
import axiosInstance from '../../services/api/axiosInstance';
import type {
  BallSummaryResponse,
  BallTransactionResponse,
  BallTransactionPageResponse,
  BallKeeper,
  AddBallRequest,
  DistributeBallRequest,
} from '../../types/ball';
import type { ClubMembership } from '../../types/club';
import { ArrowLeftIcon, PlusIcon } from '../../components/common/Icons';
import { getOpenRunSession } from '../../utils/openrunSession';
import { normalizeClubRole } from '../../utils/role';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { formatShortDate } from '../../utils/dateUtils';
import './ClubBallManagePage.css';

type TabType = 'keepers' | 'transactions';

interface KeeperSelectorModalProps {
  members: ClubMembership[];
  keepers: BallKeeper[];
  onClose: () => void;
  onSave: (changes: { memberId: number; isBallKeeper: boolean }[]) => void;
  saving: boolean;
}

const KeeperSelectorModal: React.FC<KeeperSelectorModalProps> = ({
  members,
  keepers,
  onClose,
  onSave,
  saving,
}) => {
  // 기존 보유자 ID 세트
  const initialKeeperIds = new Set(keepers.map((k) => k.memberId));

  // 로컬 선택 상태 (체크박스 상태 관리)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(initialKeeperIds));

  const handleToggle = (memberId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    // 변경된 항목만 추출
    const changes: { memberId: number; isBallKeeper: boolean }[] = [];

    members.forEach((member) => {
      const wasKeeper = initialKeeperIds.has(member.memberId);
      const isNowSelected = selectedIds.has(member.memberId);

      if (wasKeeper !== isNowSelected) {
        changes.push({
          memberId: member.memberId,
          isBallKeeper: isNowSelected,
        });
      }
    });

    onSave(changes);
  };

  // 변경사항 있는지 확인
  const hasChanges = members.some((member) => {
    const wasKeeper = initialKeeperIds.has(member.memberId);
    const isNowSelected = selectedIds.has(member.memberId);
    return wasKeeper !== isNowSelected;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content keeper-selector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>보유자 지정</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="keeper-selector-modal__content">
          {members.length === 0 ? (
            <div className="keeper-selector-modal__empty">
              클럽원이 없습니다.
            </div>
          ) : (
            <div className="keeper-selector-modal__list">
              {members.map((member) => {
                const isSelected = selectedIds.has(member.memberId);
                const keeper = keepers.find((k) => k.memberId === member.memberId);

                return (
                  <div key={member.memberId} className="keeper-selector-modal__item">
                    <label className="keeper-selector-modal__checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(member.memberId)}
                        className="keeper-selector-modal__checkbox"
                      />
                      <div className="keeper-selector-modal__member-info">
                        <span className="keeper-selector-modal__member-name">
                          {member.name}
                        </span>
                        {keeper && (
                          <span className="keeper-selector-modal__member-quantity">
                            {keeper.quantity}캔 보유
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddBallModalProps {
  keepers: BallKeeper[];
  onClose: () => void;
  onSubmit: (request: AddBallRequest) => void;
}

const AddBallModal: React.FC<AddBallModalProps> = ({
  keepers,
  onClose,
  onSubmit,
}) => {
  const [toMemberId, setToMemberId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (toMemberId === '') return;
    onSubmit({ toMemberId, quantity, description: description || undefined });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ball-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>공용구 입고</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="ball-modal__body">
          <div className="form-group">
            <label>보유자</label>
            <select
              value={toMemberId}
              onChange={(e) => setToMemberId(Number(e.target.value))}
            >
              <option value="">선택하세요</option>
              {keepers.map((k) => (
                <option key={k.memberId} value={k.memberId}>
                  {k.userName} ({k.quantity}캔)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>수량 (캔)</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>메모 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 박스 구매"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-success"
            onClick={handleSubmit}
            disabled={toMemberId === '' || quantity < 1}
          >
            입고
          </button>
        </div>
      </div>
    </div>
  );
};

interface DistributeModalProps {
  keepers: BallKeeper[];
  onClose: () => void;
  onSubmit: (request: DistributeBallRequest) => void;
}

const DistributeModal: React.FC<DistributeModalProps> = ({
  keepers,
  onClose,
  onSubmit,
}) => {
  const [fromMemberId, setFromMemberId] = useState<number | ''>('');
  const [toMemberId, setToMemberId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');

  const fromKeeper = keepers.find((k) => k.memberId === fromMemberId);
  const maxQuantity = fromKeeper?.quantity ?? 0;

  const handleSubmit = () => {
    if (fromMemberId === '' || toMemberId === '') return;
    onSubmit({
      fromMemberId,
      toMemberId,
      quantity,
      description: description || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ball-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>공용구 배분</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="ball-modal__body">
          <div className="form-group">
            <label>출발 보유자</label>
            <select
              value={fromMemberId}
              onChange={(e) => setFromMemberId(Number(e.target.value))}
            >
              <option value="">선택하세요</option>
              {keepers.map((k) => (
                <option key={k.memberId} value={k.memberId}>
                  {k.userName} ({k.quantity}캔)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>도착 보유자</label>
            <select
              value={toMemberId}
              onChange={(e) => setToMemberId(Number(e.target.value))}
            >
              <option value="">선택하세요</option>
              {keepers
                .filter((k) => k.memberId !== fromMemberId)
                .map((k) => (
                  <option key={k.memberId} value={k.memberId}>
                    {k.userName} ({k.quantity}캔)
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>수량 (캔) - 최대 {maxQuantity}캔</label>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>메모 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-info"
            onClick={handleSubmit}
            disabled={
              fromMemberId === '' ||
              toMemberId === '' ||
              quantity < 1 ||
              quantity > maxQuantity
            }
          >
            배분
          </button>
        </div>
      </div>
    </div>
  );
};

const ClubBallManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [summary, setSummary] = useState<BallSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<BallTransactionResponse[]>([]);
  const [members, setMembers] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('keepers');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 모달 상태
  const [showKeeperModal, setShowKeeperModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [savingKeepers, setSavingKeepers] = useState(false);

  const session = getOpenRunSession();
  const myRole = normalizeClubRole(session.currentClubRole);
  const isAdmin = myRole === 'ADMIN' || myRole === 'OWNER';

  const loadSummary = useCallback(async () => {
    if (!clubId) return;
    try {
      const data = await ballService.getBallSummary(Number(clubId));
      setSummary(data);
    } catch (err) {
      logError('공용구 현황 조회', err);
      setError(getErrorMessage(err));
    }
  }, [clubId]);

  const loadTransactions = useCallback(
    async (pageNum: number, append = false) => {
      if (!clubId) return;
      try {
        const data: BallTransactionPageResponse = await ballService.getTransactions(
          Number(clubId),
          pageNum
        );
        if (append) {
          setTransactions((prev) => [...prev, ...data.content]);
        } else {
          setTransactions(data.content);
        }
        setHasMore(!data.last);
      } catch (err) {
        logError('거래 내역 조회', err);
      }
    },
    [clubId]
  );

  const loadMembers = useCallback(async () => {
    if (!clubId) return;
    try {
      const response = await axiosInstance.get(`/clubs/${clubId}/membership`, {
        params: { status: 'ACTIVE' }
      });
      setMembers(response.data);
    } catch (err) {
      logError('회원 목록 조회', err);
    }
  }, [clubId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadSummary(), loadTransactions(0), loadMembers()]);
      setLoading(false);
    };
    init();
  }, [loadSummary, loadTransactions, loadMembers]);

  const handleBack = () => {
    navigate(`/clubs/${clubId}/manage`);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTransactions(nextPage, true);
  };

  const handleSaveKeepers = async (changes: { memberId: number; isBallKeeper: boolean }[]) => {
    if (!clubId || changes.length === 0) {
      setShowKeeperModal(false);
      return;
    }

    setSavingKeepers(true);
    try {
      // 모든 변경사항 순차 처리
      for (const change of changes) {
        await ballService.updateBallKeeper(Number(clubId), change.memberId, {
          isBallKeeper: change.isBallKeeper,
        });
      }
      setShowKeeperModal(false);
      await loadSummary();
      await loadMembers();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSavingKeepers(false);
    }
  };

  const handleAddBalls = async (request: AddBallRequest) => {
    if (!clubId) return;
    try {
      await ballService.addBalls(Number(clubId), request);
      setShowAddModal(false);
      await loadSummary();
      await loadTransactions(0);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDistribute = async (request: DistributeBallRequest) => {
    if (!clubId) return;
    try {
      await ballService.distributeBalls(Number(clubId), request);
      setShowDistributeModal(false);
      await loadSummary();
      await loadTransactions(0);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'ADD':
        return '입고';
      case 'DISTRIBUTE':
        return '배분';
      case 'USE':
        return '사용';
      case 'ADJUST':
        return '조정';
      default:
        return type;
    }
  };

  // 보유자 (테이블 컬럼용)
  const getTransactionKeeper = (tx: BallTransactionResponse) => {
    switch (tx.type) {
      case 'ADD':
        return tx.toMemberName ?? '-';
      case 'DISTRIBUTE':
      case 'USE':
      case 'ADJUST':
        return tx.fromMemberName ?? '-';
      default:
        return '-';
    }
  };

  // 내용 (테이블 컬럼용)
  const getTransactionContent = (tx: BallTransactionResponse) => {
    switch (tx.type) {
      case 'ADD':
        return `${tx.quantity}캔 입고`;
      case 'DISTRIBUTE':
        return `${tx.toMemberName}에게 ${tx.quantity}캔 전달`;
      case 'USE':
        return `${tx.quantity}캔 사용`;
      case 'ADJUST':
        return `${tx.quantity}캔 조정`;
      default:
        return `${tx.quantity}캔`;
    }
  };

  // 일정 상세 모달 열기
  const handleOpenSchedule = (scheduleId: number) => {
    navigate('/schedules/club', {
      state: { openScheduleId: scheduleId },
    });
  };

  if (loading) {
    return (
      <div className="ball-manage-page">
        <div className="ball-manage-page__loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ball-manage-page">
        <div className="ball-manage-page__header">
          <button className="ball-manage-page__back-btn" onClick={handleBack}>
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="ball-manage-page__title">공용구 관리</h1>
          <div className="ball-manage-page__header-spacer" />
        </div>
        <div className="ball-manage-page__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ball-manage-page">
      {/* 헤더 */}
      <div className="ball-manage-page__header">
        <button className="ball-manage-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="ball-manage-page__title">공용구 관리</h1>
        <div className="ball-manage-page__header-spacer" />
      </div>

      {/* 통계 카드 */}
      {summary && (
        <div className="ball-manage-page__stats">
          <div className="ball-manage-page__stat-card">
            <span className="ball-manage-page__stat-value">{summary.totalQuantity}</span>
            <span className="ball-manage-page__stat-label">총 보유</span>
          </div>
          <div className="ball-manage-page__stat-card">
            <span className="ball-manage-page__stat-value">{summary.ballKeeperCount}</span>
            <span className="ball-manage-page__stat-label">보유자</span>
          </div>
          <div className="ball-manage-page__stat-card">
            <span className="ball-manage-page__stat-value">{summary.monthlyUsed}</span>
            <span className="ball-manage-page__stat-label">이번달 사용</span>
          </div>
          <div className="ball-manage-page__stat-card">
            <span className="ball-manage-page__stat-value">{summary.monthlyAdded}</span>
            <span className="ball-manage-page__stat-label">이번달 입고</span>
          </div>
        </div>
      )}

      {/* 관리자 액션 버튼 */}
      {isAdmin && (
        <div className="ball-manage-page__actions">
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--add"
            onClick={() => setShowAddModal(true)}
            disabled={!summary || summary.keepers.length === 0}
          >
            <PlusIcon size={16} /> 입고
          </button>
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--distribute"
            onClick={() => setShowDistributeModal(true)}
            disabled={!summary || summary.keepers.length < 2}
          >
            배분
          </button>
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--keeper"
            onClick={() => setShowKeeperModal(true)}
          >
            보유자 지정
          </button>
        </div>
      )}

      {/* 탭 */}
      <div className="ball-manage-page__tabs">
        <button
          className={`ball-manage-page__tab ${activeTab === 'keepers' ? 'ball-manage-page__tab--active' : ''}`}
          onClick={() => setActiveTab('keepers')}
        >
          보유 현황
        </button>
        <button
          className={`ball-manage-page__tab ${activeTab === 'transactions' ? 'ball-manage-page__tab--active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          거래 내역
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="ball-manage-page__content">
        {activeTab === 'keepers' && summary && (
          <div className="ball-manage-page__keepers">
            {summary.keepers.length === 0 ? (
              <div className="ball-manage-page__empty">
                아직 공용구 보유자가 없습니다.
                {isAdmin && ' 상단의 "보유자 지정" 버튼을 눌러 보유자를 지정해주세요.'}
              </div>
            ) : (
              summary.keepers.map((keeper) => (
                <div key={keeper.memberId} className="ball-manage-page__keeper-card">
                  <div className="ball-manage-page__keeper-info">
                    <span className="ball-manage-page__keeper-name">{keeper.userName}</span>
                  </div>
                  <span className="ball-manage-page__keeper-quantity">{keeper.quantity}캔</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="ball-manage-page__transactions">
            {transactions.length === 0 ? (
              <div className="ball-manage-page__empty">거래 내역이 없습니다.</div>
            ) : (
              <>
                {transactions.map((tx) => (
                  <div key={tx.id} className="ball-manage-page__tx-card">
                    <div className="ball-manage-page__tx-header">
                      <span className="ball-manage-page__tx-date">{formatShortDate(tx.createdAt)}</span>
                      <span className={`ball-manage-page__tx-type ball-manage-page__tx-type--${tx.type.toLowerCase()}`}>
                        {getTransactionTypeLabel(tx.type)}
                      </span>
                      <span className="ball-manage-page__tx-keeper">{getTransactionKeeper(tx)}</span>
                    </div>
                    <div className="ball-manage-page__tx-body">
                      {getTransactionContent(tx)}
                      {tx.type === 'USE' && tx.scheduleId && tx.scheduleAt && (
                        <button
                          type="button"
                          className="ball-manage-page__tx-schedule-link"
                          onClick={() => handleOpenSchedule(tx.scheduleId!)}
                        >
                          , {formatShortDate(tx.scheduleAt)}
                        </button>
                      )}
                      {tx.description && (
                        <span className="ball-manage-page__tx-desc"> ({tx.description})</span>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    className="ball-manage-page__load-more"
                    onClick={handleLoadMore}
                  >
                    더 보기
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showKeeperModal && (
        <KeeperSelectorModal
          members={members}
          keepers={summary?.keepers ?? []}
          onClose={() => setShowKeeperModal(false)}
          onSave={handleSaveKeepers}
          saving={savingKeepers}
        />
      )}

      {showAddModal && summary && (
        <AddBallModal
          keepers={summary.keepers}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBalls}
        />
      )}

      {showDistributeModal && summary && (
        <DistributeModal
          keepers={summary.keepers}
          onClose={() => setShowDistributeModal(false)}
          onSubmit={handleDistribute}
        />
      )}
    </div>
  );
};

export default ClubBallManagePage;
