import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ballService } from '../../../services/ballService';
import { scheduleService } from '../../../services/scheduleService';
import axiosInstance from '../../../services/api/axiosInstance';
import type {
  BallSummaryResponse,
  BallTransactionResponse,
  BallTransactionPageResponse,
  BallKeeper,
  AddBallRequest,
  DistributeBallRequest,
  AdjustBallRequest,
  BatchAdjustBallRequest,
} from '../../../types/ball';
import type { ClubMembership } from '../../../types/club';
import type { Schedule } from '../../../types/schedule';
import { ArrowLeftIcon, PlusIcon } from '../../../components/common/Icons';
import { getOpenRunSession } from '../../../utils/openrunSession';
import { normalizeClubRole } from '../../../utils/role';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import { formatShortDate, formatScheduleDateTime } from '../../../utils/dateUtils';
import { useToast } from '../../../contexts/ToastContext';
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

interface ScheduleSummaryModalProps {
  scheduleId: number;
  onClose: () => void;
  onNavigateToDetail: () => void;
}

const ScheduleSummaryModal: React.FC<ScheduleSummaryModalProps> = ({
  scheduleId,
  onClose,
  onNavigateToDetail,
}) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const data = await scheduleService.getScheduleById(scheduleId);
        setSchedule(data);
      } catch (err) {
        logError('일정 조회', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, [scheduleId]);

  const getMatchTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'MEN_DOUBLES':
        return '남복';
      case 'WOMEN_DOUBLES':
        return '여복';
      case 'MIXED_DOUBLES':
        return '혼복';
      case 'SINGLES':
        return '단식';
      default:
        return '미정';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ball-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>일정 요약</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="ball-modal__body">
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>}
          {error && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-error)' }}>{error}</div>}
          {schedule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
              <div className="form-group">
                <label>장소</label>
                <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)' }}>
                  {schedule.courtName}
                </div>
              </div>
              <div className="form-group">
                <label>일시</label>
                <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)' }}>
                  {formatScheduleDateTime(schedule.scheduledAt, schedule.durationMinutes)}
                </div>
              </div>
              <div className="form-group">
                <label>참가 인원</label>
                <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)' }}>
                  {schedule.currentParticipants} / {schedule.maxCapacity}명
                </div>
              </div>
              {schedule.matchType && (
                <div className="form-group">
                  <label>경기 형식</label>
                  <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)' }}>
                    {getMatchTypeLabel(schedule.matchType)}
                  </div>
                </div>
              )}
              {schedule.cost !== undefined && schedule.cost > 0 && (
                <div className="form-group">
                  <label>비용</label>
                  <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)' }}>
                    {schedule.cost.toLocaleString()}원
                  </div>
                </div>
              )}
              {schedule.description && (
                <div className="form-group">
                  <label>설명</label>
                  <div style={{ padding: 'var(--space-s)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-s)', whiteSpace: 'pre-wrap' }}>
                    {schedule.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button
            className="btn-primary"
            onClick={onNavigateToDetail}
            disabled={loading || !!error}
          >
            상세정보 보러가기
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
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState('');
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const validateQuantity = (value: string): boolean => {
    if (!value.trim()) {
      setQuantityError('수량을 입력해주세요.');
      return false;
    }
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      setQuantityError('1 이상의 정수만 입력 가능합니다.');
      return false;
    }
    setQuantityError(null);
    return true;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      if (value) {
        validateQuantity(value);
      } else {
        setQuantityError(null);
      }
    }
  };

  const handleSubmit = () => {
    if (toMemberId === '') return;
    if (!validateQuantity(quantity)) return;
    onSubmit({ toMemberId, quantity: Number(quantity), description: description || undefined });
  };

  const isValidQuantity = quantity !== '' && !isNaN(Number(quantity)) && Number(quantity) >= 1;

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
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="숫자 입력"
              className={quantityError ? 'input-error' : ''}
            />
            {quantityError && (
              <div className="field-error-message">{quantityError}</div>
            )}
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
            disabled={toMemberId === '' || !isValidQuantity}
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
  initialFromMemberId?: number;
}

