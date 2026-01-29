import React, { useEffect, useState } from "react";
import type {
  UserProfile,
  ContactVisibility,
} from "../services/api/userApi";
import {
  getMyTennisProfile,
  updateMyTennisProfile,
  updateUser,
} from "../services/api/userApi";
import { setOpenRunSession } from "../utils/openrunSession";
import {
  normalizePhoneNumber,
  validatePhoneNumber as validatePhone,
  formatPhoneNumber,
} from "../utils/contactUtils";
import RegionSelector from "./common/RegionSelector";
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
  const [phoneNumber, setPhoneNumber] = useState(formatPhoneNumber(user.phoneNumber));
  const [phoneVisibility, setPhoneVisibility] = useState<ContactVisibility>(
    user.phoneVisibility || "PRIVATE"
  );
  const [emailVisibility, setEmailVisibility] = useState<ContactVisibility>(
    user.emailVisibility || "PUBLIC"
  );
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "PRIVATE">(
    (user.gender as "MALE" | "FEMALE" | "PRIVATE") || "PRIVATE"
  );
  const [birthDate, setBirthDate] = useState(user.birthDate || "");
  const [birthDateVisibility, setBirthDateVisibility] = useState<ContactVisibility>(
    user.birthDateVisibility || "PUBLIC"
  );
  const [regionDepth1, setRegionDepth1] = useState(user.regionDepth1 || "");
  const [regionDepth2, setRegionDepth2] = useState(user.regionDepth2 || "");
  const [tennisStartedMonth, setTennisStartedMonth] = useState<string>(""); // YYYY-MM
  const [ntrp, setNtrp] = useState<string>("");
  const [formerPlayer, setFormerPlayer] = useState<boolean>(false);
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
        setNtrp(p.ntrp ?? "");
        setFormerPlayer(Boolean(p.formerPlayer));
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
    const error = validatePhone(value);
    setPhoneError(error);
    return error === null;
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

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const [updatedUser] = await Promise.all([
        updateUser({
          name: name.trim(),
          imageUrl: imageUrl.trim() || null,
          phoneNumber: normalizedPhone || null,
          phoneVisibility,
          emailVisibility,
          gender,
          birthDate: birthDate.trim() || null,
          birthDateVisibility,
          regionDepth1: regionDepth1 || null,
          regionDepth2: regionDepth2 || null,
        }),
        updateMyTennisProfile({
          tennisStartedAt,
          ntrp: ntrp.trim() || null,
          tournamentHistory: tournamentHistory.trim() || null,
          formerPlayer,
        }),
      ]);

      // 세션에 업데이트된 이름 저장 (다른 화면에서도 사용)
      setOpenRunSession({ userName: updatedUser.name });

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
        return "비공개";
      case "PUBLIC":
        return "공개";
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="profile-edit-modal">
        <div className="modal-header">
          <div className="modal-header-top">
            <h2>프로필 수정</h2>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="profile-edit-modal__section-title">기본 정보</div>

          <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--name-gender">
            <div className="form-group profile-edit-modal__grid-item">
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

            <div className="form-group profile-edit-modal__grid-item profile-edit-modal__grid-item--compact">
              <label htmlFor="gender">성별 *</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "MALE" | "FEMALE" | "PRIVATE")
                }
                className="visibility-select"
              >
                <option value="MALE">남자</option>
                <option value="FEMALE">여자</option>
                <option value="PRIVATE">비공개</option>
              </select>
            </div>
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
                  title="비공개: 나만 볼 수 있음 / 공개: 클럽원 및 게스트 참여 시 공유"
                >
                  <option value="PRIVATE">
                    {getVisibilityShortLabel("PRIVATE")}
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
                  placeholder="01012345678"
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
                  title="비공개: 나만 볼 수 있음 / 공개: 클럽원 및 게스트 참여 시 공유"
                >
                  <option value="PRIVATE">
                    {getVisibilityShortLabel("PRIVATE")}
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

          <div className="form-group">
            <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--phone">
              <div className="form-group profile-edit-modal__grid-item">
                <label htmlFor="birthDate">생년월일</label>
                <input
                  type="text"
                  id="birthDate"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="950101"
                  maxLength={6}
                />
              </div>
              <div className="form-group profile-edit-modal__grid-item profile-edit-modal__grid-item--compact">
                <label htmlFor="birthDateVisibility">공개</label>
                <select
                  id="birthDateVisibility"
                  value={birthDateVisibility}
                  onChange={(e) =>
                    setBirthDateVisibility(e.target.value as ContactVisibility)
                  }
                  className="visibility-select"
                  title="비공개: 나만 볼 수 있음 / 공개: 클럽원 및 게스트 참여 시 공유"
                >
                  <option value="PRIVATE">
                    {getVisibilityShortLabel("PRIVATE")}
                  </option>
                  <option value="PUBLIC">
                    {getVisibilityShortLabel("PUBLIC")}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>지역</label>
            <RegionSelector
              depth1={regionDepth1}
              depth2={regionDepth2}
              onChangeDepth1={setRegionDepth1}
              onChangeDepth2={setRegionDepth2}
            />
            <small className="form-help">
              클럽 탐색 시 기본 필터로 사용됩니다.
            </small>
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
          </div>

          <div className="profile-edit-modal__grid-row profile-edit-modal__grid-row--tennis-1">
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
