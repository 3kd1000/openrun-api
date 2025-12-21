import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { scheduleService } from '../../../services/scheduleService';
import { participantService } from '../../../services/participantService';
import type { Schedule, CreateScheduleRequest, Participant } from '../../../types/schedule';
import { DEV_USERS } from '../../../components/DevUserSwitcher';
import DrawCreateModal from './DrawCreateModal';
import DrawResultModal from './DrawResultModal';
import type { DrawResponse } from '../../../services/drawService';
import './ScheduleDetailModal.css';

interface Props {
  schedule: Schedule;
  onClose: () => void;
  onSuccess: () => void;
}

// 시간 옵션 생성 (정시만, 06시부터 시작)
const generateTimeOptions = () => {
  const options = [];
  // 06시부터 23시까지
  for (let hour = 6; hour < 24; hour++) {
    const time = `${String(hour).padStart(2, '0')}:00`;
    options.push(time);
  }
  // 00시부터 05시까지 (뒤에 추가)
  for (let hour = 0; hour < 6; hour++) {
    const time = `${String(hour).padStart(2, '0')}:00`;
    options.push(time);
  }
  return options;
};

const ScheduleDetailModal: React.FC<Props> = ({ schedule, onClose, onSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipation, setMyParticipation] = useState<Participant | null>(null);
  const [showDrawCreateModal, setShowDrawCreateModal] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);

  // 로그인한 사용자 ID 가져오기
  const userId = localStorage.getItem('devUserId');
  const currentUserId = userId ? parseInt(userId) : null;

  // 사용자 ID로 이름 가져오기
  const getUserName = (userId: number): string => {
    const user = DEV_USERS.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  // 초기 날짜 및 시간 분리
  const scheduledAtDate = new Date(schedule.scheduledAt);
  const defaultDate = format(scheduledAtDate, 'yyyy-MM-dd');
  const defaultTime = format(scheduledAtDate, 'HH:mm');

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [formData, setFormData] = useState({
    clubId: schedule.clubId,
    courtName: schedule.courtName,
    maxCapacity: schedule.maxCapacity,
    cost: schedule.cost || undefined,
    description: schedule.description || ''
  });

  // 참가자 목록 및 내 참가 상태 로드
  useEffect(() => {
    loadParticipants();
  }, [schedule.id]);

  const loadParticipants = async () => {
    try {
      const [participantsList, myStatus] = await Promise.all([
        participantService.getParticipants(schedule.id),
        currentUserId ? participantService.getMyParticipation(schedule.id, currentUserId) : Promise.resolve(null)
      ]);

      setParticipants(participantsList);
      setMyParticipation(myStatus);
    } catch (err) {
      console.error('참가자 정보 로드 실패:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courtName || !selectedDate || !selectedTime) {
      setError('코트명, 날짜, 시간은 필수입니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const scheduledAt = `${selectedDate}T${selectedTime}:00`;

      const requestData: CreateScheduleRequest = {
        ...formData,
        scheduledAt
      };

      await scheduleService.updateSchedule(schedule.id, requestData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('일정 수정 실패:', err);
      setError('일정 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await scheduleService.deleteSchedule(schedule.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('일정 삭제 실패:', err);
      setError('일정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다. /dev/login 페이지에서 로그인해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await participantService.joinSchedule(schedule.id, currentUserId);
      await loadParticipants();
      onSuccess(); // 일정 목록 새로고침
    } catch (err: any) {
      console.error('참가 신청 실패:', err);
      setError(err.response?.data?.message || '참가 신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentUserId) {
      return;
    }

    if (!window.confirm('참가 신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await participantService.cancelParticipation(schedule.id, currentUserId);
      await loadParticipants();
      onSuccess(); // 일정 목록 새로고침
    } catch (err) {
      console.error('신청 취소 실패:', err);
      setError('신청 취소에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const confirmedParticipants = participants.filter(p => p.status === 'CONFIRMED');
  const waitingParticipants = participants.filter(p => p.status === 'WAITING');

  const timeOptions = generateTimeOptions();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content schedule-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? '일정 수정' : '일정 상세'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {!isEditMode ? (
          <div className="schedule-detail-view">
            <div className="detail-item">
              <label>코트명</label>
              <p>{schedule.courtName}</p>
            </div>

            <div className="detail-item">
              <label>일정 시간</label>
              <p>{format(new Date(schedule.scheduledAt), 'yyyy년 M월 d일 HH:mm')}</p>
            </div>

            <div className="detail-item">
              <label>정원</label>
              <p>{schedule.currentParticipants} / {schedule.maxCapacity}명
                {schedule.currentParticipants >= schedule.maxCapacity && (
                  <span className="badge-full"> 마감</span>
                )}
              </p>
            </div>

            {schedule.cost && (
              <div className="detail-item">
                <label>총 비용</label>
                <p>{schedule.cost.toLocaleString()}원</p>
              </div>
            )}

            {schedule.description && (
              <div className="detail-item">
                <label>설명</label>
                <p className="detail-description">{schedule.description}</p>
              </div>
            )}

            {/* 참가자 목록 */}
            {participants.length > 0 && (
              <div className="detail-item">
                <label>참가자 목록</label>
                <div className="participants-list">
                  {confirmedParticipants.length > 0 && (
                    <div className="participant-group">
                      <h4>확정 ({confirmedParticipants.length}명)</h4>
                      <ul>
                        {confirmedParticipants.map((p, idx) => (
                          <li key={p.id}>
                            {idx + 1}. {getUserName(p.userId)}
                            {p.userId === currentUserId && <span className="me-badge"> (나)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {waitingParticipants.length > 0 && (
                    <div className="participant-group">
                      <h4>대기 ({waitingParticipants.length}명)</h4>
                      <ul>
                        {waitingParticipants.map((p, idx) => (
                          <li key={p.id} className="waiting">
                            {idx + 1}. {getUserName(p.userId)}
                            {p.userId === currentUserId && <span className="me-badge"> (나)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 내 참가 상태 */}
            {myParticipation && (
              <div className="my-status">
                {myParticipation.status === 'CONFIRMED' && (
                  <p className="status-confirmed">✓ 참가 확정</p>
                )}
                {myParticipation.status === 'WAITING' && (
                  <p className="status-waiting">⏱ 대기 중 ({waitingParticipants.findIndex(p => p.userId === currentUserId) + 1}번째)</p>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {/* 대진 생성 버튼 (확정 참가자 4명 이상 시 표시) */}
            {confirmedParticipants.length >= 4 && (
              <div className="draw-action-section">
                <button
                  type="button"
                  onClick={() => setShowDrawCreateModal(true)}
                  className="btn-create-draw"
                >
                  🎯 대진 생성
                </button>
              </div>
            )}

            <div className="modal-actions">
              {currentUserId && myParticipation ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel-participation"
                  disabled={loading}
                >
                  {loading ? '취소 중...' : '신청 취소'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  className="btn-join"
                  disabled={loading || !currentUserId}
                >
                  {loading ? '신청 중...' : '참가 신청'}
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="btn-delete"
                disabled={loading}
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="btn-primary"
              >
                수정
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>날짜 *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>시간 *</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                className="time-select"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>코트명 *</label>
              <input
                type="text"
                value={formData.courtName}
                onChange={(e) => setFormData({...formData, courtName: e.target.value})}
                placeholder="예: 골드 3번 코트"
                required
              />
            </div>

            <div className="form-group">
              <label>최대 정원 *</label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>총 비용 (선택)</label>
              <input
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData({...formData, cost: e.target.value ? parseInt(e.target.value) : undefined})}
                placeholder="25000"
              />
            </div>

            <div className="form-group">
              <label>설명 (선택)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="일정 설명"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="btn-secondary"
                disabled={loading}
              >
                취소
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 대진 생성 모달 */}
      {showDrawCreateModal && (
        <DrawCreateModal
          scheduleId={schedule.id}
          participants={participants}
          onClose={() => setShowDrawCreateModal(false)}
          onSuccess={(result) => {
            setShowDrawCreateModal(false);
            setDrawResult(result);
          }}
        />
      )}

      {/* 대진 결과 모달 */}
      {drawResult && (
        <DrawResultModal
          scheduleId={schedule.id}
          drawResult={drawResult}
          onClose={() => {
            setDrawResult(null);
            onSuccess();
          }}
          onRegenerate={() => {
            setDrawResult(null);
            setShowDrawCreateModal(true);
          }}
        />
      )}
    </div>
  );
};

export default ScheduleDetailModal;
