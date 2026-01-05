import React, { useState } from 'react';
import type { UserProfile, ContactVisibility } from '../services/api/userApi';
import { updateUser } from '../services/api/userApi';
import './ProfileEditModal.css';

interface ProfileEditModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [phoneVisibility, setPhoneVisibility] = useState<ContactVisibility>(user.phoneVisibility || 'PRIVATE');
  const [emailVisibility, setEmailVisibility] = useState<ContactVisibility>(user.emailVisibility || 'CLUB_ONLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('이름을 입력해주세요.');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setName(newValue);
    // 실시간 검증
    if (newValue.trim() === '') {
      setNameError('이름을 입력해주세요.');
    } else {
      setNameError(null);
    }
  };

  const validatePhoneNumber = (value: string): boolean => {
    if (!value.trim()) {
      // 전화번호는 선택사항이므로 비어있어도 OK
      setPhoneError(null);
      return true;
    }

    const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phonePattern.test(value)) {
      setPhoneError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return false;
    }

    setPhoneError(null);
    return true;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPhoneNumber(newValue);
    // 실시간 검증
    validatePhoneNumber(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 이름 검증
    if (!validateName(name)) {
      return;
    }

    // 전화번호 검증
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await updateUser({
        name: name.trim(),
        imageUrl: imageUrl.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        phoneVisibility,
        emailVisibility,
      });

      // localStorage에 업데이트된 이름 저장 (다른 화면에서도 사용)
      localStorage.setItem('user_name', updatedUser.name);

      onUpdate(updatedUser);
      onClose();
    } catch (err: unknown) {
      console.error('프로필 수정 실패:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(errorMessage || '프로필 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVisibilityLabel = (visibility: ContactVisibility): string => {
    switch (visibility) {
      case 'PRIVATE':
        return '비공개 (본인만)';
      case 'CLUB_ONLY':
        return '클럽원만 공개';
      case 'PUBLIC':
        return '전체 공개';
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="profile-edit-modal">
        <div className="modal-header">
          <h2>프로필 수정</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">이름 *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              onBlur={() => validateName(name)}
              placeholder="이름을 입력하세요"
              maxLength={50}
              required
              className={nameError ? 'input-error' : ''}
            />
            {nameError && <div className="field-error-message">{nameError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="disabled-input"
            />
            <small className="form-help">이메일은 변경할 수 없습니다.</small>
          </div>

          <div className="form-group">
            <label htmlFor="emailVisibility">이메일 공개범위</label>
            <select
              id="emailVisibility"
              value={emailVisibility}
              onChange={(e) => setEmailVisibility(e.target.value as ContactVisibility)}
              className="visibility-select"
            >
              <option value="PRIVATE">{getVisibilityLabel('PRIVATE')}</option>
              <option value="CLUB_ONLY">{getVisibilityLabel('CLUB_ONLY')}</option>
              <option value="PUBLIC">{getVisibilityLabel('PUBLIC')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">전화번호</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              onBlur={() => validatePhoneNumber(phoneNumber)}
              placeholder="010-1234-5678"
              className={phoneError ? 'input-error' : ''}
            />
            {phoneError && <div className="field-error-message">{phoneError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phoneVisibility">전화번호 공개범위</label>
            <select
              id="phoneVisibility"
              value={phoneVisibility}
              onChange={(e) => setPhoneVisibility(e.target.value as ContactVisibility)}
              className="visibility-select"
            >
              <option value="PRIVATE">{getVisibilityLabel('PRIVATE')}</option>
              <option value="CLUB_ONLY">{getVisibilityLabel('CLUB_ONLY')}</option>
              <option value="PUBLIC">{getVisibilityLabel('PUBLIC')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">프로필 이미지 URL</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/profile.jpg"
            />
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="프로필 미리보기" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
