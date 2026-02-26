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
import {
  normalizePhoneNumber,
  validatePhoneNumber as validatePhone,
  formatPhoneNumber,
} from "../../utils/contactUtils";
import { cn } from "@/lib/utils";

interface LocationState {
  token: string;
  userInfo: {
    id: number;
    name: string;
    email: string | null;
    imageUrl: string | null;
  };
}

const inputBaseClass =
  "w-full p-2 md:p-3 text-xs md:text-sm min-h-10 md:min-h-11 border border-border rounded-md bg-background text-foreground transition-all leading-snug focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed";

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
  const [birthDate, setBirthDate] = useState("");
  const [birthDateVisibility, setBirthDateVisibility] =
    useState<ContactVisibility>("PUBLIC");

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
        if (userProfile.phoneNumber) setPhoneNumber(formatPhoneNumber(userProfile.phoneNumber));
        if (userProfile.phoneVisibility)
          setPhoneVisibility(userProfile.phoneVisibility);
        if (userProfile.emailVisibility)
          setEmailVisibility(userProfile.emailVisibility);
        if (userProfile.gender) setGender(userProfile.gender);
        if (userProfile.birthDate) setBirthDate(userProfile.birthDate);
        if (userProfile.birthDateVisibility)
          setBirthDateVisibility(userProfile.birthDateVisibility);

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
    const error = validatePhone(value);
    setPhoneError(error);
    return error === null;
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
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const [updatedUser] = await Promise.all([
        updateUser({
          name: name.trim(),
          imageUrl: defaultImageUrl.trim() || null,
          phoneNumber: normalizedPhone || null,
          phoneVisibility,
          emailVisibility,
          gender,
          birthDate: birthDate.trim() || null,
          birthDateVisibility,
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

      // 네비게이션 대상 결정 → 시작 가이드로 이동 (가이드에서 설치/알림 유도 통합 처리)
      const session = getOpenRunSession();
      const finalDest = session.currentClubId ? "/schedules/club" : "/explore";
      navigate("/install-guide", { replace: true, state: { destination: finalDest } });
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
      <div className="flex flex-col items-center justify-center min-h-screen p-2 max-[359px]:p-1 bg-secondary md:p-4">
        <div className="bg-background rounded-xl shadow-lg w-full max-w-[600px] p-3 max-[359px]:p-2 md:p-5">
          <div className="text-center mb-5">
            <div className="text-lg max-[359px]:text-sm md:text-2xl font-bold text-foreground mb-2">
              환영합니다! 🎾
            </div>
            <div className="text-xs max-[359px]:text-xs md:text-sm text-muted-foreground leading-relaxed">
              프로필 정보를 불러오는 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 max-[359px]:p-1 bg-secondary md:p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-[600px] p-3 max-[359px]:p-2 md:p-5">
        <div className="text-center mb-5">
          <div className="text-lg max-[359px]:text-sm md:text-2xl font-bold text-foreground mb-2">
            환영합니다! 🎾
          </div>
          <div className="text-xs max-[359px]:text-xs md:text-sm text-muted-foreground leading-relaxed">
            OpenRun에서 사용할 프로필 정보를 설정해주세요.
            <br />
            대진표 및 스코어보드에 표시되는 정보입니다.
          </div>
        </div>

        {defaultName && (
          <div className="p-3 bg-muted rounded-md mb-4 text-sm">
            <span className="text-muted-foreground">현재 이름: </span>
            <span className="font-semibold text-foreground">{defaultName}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 기본 정보 */}
          <div className="text-sm max-[359px]:text-xs md:text-base font-bold text-foreground mt-5 mb-3 pt-4 border-t border-border first:mt-0 first:pt-0 first:border-t-0">
            기본 정보
          </div>

          {/* 이름 + 성별 */}
          <div className="grid grid-cols-[minmax(0,1fr)_160px] max-[425px]:grid-cols-[minmax(0,1fr)_140px] max-[359px]:grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="block text-sm font-semibold text-muted-foreground">
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
                className={cn(
                  inputBaseClass,
                  nameError && "border-red-600 focus:border-red-600 focus:ring-red-600/10"
                )}
              />
              {nameError && (
                <div className="text-xs text-red-600 mt-1">{nameError}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="gender" className="block text-sm font-semibold text-muted-foreground">
                성별 *
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "MALE" | "FEMALE" | "PRIVATE")
                }
                className={cn(inputBaseClass, "cursor-pointer pr-10")}
              >
                <option value="MALE">남자</option>
                <option value="FEMALE">여자</option>
                <option value="PRIVATE">비공개</option>
              </select>
            </div>
          </div>

          {/* 이메일 (읽기 전용) + 공개 설정 */}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_160px] max-[425px]:grid-cols-[minmax(0,1fr)_140px] max-[359px]:grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="block text-sm font-semibold text-muted-foreground">
                  이메일 *
                </label>
                <input
                  type="email"
                  id="email"
                  value={defaultEmail}
                  disabled
                  className={inputBaseClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="emailVisibility"
                  className="block text-sm font-semibold text-muted-foreground"
                >
                  공개
                </label>
                <select
                  id="emailVisibility"
                  value={emailVisibility}
                  onChange={(e) =>
                    setEmailVisibility(e.target.value as ContactVisibility)
                  }
                  className={cn(inputBaseClass, "cursor-pointer pr-10")}
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
            <small className="text-xs text-muted-foreground mt-1">
              이메일은 변경할 수 없습니다.
            </small>
          </div>

          {/* 전화번호 + 공개 설정 */}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_160px] max-[425px]:grid-cols-[minmax(0,1fr)_140px] max-[359px]:grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-semibold text-muted-foreground"
                >
                  연락처(선택)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  onBlur={() => validatePhoneNumber(phoneNumber)}
                  placeholder="01012345678"
                  className={cn(
                    inputBaseClass,
                    phoneError && "border-red-600 focus:border-red-600 focus:ring-red-600/10"
                  )}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="phoneVisibility"
                  className="block text-sm font-semibold text-muted-foreground"
                >
                  공개
                </label>
                <select
                  id="phoneVisibility"
                  value={phoneVisibility}
                  onChange={(e) =>
                    setPhoneVisibility(e.target.value as ContactVisibility)
                  }
                  className={cn(inputBaseClass, "cursor-pointer pr-10")}
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
              <div className="text-xs text-red-600 mt-1">{phoneError}</div>
            )}
            <small className="text-xs text-muted-foreground mt-1">
              서버에는 암호화되어 저장되고, 클럽과 게스트 신청 시에만
              사용됩니다.
            </small>
          </div>

          {/* 생년월일 + 공개 설정 */}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_160px] max-[425px]:grid-cols-[minmax(0,1fr)_140px] max-[359px]:grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-semibold text-muted-foreground"
                >
                  생년월일(선택)
                </label>
                <input
                  type="text"
                  id="birthDate"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="950101"
                  maxLength={6}
                  className={inputBaseClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="birthDateVisibility"
                  className="block text-sm font-semibold text-muted-foreground"
                >
                  공개
                </label>
                <select
                  id="birthDateVisibility"
                  value={birthDateVisibility}
                  onChange={(e) =>
                    setBirthDateVisibility(e.target.value as ContactVisibility)
                  }
                  className={cn(inputBaseClass, "cursor-pointer pr-10")}
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

          {/* 테니스 프로필 */}
          <div className="text-sm max-[359px]:text-xs md:text-base font-bold text-foreground mt-5 mb-3 pt-4 border-t border-border first:mt-0 first:pt-0 first:border-t-0">
            테니스 프로필
          </div>

          {/* 테니스 시작일 */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="tennisStartedMonth"
              className="block text-sm font-semibold text-muted-foreground"
            >
              테니스 시작일 (연/월)
            </label>
            <input
              type="month"
              id="tennisStartedMonth"
              value={tennisStartedMonth}
              onChange={(e) => setTennisStartedMonth(e.target.value)}
              placeholder="YYYY-MM"
              className={inputBaseClass}
            />
          </div>

          {/* NTRP + 선수출신 */}
          <div className="grid grid-cols-[minmax(0,1fr)_160px] max-[425px]:grid-cols-[minmax(0,1fr)_140px] max-[359px]:grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="ntrp" className="block text-sm font-semibold text-muted-foreground">
                NTRP (선택)
              </label>
              <input
                type="text"
                id="ntrp"
                value={ntrp}
                onChange={(e) => setNtrp(e.target.value)}
                placeholder="예: 3.5"
                className={inputBaseClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="formerPlayer"
                className="block text-sm font-semibold text-muted-foreground"
              >
                선수출신
              </label>
              <select
                id="formerPlayer"
                value={formerPlayer ? "true" : "false"}
                onChange={(e) => setFormerPlayer(e.target.value === "true")}
                className={cn(inputBaseClass, "cursor-pointer pr-10")}
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
          </div>

          {/* 대회/리그 경력 */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="tournamentHistory"
              className="block text-sm font-semibold text-muted-foreground"
            >
              대회/리그 경력 (선택)
            </label>
            <textarea
              id="tournamentHistory"
              value={tournamentHistory}
              onChange={(e) => setTournamentHistory(e.target.value)}
              placeholder="예: 2025 ○○ 대회 8강"
              rows={2}
              className={cn(inputBaseClass, "min-h-20 resize-y leading-normal")}
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full p-2 max-[359px]:p-2 md:p-3 bg-primary text-primary-foreground border-none rounded-md text-sm max-[359px]:text-xs md:text-base font-semibold min-h-10 max-[359px]:min-h-10 md:min-h-12 cursor-pointer transition-all mt-4 hover:not-disabled:bg-primary/90 hover:not-disabled:-translate-y-px hover:not-disabled:shadow-sm disabled:bg-border disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "저장 중..." : "저장하고 시작하기"}
          </button>
        </form>

        <p className="text-center mt-4 text-xs text-muted-foreground">
          나중에 프로필 설정에서 변경할 수 있습니다.
        </p>
      </div>

    </div>
  );
};

export default SetupProfilePage;