const DistributeModal: React.FC<DistributeModalProps> = ({
  keepers,
  onClose,
  onSubmit,
  initialFromMemberId,
}) => {
  const [fromMemberId, setFromMemberId] = useState<number | ''>(initialFromMemberId ?? '');
  const [toMemberId, setToMemberId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState('');
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const fromKeeper = keepers.find((k) => k.memberId === fromMemberId);
  const maxQuantity = fromKeeper?.quantity ?? 0;

  const validateQuantity = (value: string): boolean => {
    if (!value.trim()) {
      setQuantityError('수량을 입력해주세요.');
      return false;
    }
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      setQuantityError('1 이상의 정수만 입력 가능합니다.');
      return false;
    }
    if (num > maxQuantity) {
      setQuantityError(`최대 ${maxQuantity}캔까지 배분 가능합니다.`);
      return false;
    }
    setQuantityError(null);
    return true;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      if (value) {
        validateQuantity(value);
      } else {
        setQuantityError(null);
      }
    }
  };

  const handleSubmit = () => {
    if (fromMemberId === '' || toMemberId === '') return;
    if (!validateQuantity(quantity)) return;
    onSubmit({
      fromMemberId,
      toMemberId,
      quantity: Number(quantity),
      description: description || undefined,
    });
  };

  const quantityNum = Number(quantity);
  const isValidQuantity = quantity !== '' && !isNaN(quantityNum) && quantityNum >= 1 && quantityNum <= maxQuantity;

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
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="숫자 입력"
              className={quantityError ? 'input-error' : ''}
            />
            {quantityError && (
              <div className="field-error-message">{quantityError}</div>
            )}
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
              !isValidQuantity
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
  const { showToast } = useToast();
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
  const [initialFromMemberId, setInitialFromMemberId] = useState<number | undefined>(undefined);
  const [scheduleSummaryModalId, setScheduleSummaryModalId] = useState<number | null>(null);

  // 재고관리 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<Map<number, string>>(new Map());
  const [quantityErrors, setQuantityErrors] = useState<Map<number, string>>(new Map());
  const [savingAdjustments, setSavingAdjustments] = useState(false);

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
      showToast(getErrorMessage(err), "error");
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
      showToast(getErrorMessage(err), "error");
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
      showToast(getErrorMessage(err), "error");
    }
  };

  // 재고관리 모드 진입
  const handleEnterEditMode = () => {
    if (!summary) return;
    // 현재 보유자들의 수량을 초기값으로 설정
    const initialQuantities = new Map<number, string>();
    summary.keepers.forEach(keeper => {
      initialQuantities.set(keeper.memberId, keeper.quantity.toString());
    });
    setEditedQuantities(initialQuantities);
    setQuantityErrors(new Map());
    setIsEditMode(true);
  };

  // 재고관리 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedQuantities(new Map());
    setQuantityErrors(new Map());
  };

  // 수량 변경 핸들러
  const handleEditQuantityChange = (memberId: number, value: string) => {
    // 숫자만 허용
    if (value === '' || /^\d+$/.test(value)) {
      const newQuantities = new Map(editedQuantities);
      newQuantities.set(memberId, value);
      setEditedQuantities(newQuantities);

      // 유효성 검사
      if (value) {
        const num = Number(value);
        const newErrors = new Map(quantityErrors);
        if (isNaN(num) || !Number.isInteger(num) || num < 0) {
          newErrors.set(memberId, '0 이상의 정수만 입력 가능합니다.');
        } else {
          newErrors.delete(memberId);
        }
        setQuantityErrors(newErrors);
      } else {
        const newErrors = new Map(quantityErrors);
        newErrors.delete(memberId);
        setQuantityErrors(newErrors);
      }
    }
  };

  // 재고 조정 저장
  const handleSaveAdjustments = async () => {
    if (!clubId || !summary) return;

    // 변경된 항목만 추출하여 AdjustBallRequest 배열 생성
    const adjustments: AdjustBallRequest[] = [];
    summary.keepers.forEach(keeper => {
      const editedValue = editedQuantities.get(keeper.memberId);
      if (editedValue) {
        const newQuantity = Number(editedValue);
        if (newQuantity !== keeper.quantity && !isNaN(newQuantity)) {
          const diff = newQuantity - keeper.quantity;
          adjustments.push({
            memberId: keeper.memberId,
            quantity: diff,
            description: '재고관리: 수량 조정',
          });
        }
      }
    });

    if (adjustments.length === 0) {
      setIsEditMode(false);
      return;
    }

    setSavingAdjustments(true);
    try {
      // 배치로 한 번에 처리
      const batchRequest: BatchAdjustBallRequest = { adjustments };
      await ballService.batchAdjustQuantities(Number(clubId), batchRequest);

      setIsEditMode(false);
      setEditedQuantities(new Map());
      setQuantityErrors(new Map());
      await loadSummary();
      await loadTransactions(0);
      showToast(`${adjustments.length}건의 재고가 조정되었습니다.`, "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSavingAdjustments(false);
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

  // 일정 요약 모달 열기
  const handleShowScheduleSummary = (scheduleId: number) => {
    setScheduleSummaryModalId(scheduleId);
  };

  // 일정 상세로 이동
  const handleNavigateToScheduleDetail = () => {
    if (scheduleSummaryModalId) {
      navigate('/schedules/club', {
        state: { openScheduleId: scheduleSummaryModalId },
      });
    }
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
      {isAdmin && !isEditMode && (
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
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--adjust"
            onClick={handleEnterEditMode}
            disabled={!summary || summary.keepers.length === 0}
          >
            재고관리
          </button>
        </div>
      )}

      {/* 재고관리 모드 액션 버튼 */}
      {isAdmin && isEditMode && (
        <div className="ball-manage-page__actions">
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--success"
            onClick={handleSaveAdjustments}
            disabled={savingAdjustments || quantityErrors.size > 0}
          >
            {savingAdjustments ? '저장 중...' : '저장'}
          </button>
          <button
            className="ball-manage-page__action-btn ball-manage-page__action-btn--cancel"
            onClick={handleCancelEdit}
            disabled={savingAdjustments}
          >
            취소
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
            ) : isEditMode ? (
              // 재고관리 모드
              summary.keepers.map((keeper) => {
                const editedValue = editedQuantities.get(keeper.memberId) ?? keeper.quantity.toString();
                const error = quantityErrors.get(keeper.memberId);
                return (
                  <div
                    key={keeper.memberId}
                    className="ball-manage-page__keeper-card ball-manage-page__keeper-card--edit"
                  >
                    <div className="ball-manage-page__keeper-info">
                      <span className="ball-manage-page__keeper-name">{keeper.userName}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-xs)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editedValue}
                          onChange={(e) => handleEditQuantityChange(keeper.memberId, e.target.value)}
                          className={error ? 'input-error' : ''}
                          style={{
                            width: '80px',
                            padding: 'var(--space-xs) var(--space-s)',
                            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-s)',
                            fontSize: 'var(--font-size-base)',
                            textAlign: 'right',
                          }}
                        />
                        <span className="ball-manage-page__keeper-quantity">캔</span>
                      </div>
                      {error && (
                        <div style={{ fontSize: 'var(--font-size-s)', color: 'var(--color-error)' }}>
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // 일반 모드
              summary.keepers.map((keeper) => (
                <div
                  key={keeper.memberId}
                  className="ball-manage-page__keeper-card"
                  onClick={() => {
                    if (isAdmin && summary.keepers.length >= 2) {
                      setInitialFromMemberId(keeper.memberId);
                      setShowDistributeModal(true);
                    }
                  }}
                  style={{
                    cursor: isAdmin && summary.keepers.length >= 2 && !isEditMode ? 'pointer' : 'default',
                  }}
                >
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
                          onClick={() => handleShowScheduleSummary(tx.scheduleId!)}
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
          onClose={() => {
            setShowDistributeModal(false);
            setInitialFromMemberId(undefined);
          }}
          onSubmit={handleDistribute}
          initialFromMemberId={initialFromMemberId}
        />
      )}

      {scheduleSummaryModalId !== null && (
        <ScheduleSummaryModal
          scheduleId={scheduleSummaryModalId}
          onClose={() => setScheduleSummaryModalId(null)}
          onNavigateToDetail={handleNavigateToScheduleDetail}
        />
      )}
    </div>
  );
};

export default ClubBallManagePage;
