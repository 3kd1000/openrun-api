import React, { useState } from 'react';
import { format } from 'date-fns';
import { scheduleService } from '../../../services/scheduleService';
import type { CreateScheduleRequest } from '../../../types/schedule';
import './ScheduleCreateModal.css';

interface Props {
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// 시간 옵션 생성 (30분 단위)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
};

const ScheduleCreateModal: React.FC<Props> = ({ initialDate, onClose, onSuccess }) => {
  // 초기 날짜 및 시간 분리
  const now = new Date();
  const defaultDate = initialDate ? initialDate.split('T')[0] : format(now, 'yyyy-MM-dd');
  const defaultTime = initialDate ? initialDate.split('T')[1]?.substring(0, 5) || '10:00' : '10:00';

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [formData, setFormData] = useState({
    clubId: 1, // TODO: 실제 클럽 ID로 변경
    courtName: '',
    maxCapacity: 8,
    cost: undefined as number | undefined,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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

      await scheduleService.createSchedule(requestData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('일정 생성 실패:', err);
      setError('일정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일정 생성</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
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
            <label>비용 (선택)</label>
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
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleCreateModal;
