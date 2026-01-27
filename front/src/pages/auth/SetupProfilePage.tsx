import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ContactVisibility } from "../../services/api/userApi";
import {
  updateUser,
  updateMyTennisProfile,
  getCurrentUser,
  getMyTennisProfile,
} from "../../services/api/userApi";
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../../utils/openrunSession";
import "./SetupProfilePage.css";

interface LocationState {
  token: string;
  userInfo: {
    id: number;
    name: string;
    email: string | null;
    imageUrl: string | null;
  };
}

const SetupProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // OAuth에서 받은 기본 정보
  const session = getOpenRunSession();
  const defaultName = state?.userInfo?.name || session.userName || "";
  const defaultEmail = state?.userInfo?.email || session.userEmail || "";
  const defaultImageUrl =
    state?.userInfo?.imageUrl || session.userImageUrl || "";

  // 기본 정보
  const [name, setName] = useState(defaultName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVisibility, setPhoneVisibility] =
    useState<ContactVisibility>("PUBLIC");
  const [emailVisibility, setEmailVisibility] =
    useState<ContactVisibility>("PUBLIC");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "PRIVATE">(
    "PRIVATE"
  );

  // 테니스 프로필
  const [tennisStartedMonth, setTennisStartedMonth] = useState<string>(""); // YYYY-MM
  const [ntrp, setNtrp] = useState<string>("");
  const [formerPlayer, setFormerPlayer] = useState<boolean>(false);
  const [tournamentHistory, setTournamentHistory] = useState<string>("");

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 기존 사용자 정보 불러오기
  useEffect(() => {
    let mounted = true;
    const loadExistingProfile = async () => {
      try {
        const [userProfile, tennisProfile] = await Promise.all([
          getCurrentUser(),
          getMyTennisProfile(),
        ]);

        if (!mounted) return;

        // 기본 정보 설정 (기존 값이 있으면 사용)
        if (userProfile.name) setName(userProfile.name);
        if (userProfile.phoneNumber) setPhoneNumber(userProfile.phoneNumber);
        if (userProfile.phoneVisibility)
          setPhoneVisibility(userProfile.phoneVisibility);
        if (userProfile.emailVisibility)
          setEmailVisibility(userProfile.emailVisibility);
        if (userProfile.gender) setGender(userProfile.gender);

        // 테니스 프로필 설정
        if (tennisProfile.tennisStartedAt) {
          setTennisStartedMonth(tennisProfile.tennisStartedAt.slice(0, 7));
        }
        if (tennisProfile.ntrp) setNtrp(tennisProfile.ntrp);
        setFormerPlayer(Boolean(tennisProfile.formerPlayer));
        if (tennisProfile.tournamentHistory) {
          setTournamentHistory(tennisProfile.tournamentHistory);
        }
      } catch (e) {
        // 신규 사용자는 프로필이 없을 수 있으므로 에러는 무시
        console.log("기존 프로필 없음 (신규 사용자):", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadExistingProfile();
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
    if (newValue.trim() === "") {
      setNameError("이름을 입력해주세요.");
    } else {
      setNameError(null);
    }
  };

  const validatePhoneNumber = (value: string): boolean => {
    if (!value.trim()) {
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
    validatePhoneNumber(newValue);
  };

  const getVisibilityShortLabel = (visibility: ContactVisibility): string => {
    switch (visibility) {
      case "PRIVATE":
        return "비공개";
      case "PUBLIC":
        return "공개";
    }
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
        : null;

      // 기본 정보 + 테니스 프로필 동시 업데이트
      const [updatedUser] = await Promise.all([
        updateUser({
          name: name.trim(),
          imageUrl: defaultImageUrl.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          phoneVisibility,
          emailVisibility,
          gender,
        }),
        updateMyTennisProfile({
          tennisStartedAt,
          ntrp: ntrp.trim() || null,
          tournamentHistory: tournamentHistory.trim() || null,
          formerPlayer,
        }),
      ]);

      // 세션에 업데이트된 이름 저장
      setOpenRunSession({ userName: updatedUser.name });

      console.log("✅ 프로필 설정 완료:", updatedUser);

      // 메인 화면으로 이동
      navigate("/schedules/club");
    } catch (err: unknown) {
      console.error("❌ 프로필 설정 실패:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || "프로필 설정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="setup-profile-page">
        <div className="setup-profile-page__container">
          <div className="setup-profile-page__header">
            <h1 className="setup-profile-page__title">환영합니다! 🎾</h1>
            <p className="setup-profile-page__subtitle">
              프로필 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-profile-page">
      <div className="setup-profile-page__container">
        <div className="setup-profile-page__header">
          <h1 className="setup-profile-page__title">환영합니다! 🎾</h1>
          <p className="setup-profile-page__subtitle">
            OpenRun에서 사용할 프로필 정보를 설정해주세요.
            <br />
            대진표 및 스코어보드에 표시되는 정보입니다.
          </p>
        </div>

        {defaultName && (
          <div className="setup-profile-page__default-name">
            <span className="setup-profile-page__default-name-label">
              현재 이름:{" "}
            </span>
            <span className="setup-profile-page__default-name-value">
              {defaultName}
            </span>
          </div>
        )}

        {error && <div className="setup-profile-page__error">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-profile-page__form">
          {/* 기본 정보 */}
          <div className="setup-profile-page__section-title">기본 정보</div>

          {/* 이름 + 성별 */}
          <div className="setup-profile-page__grid-row">
            <div className="setup-profile-page__form-group">
              <label htmlFor="name" className="setup-profile-page__label">
                이름 *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                onBlur={() => validateName(name)}
                placeholder="이름을 입력하세요"
                maxLength={50}
                required
                autoFocus
                className={`setup-profile-page__input ${
                  nameError ? "input-error" : ""
                }`}
              />
              {nameError && (
                <div className="setup-profile-page__field-error">
                  {nameError}
                </div>
              )}
            </div>

            <div className="setup-profile-page__form-group">
              <label htmlFor="gender" className="setup-profile-page__label">
                성별 *
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "MALE" | "FEMALE" | "PRIVATE")
                }
                className="setup-profile-page__select"
              >
                <option value="MALE">남자</option>
                <option value="FEMALE">여자</option>
                <option value="PRIVATE">비공개</option>
              </select>
            </div>
          </div>

          {/* 이메일 (읽기 전용) + 공개 설정 */}
          <div className="setup-profile-page__form-group">
            <div className="setup-profile-page__grid-row">
              <div className="setup-profile-page__form-group">
                <label htmlFor="email" className="setup-profile-page__label">
                  이메일 *
                </label>
                <input
                  type="email"
                  id="email"
                  value={defaultEmail}
                  disabled
                  className="setup-profile-page__input"
                />
              </div>
              <div className="setup-profile-page__form-group">
                <label
                  htmlFor="emailVisibility"
                  className="setup-profile-page__label"
                >
                  공개
                </label>
                <select
                  id="emailVisibility"
                  value={emailVisibility}
                  onChange={(e) =>
                    setEmailVisibility(e.target.value as ContactVisibility)
                  }
                  className="setup-profile-page__select"
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
            <small className="setup-profile-page__field-help">
              이메일은 변경할 수 없습니다.
            </small>
          </div>

          {/* 전화번호 + 공개 설정 */}
          <div className="setup-profile-page__form-group">
            <div className="setup-profile-page__grid-row">
              <div className="setup-profile-page__form-group">
                <label
                  htmlFor="phoneNumber"
                  className="setup-profile-page__label"
                >
                  연락처(선택)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  onBlur={() => validatePhoneNumber(phoneNumber)}
                  placeholder="010-1234-5678"
                  className={`setup-profile-page__input ${
                    phoneError ? "input-error" : ""
                  }`}
                />
              </div>
              <div className="setup-profile-page__form-group">
                <label
                  htmlFor="phoneVisibility"
                  className="setup-profile-page__label"
                >
                  공개
                </label>
                <select
                  id="phoneVisibility"
                  value={phoneVisibility}
                  onChange={(e) =>
                    setPhoneVisibility(e.target.value as ContactVisibility)
                  }
                  className="setup-profile-page__select"
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
              <div className="setup-profile-page__field-error">
                {phoneError}
              </div>
            )}
            <small className="setup-profile-page__field-help">
              서버에는 암호화되어 저장되고, 클럽과 게스트 신청 시에만
              사용됩니다.
            </small>
          </div>

          {/* 테니스 프로필 */}
          <div className="setup-profile-page__section-title">테니스 프로필</div>

          {/* 테니스 시작일 */}
          <div className="setup-profile-page__form-group">
            <label
              htmlFor="tennisStartedMonth"
              className="setup-profile-page__label"
            >
              테니스 시작일 (연/월)
            </label>
            <input
              type="month"
              id="tennisStartedMonth"
              value={tennisStartedMonth}
              onChange={(e) => setTennisStartedMonth(e.target.value)}
              placeholder="YYYY-MM"
              className="setup-profile-page__input"
            />
          </div>

          {/* NTRP + 선수출신 */}
          <div className="setup-profile-page__grid-row">
            <div className="setup-profile-page__form-group">
              <label htmlFor="ntrp" className="setup-profile-page__label">
                NTRP (선택)
              </label>
              <input
                type="text"
                id="ntrp"
                value={ntrp}
                onChange={(e) => setNtrp(e.target.value)}
                placeholder="예: 3.5"
                className="setup-profile-page__input"
              />
            </div>

            <div className="setup-profile-page__form-group">
              <label
                htmlFor="formerPlayer"
                className="setup-profile-page__label"
              >
                선수출신
              </label>
              <select
                id="formerPlayer"
                value={formerPlayer ? "true" : "false"}
                onChange={(e) => setFormerPlayer(e.target.value === "true")}
                className="setup-profile-page__select"
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
          </div>

          {/* 대회/리그 경력 */}
          <div className="setup-profile-page__form-group">
            <label
              htmlFor="tournamentHistory"
              className="setup-profile-page__label"
            >
              대회/리그 경력 (선택)
            </label>
            <textarea
              id="tournamentHistory"
              value={tournamentHistory}
              onChange={(e) => setTournamentHistory(e.target.value)}
              placeholder="예: 2025 ○○ 대회 8강"
              rows={2}
              className="setup-profile-page__textarea"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="setup-profile-page__submit-btn"
          >
            {isSubmitting ? "저장 중..." : "저장하고 시작하기"}
          </button>
        </form>

        <p className="setup-profile-page__footer-note">
          나중에 프로필 설정에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SetupProfilePage;
