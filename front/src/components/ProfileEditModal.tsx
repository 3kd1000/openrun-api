import React, { useEffect, useState } from "react";
import type {
  UserProfile,
  ContactVisibility,
  BackhandType,
} from "../services/api/userApi";
import {
  getMyTennisProfile,
  updateMyTennisProfile,
  updateUser,
} from "../services/api/userApi";
import "./ProfileEditModal.css";

interface ProfileEditModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  onClose,
  onUpdate,
}) => {
  const [name, setName] = useState(user.name);
  // 프로필 이미지 URL/미리보기는 현재 화면에서 숨김 처리(요청사항).
  // 저장 시 기존 값을 유지하기 위해 state는 유지하되 UI는 노출하지 않는다.
  const [imageUrl] = useState(user.imageUrl || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [phoneVisibility, setPhoneVisibility] = useState<ContactVisibility>(
    user.phoneVisibility || "PRIVATE"
  );
  const [emailVisibility, setEmailVisibility] = useState<ContactVisibility>(
    user.emailVisibility || "CLUB_ONLY"
  );
  const [tennisStartedMonth, setTennisStartedMonth] = useState<string>(""); // YYYY-MM
  const [backhandType, setBackhandType] = useState<BackhandType | "">("");
  const [ntrp, setNtrp] = useState<string>("");
  const [formerPlayer, setFormerPlayer] = useState<boolean>(false);
  const [favoritePlayer, setFavoritePlayer] = useState<string>("");
  const [tournamentHistory, setTournamentHistory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const p = await getMyTennisProfile();
        if (!mounted) return;
        setTennisStartedMonth(
          p.tennisStartedAt ? p.tennisStartedAt.slice(0, 7) : ""
        );
        setBackhandType((p.backhandType ?? "") as BackhandType | "");
        setNtrp(p.ntrp ?? "");
        setFormerPlayer(Boolean(p.formerPlayer));
        setFavoritePlayer(p.favoritePlayer ?? "");
        setTournamentHistory(p.tournamentHistory ?? "");
      } catch (e) {
        // user_profile은 없으면 서버에서 생성해주지만, 네트워크/권한 이슈는 무시하지 않고 안내만
        console.error("테니스 프로필 조회 실패:", e);
      }
    };
    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError("이름을 입력해주세요.");
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setName(newValue);
    // 실시간 검증
    if (newValue.trim() === "") {
      setNameError("이름을 입력해주세요.");
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
      setPhoneError("올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)");
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
      const tennisStartedAt = tennisStartedMonth
        ? `${tennisStartedMonth}-01`
        : null; // month-only 입력 -> LocalDate(day=1)
      const nextBackhandType = backhandType === "" ? null : backhandType;

      const [updatedUser] = await Promise.all([
        updateUser({
          name: name.trim(),
          imageUrl: imageUrl.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          phoneVisibility,
          emailVisibility,
        }),
        updateMyTennisProfile({
          tennisStartedAt,
          backhandType: nextBackhandType,
          favoritePlayer: favoritePlayer.trim() || null,
          ntrp: ntrp.trim() || null,
          tournamentHistory: tournamentHistory.trim() || null,
          formerPlayer,
        }),
      ]);

      // localStorage에 업데이트된 이름 저장 (다른 화면에서도 사용)
      localStorage.setItem("user_name", updatedUser.name);

      onUpdate(updatedUser);
      onClose();
    } catch (err: unknown) {
      console.error("프로필 수정 실패:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || "프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVisibilityShortLabel = (visibility: ContactVisibility): string => {
    switch (visibility) {
      case "PRIVATE":
        return "본인";
      case "CLUB_ONLY":
        return "클럽";
      case "PUBLIC":
        return "전체";
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
              className={nameError ? "input-error" : ""}
            />
            {nameError && (
              <div className="field-error-message">{nameError}</div>
            )}
          </div>

          <div className="form-group">
            <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--email">
              <div className="form-group profile-edit-modal__grid-item">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="disabled-input"
                />
                <small className="form-help">
                  이메일은 변경할 수 없습니다.
                </small>
              </div>
              <div className="form-group profile-edit-modal__grid-item profile-edit-modal__grid-item--compact">
                <label htmlFor="emailVisibility">공개</label>
                <select
                  id="emailVisibility"
                  value={emailVisibility}
                  onChange={(e) =>
                    setEmailVisibility(e.target.value as ContactVisibility)
                  }
                  className="visibility-select"
                >
                  <option value="PRIVATE">
                    {getVisibilityShortLabel("PRIVATE")}
                  </option>
                  <option value="CLUB_ONLY">
                    {getVisibilityShortLabel("CLUB_ONLY")}
                  </option>
                  <option value="PUBLIC">
                    {getVisibilityShortLabel("PUBLIC")}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--phone">
              <div className="form-group profile-edit-modal__grid-item">
                <label htmlFor="phoneNumber">전화번호</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  onBlur={() => validatePhoneNumber(phoneNumber)}
                  placeholder="010-1234-5678"
                  className={phoneError ? "input-error" : ""}
                />
              </div>
              <div className="form-group profile-edit-modal__grid-item profile-edit-modal__grid-item--compact">
                <label htmlFor="phoneVisibility">공개</label>
                <select
                  id="phoneVisibility"
                  value={phoneVisibility}
                  onChange={(e) =>
                    setPhoneVisibility(e.target.value as ContactVisibility)
                  }
                  className="visibility-select"
                >
                  <option value="PRIVATE">
                    {getVisibilityShortLabel("PRIVATE")}
                  </option>
                  <option value="CLUB_ONLY">
                    {getVisibilityShortLabel("CLUB_ONLY")}
                  </option>
                  <option value="PUBLIC">
                    {getVisibilityShortLabel("PUBLIC")}
                  </option>
                </select>
              </div>
            </div>
            {phoneError && (
              <div className="field-error-message">{phoneError}</div>
            )}
          </div>

          <div className="profile-edit-modal__section-title">테니스 프로필</div>

          <div className="form-group">
            <label htmlFor="tennisStartedMonth">테니스 시작일 (연/월)</label>
            <input
              type="month"
              id="tennisStartedMonth"
              value={tennisStartedMonth}
              onChange={(e) => setTennisStartedMonth(e.target.value)}
              placeholder="YYYY-MM"
            />
            <small className="form-help">
              날짜(일)까지는 입력하지 않고 연/월만 저장합니다.
            </small>
          </div>

          <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--tennis-1">
            <div className="form-group profile-edit-modal__grid-item">
              <label htmlFor="backhandType">백핸드</label>
              <select
                id="backhandType"
                value={backhandType}
                onChange={(e) =>
                  setBackhandType(e.target.value as BackhandType | "")
                }
                className="visibility-select"
              >
                <option value="">없음</option>
                <option value="ONE_HAND">원핸드</option>
                <option value="TWO_HAND">투핸드</option>
              </select>
            </div>

            <div className="form-group profile-edit-modal__grid-item">
              <label htmlFor="ntrp">NTRP</label>
              <input
                type="text"
                id="ntrp"
                value={ntrp}
                onChange={(e) => setNtrp(e.target.value)}
                placeholder="예: 3.5"
              />
            </div>
          </div>

          <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--tennis-2">
            <div className="form-group profile-edit-modal__grid-item">
              <label htmlFor="favoritePlayer">좋아하는 선수</label>
              <input
                type="text"
                id="favoritePlayer"
                value={favoritePlayer}
                onChange={(e) => setFavoritePlayer(e.target.value)}
                placeholder="예: 페더러"
              />
            </div>
            <div className="form-group profile-edit-modal__grid-item profile-edit-modal__grid-item--compact">
              <label htmlFor="formerPlayer">선수출신</label>
              <select
                id="formerPlayer"
                value={formerPlayer ? "true" : "false"}
                onChange={(e) => setFormerPlayer(e.target.value === "true")}
                className="visibility-select"
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tournamentHistory">대회/리그 경력</label>
            <textarea
              id="tournamentHistory"
              value={tournamentHistory}
              onChange={(e) => setTournamentHistory(e.target.value)}
              placeholder="예: 2025 ○○ 대회 8강"
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
