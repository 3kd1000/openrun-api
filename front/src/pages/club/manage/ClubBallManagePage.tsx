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
import { ArrowLeftIcon } from '../../../components/common/Icons';
import { getOpenRunSession } from '../../../utils/openrunSession';
import { normalizeClubRole } from '../../../utils/role';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import { formatShortDate, formatScheduleDateTime } from '../../../utils/dateUtils';
import { useToast } from '../../../contexts/ToastContext';

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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold m-0">보유자 지정</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-muted-foreground hover:bg-muted transition-colors leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 목록 */}
        <div className="px-4 py-3 max-h-[50vh] overflow-y-auto flex-1">
          {members.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              클럽원이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {members.map((member) => {
                const isSelected = selectedIds.has(member.memberId);
                const keeper = keepers.find((k) => k.memberId === member.memberId);

                return (
                  <div
                    key={member.memberId}
                    className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <label className="flex items-center px-3 py-3 cursor-pointer gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(member.memberId)}
                        className="w-5 h-5 m-0 cursor-pointer accent-primary flex-shrink-0"
                      />
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                        {keeper && (
                          <span className="text-xs text-primary font-semibold">
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

        {/* 액션 버튼 */}
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-border sticky bottom-0 bg-white z-10">
          <button
            type="button"
            className="btn-secondary flex-1 min-w-0"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="button"
            className="btn-primary flex-1 min-w-0"
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold m-0">일정 요약</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-muted-foreground hover:bg-muted transition-colors leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 바디 */}
        <div className="px-4 py-3 overflow-y-auto flex-1">
          {loading && (
            <div className="text-center py-5 text-sm text-muted-foreground">로딩 중...</div>
          )}
          {error && (
            <div className="text-center py-5 text-sm text-destructive">{error}</div>
          )}
          {schedule && (
            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label>장소</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  {schedule.courtName}
                </div>
              </div>
              <div className="form-group">
                <label>일시</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  {formatScheduleDateTime(schedule.scheduledAt, schedule.durationMinutes)}
                </div>
              </div>
              <div className="form-group">
                <label>참가 인원</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  {schedule.currentParticipants} / {schedule.maxCapacity}명
                </div>
              </div>
              {schedule.matchType && (
                <div className="form-group">
                  <label>경기 형식</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    {getMatchTypeLabel(schedule.matchType)}
                  </div>
                </div>
              )}
              {schedule.cost !== undefined && schedule.cost > 0 && (
                <div className="form-group">
                  <label>비용</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    {schedule.cost.toLocaleString()}원
                  </div>
                </div>
              )}
              {schedule.description && (
                <div className="form-group">
                  <label>설명</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                    {schedule.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-border sticky bottom-0 bg-white z-10">
          <button className="btn-secondary flex-1 min-w-0" onClick={onClose}>
            닫기
          </button>
          <button
            className="btn-primary flex-1 min-w-0"
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold m-0">공용구 입고</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-muted-foreground hover:bg-muted transition-colors leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 바디 */}
        <div className="px-4 py-3 overflow-y-auto flex-1">
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
              className={quantityError ? 'border-destructive!' : ''}
            />
            {quantityError && (
              <div className="text-xs text-destructive mt-1">{quantityError}</div>
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

        {/* 액션 버튼 */}
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-border sticky bottom-0 bg-white z-10">
          <button className="btn-secondary flex-1 min-w-0" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-success flex-1 min-w-0"
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold m-0">공용구 배분</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-muted-foreground hover:bg-muted transition-colors leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* 바디 */}
        <div className="px-4 py-3 overflow-y-auto flex-1">
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
              className={quantityError ? 'border-destructive!' : ''}
            />
            {quantityError && (
              <div className="text-xs text-destructive mt-1">{quantityError}</div>
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

        {/* 액션 버튼 */}
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-border sticky bottom-0 bg-white z-10">
          <button className="btn-secondary flex-1 min-w-0" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-info flex-1 min-w-0"
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

  // 거래 유형별 뱃지 색상
  const getTransactionTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'ADD':
        return 'bg-green-100 text-green-800';
      case 'DISTRIBUTE':
        return 'bg-blue-100 text-blue-800';
      case 'USE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADJUST':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
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
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="py-10 text-center text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (error) {
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
          <h1 className="flex-1 text-center text-base font-bold">공용구 관리</h1>
          <div className="w-9 h-9" />
        </div>
        <div className="py-6 text-center text-sm text-destructive">{error}</div>
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
        <span className="flex-1 text-center text-sm font-bold text-foreground">공용구 관리</span>
        <div className="w-9 h-9" />
      </div>

      {/* 통계 카드 (4개 - 2x2 그리드) */}
      {summary && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-primary">{summary.totalQuantity}</span>
            <span className="text-xs text-muted-foreground mt-0.5">총 보유</span>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-primary">{summary.ballKeeperCount}</span>
            <span className="text-xs text-muted-foreground mt-0.5">보유자</span>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-primary">{summary.monthlyUsed}</span>
            <span className="text-xs text-muted-foreground mt-0.5">이번달 사용</span>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-primary">{summary.monthlyAdded}</span>
            <span className="text-xs text-muted-foreground mt-0.5">이번달 입고</span>
          </div>
        </div>
      )}

      {/* 관리자 액션 버튼 (일반 모드) */}
      {isAdmin && !isEditMode && (
        <div className="flex gap-2 overflow-x-auto mb-3">
          <button
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={() => setShowAddModal(true)}
            disabled={!summary || summary.keepers.length === 0}
          >
            입고
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={() => setShowDistributeModal(true)}
            disabled={!summary || summary.keepers.length < 2}
          >
            배분
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors whitespace-nowrap"
            onClick={() => setShowKeeperModal(true)}
          >
            보유자 지정
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={handleEnterEditMode}
            disabled={!summary || summary.keepers.length === 0}
          >
            재고관리
          </button>
        </div>
      )}

      {/* 재고관리 모드 액션 버튼 */}
      {isAdmin && isEditMode && (
        <div className="flex gap-2 overflow-x-auto mb-3">
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={handleSaveAdjustments}
            disabled={savingAdjustments || quantityErrors.size > 0}
          >
            {savingAdjustments ? '저장 중...' : '저장'}
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={handleCancelEdit}
            disabled={savingAdjustments}
          >
            취소
          </button>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 bg-muted/50 p-0.5 rounded mb-3">
        <button
          className={`flex-1 py-2 text-sm rounded transition-all ${
            activeTab === 'keepers'
              ? 'bg-white text-primary font-semibold shadow-sm'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('keepers')}
        >
          보유 현황
        </button>
        <button
          className={`flex-1 py-2 text-sm rounded transition-all ${
            activeTab === 'transactions'
              ? 'bg-white text-primary font-semibold shadow-sm'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          거래 내역
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* 보유 현황 탭 */}
        {activeTab === 'keepers' && summary && (
          <div className="p-3">
            {summary.keepers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                아직 공용구 보유자가 없습니다.
                {isAdmin && ' 상단의 "보유자 지정" 버튼을 눌러 보유자를 지정해주세요.'}
              </div>
            ) : isEditMode ? (
              // 재고관리 모드
              <div className="flex flex-col gap-2">
                {summary.keepers.map((keeper) => {
                  const editedValue = editedQuantities.get(keeper.memberId) ?? keeper.quantity.toString();
                  const err = quantityErrors.get(keeper.memberId);
                  return (
                    <div
                      key={keeper.memberId}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{keeper.userName}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editedValue}
                            onChange={(e) => handleEditQuantityChange(keeper.memberId, e.target.value)}
                            className={`w-20 px-2 py-1 border rounded-lg text-sm text-right ${
                              err ? 'border-destructive' : 'border-border'
                            }`}
                          />
                          <span className="text-sm font-bold text-primary">캔</span>
                        </div>
                        {err && (
                          <div className="text-xs text-destructive">{err}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 일반 모드
              <div className="flex flex-col gap-2">
                {summary.keepers.map((keeper) => (
                  <div
                    key={keeper.memberId}
                    className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 transition-all ${
                      isAdmin && summary.keepers.length >= 2
                        ? 'cursor-pointer hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-sm'
                        : 'cursor-default'
                    }`}
                    onClick={() => {
                      if (isAdmin && summary.keepers.length >= 2) {
                        setInitialFromMemberId(keeper.memberId);
                        setShowDistributeModal(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{keeper.userName}</span>
                    </div>
                    <span className="text-base font-bold text-primary">{keeper.quantity}캔</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 거래 내역 탭 */}
        {activeTab === 'transactions' && (
          <div className="p-3">
            {transactions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                거래 내역이 없습니다.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(tx.createdAt)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getTransactionTypeBadgeClass(tx.type)}`}
                        >
                          {getTransactionTypeLabel(tx.type)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {getTransactionKeeper(tx)}
                        </span>
                      </div>
                      <div className="text-sm text-foreground">
                        {getTransactionContent(tx)}
                        {tx.type === 'USE' && tx.scheduleId && tx.scheduleAt && (
                          <button
                            type="button"
                            className="bg-transparent border-0 p-0 text-primary cursor-pointer text-sm underline hover:text-primary/80"
                            onClick={() => handleShowScheduleSummary(tx.scheduleId!)}
                          >
                            , {formatShortDate(tx.scheduleAt)}
                          </button>
                        )}
                        {tx.description && (
                          <span className="text-muted-foreground italic"> ({tx.description})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <button
                    className="w-full py-2 text-sm text-primary bg-transparent border-0 cursor-pointer hover:underline mt-2"
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
