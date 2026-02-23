import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ContactVisibility } from "../../services/api/userApi";
import {
  getCurrentUser,
  getMyTennisProfile,
  updateMyTennisProfile,
  updateUser,
} from "../../services/api/userApi";
import { setOpenRunSession } from "../../utils/openrunSession";
import {
  normalizePhoneNumber,
  validatePhoneNumber as validatePhone,
  formatPhoneNumber,
} from "../../utils/contactUtils";
import RegionSelector from "../../components/common/RegionSelector";
import BackButton from "../../components/common/BackButton";
import { useToast } from "../../contexts/ToastContext";
import { cn } from "../../lib/utils";

/* ── Pill Toggle 컴포넌트 ── */
function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
            value === opt.value
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 사용자 데이터 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 폼 필드 상태
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVisibility, setPhoneVisibility] = useState<ContactVisibility>("PRIVATE");
  const [emailVisibility, setEmailVisibility] = useState<ContactVisibility>("PUBLIC");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "PRIVATE">("PRIVATE");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateVisibility, setBirthDateVisibility] = useState<ContactVisibility>("PUBLIC");
  const [regionDepth1, setRegionDepth1] = useState("");
  const [regionDepth2, setRegionDepth2] = useState("");

  // 테니스 프로필 상태
  const [tennisStartedMonth, setTennisStartedMonth] = useState(""); // YYYY-MM
  const [ntrp, setNtrp] = useState("");
  const [formerPlayer, setFormerPlayer] = useState(false);
  const [tournamentHistory, setTournamentHistory] = useState("");

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 마운트 시 사용자 데이터 조회
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [userProfile, tennisProfile] = await Promise.all([
          getCurrentUser(),
          getMyTennisProfile(),
        ]);

        if (!mounted) return;

        setUserId(userProfile.id);
        setEmail(userProfile.email);
        setName(userProfile.name);
        setImageUrl(userProfile.imageUrl || "");
        setPhoneNumber(formatPhoneNumber(userProfile.phoneNumber));
        setPhoneVisibility(userProfile.phoneVisibility || "PRIVATE");
        setEmailVisibility(userProfile.emailVisibility || "PUBLIC");
        setGender((userProfile.gender as "MALE" | "FEMALE" | "PRIVATE") || "PRIVATE");
        setBirthDate(userProfile.birthDate || "");
        setBirthDateVisibility(userProfile.birthDateVisibility || "PUBLIC");
        setRegionDepth1(userProfile.regionDepth1 || "");
        setRegionDepth2(userProfile.regionDepth2 || "");

        setTennisStartedMonth(
          tennisProfile.tennisStartedAt
            ? tennisProfile.tennisStartedAt.slice(0, 7)
            : ""
        );
        setNtrp(tennisProfile.ntrp ?? "");
        setFormerPlayer(Boolean(tennisProfile.formerPlayer));
        setTournamentHistory(tennisProfile.tournamentHistory ?? "");
      } catch (error: unknown) {
        if (!mounted) return;
        console.error("프로필 데이터 조회 실패:", error);
        setLoadError("프로필 정보를 불러오는데 실패했습니다.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // 이름 유효성 검사
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

  // 전화번호 유효성 검사
  const validatePhoneNumber = (value: string): boolean => {
    const err = validatePhone(value);
    setPhoneError(err);
    return err === null;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPhoneNumber(newValue);
    validatePhoneNumber(newValue);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateName(name)) return;
    if (!validatePhoneNumber(phoneNumber)) return;

    setIsSubmitting(true);

    try {
      const tennisStartedAt = tennisStartedMonth
        ? `${tennisStartedMonth}-01`
        : null;

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

      setOpenRunSession({ userName: updatedUser.name });
      showToast("프로필이 수정되었습니다", "success");
      navigate(-1);
    } catch (error: unknown) {
      console.error("프로필 수정 실패:", error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message = axiosError.response?.data?.message;
      setSubmitError(message || "프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공유 스타일
  const inputBase =
    "w-full bg-transparent border-0 border-b-2 border-border px-0 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors";
  const labelBase = "block mb-1.5 text-xs font-semibold text-secondary";
  const sectionTitle =
    "flex items-center gap-2 text-base font-bold text-secondary mb-5";

  // 헤더 컴포넌트
  const Header = () => (
    <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between -mx-3 -mt-0 mb-4 rounded-b-2xl">
      <BackButton className="text-white" />
      <span className="text-sm font-bold">프로필 수정</span>
      <button
        type="submit"
        form="profile-form"
        disabled={isSubmitting}
        className="text-sm font-bold text-primary disabled:opacity-50 px-1 py-1"
      >
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </div>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <div className="text-center py-10 text-muted-foreground text-sm">
          불러오는 중...
        </div>
      </div>
    );
  }

  // 로드 에러 상태
  if (loadError) {
    return (
      <div className="page-container">
        <Header />
        <div className="text-center py-10 text-destructive text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <form id="profile-form" onSubmit={handleSubmit} className="px-1">
        {/* 제출 에러 */}
        {submitError && (
          <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">
            {submitError}
          </div>
        )}

        {/* ━━ 섹션 1: 기본 정보 ━━ */}
        <div className={sectionTitle}>
          <div className="w-1 h-5 bg-primary rounded-full" />
          기본 정보
        </div>

        {/* 이름 + 성별 (같은 줄) */}
        <div className="mb-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="name" className={labelBase}>
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
                className={cn(
                  inputBase,
                  nameError && "border-destructive focus:border-destructive"
                )}
              />
              {nameError && (
                <div className="text-xs text-destructive mt-1">{nameError}</div>
              )}
            </div>
            <div className="shrink-0">
              <label className={labelBase}>성별 *</label>
              <div className="pt-1">
                <PillToggle
                  options={[
                    { value: "MALE", label: "남성" },
                    { value: "FEMALE", label: "여성" },
                    { value: "PRIVATE", label: "비공개" },
                  ]}
                  value={gender}
                  onChange={setGender}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 이메일 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-secondary">
              이메일
            </label>
            <PillToggle
              options={[
                { value: "PUBLIC", label: "공개" },
                { value: "PRIVATE", label: "비공개" },
              ]}
              value={emailVisibility}
              onChange={setEmailVisibility}
            />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            disabled
            className={cn(inputBase, "text-muted-foreground cursor-not-allowed")}
          />
          <small className="block mt-1 text-xs text-muted-foreground">
            이메일은 변경할 수 없습니다.
          </small>
        </div>

        {/* 전화번호 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="phoneNumber" className="text-xs font-semibold text-secondary">
              전화번호
            </label>
            <PillToggle
              options={[
                { value: "PUBLIC", label: "공개" },
                { value: "PRIVATE", label: "비공개" },
              ]}
              value={phoneVisibility}
              onChange={setPhoneVisibility}
            />
          </div>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onBlur={() => validatePhoneNumber(phoneNumber)}
            placeholder="01012345678"
            className={cn(
              inputBase,
              phoneError && "border-destructive focus:border-destructive"
            )}
          />
          {phoneError && (
            <div className="text-xs text-destructive mt-1">{phoneError}</div>
          )}
        </div>

        {/* 생년월일 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="birthDate" className="text-xs font-semibold text-secondary">
              생년월일
            </label>
            <PillToggle
              options={[
                { value: "PUBLIC", label: "공개" },
                { value: "PRIVATE", label: "비공개" },
              ]}
              value={birthDateVisibility}
              onChange={setBirthDateVisibility}
            />
          </div>
          <input
            type="text"
            id="birthDate"
            value={birthDate}
            onChange={(e) =>
              setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="950101"
            maxLength={6}
            className={inputBase}
          />
        </div>

        {/* 지역 */}
        <div className="mb-5">
          <label className={labelBase}>활동 지역</label>
          <RegionSelector
            depth1={regionDepth1}
            depth2={regionDepth2}
            onChangeDepth1={setRegionDepth1}
            onChangeDepth2={setRegionDepth2}
          />
          <small className="block mt-1 text-xs text-muted-foreground">
            클럽 탐색 시 기본 필터로 사용됩니다.
          </small>
        </div>

        {/* 구분선 */}
        <div className="border-t border-border my-6" />

        {/* ━━ 섹션 2: 테니스 프로필 ━━ */}
        <div className={sectionTitle}>
          <div className="w-1 h-5 bg-primary rounded-full" />
          테니스 프로필
        </div>

        {/* 테니스 시작일 */}
        <div className="mb-5">
          <label htmlFor="tennisStartedMonth" className={labelBase}>
            테니스 시작일
          </label>
          <input
            type="month"
            id="tennisStartedMonth"
            value={tennisStartedMonth}
            onChange={(e) => setTennisStartedMonth(e.target.value)}
            placeholder="YYYY-MM"
            className={cn(inputBase, "overflow-hidden")}
          />
        </div>

        {/* NTRP */}
        <div className="mb-5">
          <label htmlFor="ntrp" className={labelBase}>
            NTRP
          </label>
          <input
            type="text"
            id="ntrp"
            value={ntrp}
            onChange={(e) => setNtrp(e.target.value)}
            placeholder="예: 3.5"
            className={inputBase}
          />
        </div>

        {/* 선수출신 */}
        <div className="mb-5">
          <label className={labelBase}>선수 출신</label>
          <PillToggle
            options={[
              { value: "false", label: "일반인 (동호인)" },
              { value: "true", label: "선수 출신" },
            ]}
            value={formerPlayer ? "true" : "false"}
            onChange={(v) => setFormerPlayer(v === "true")}
          />
        </div>

        {/* 대회/리그 경력 */}
        <div className="mb-5">
          <label htmlFor="tournamentHistory" className={labelBase}>
            대회/리그 경력
          </label>
          <textarea
            id="tournamentHistory"
            value={tournamentHistory}
            onChange={(e) => setTournamentHistory(e.target.value)}
            placeholder="경력이나 수상 이력을 입력해주세요."
            rows={3}
            className={cn(
              "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-muted/30 text-foreground",
              "placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
              "min-h-[80px] resize-y leading-normal transition-colors"
            )}
          />
        </div>

        {/* 하단 여백 */}
        <div className="h-6" />
      </form>

      {/* userId 보존 */}
      {userId !== null && <input type="hidden" value={userId} />}
      {/* imageUrl 보존 */}
      {imageUrl && <input type="hidden" value={imageUrl} />}
    </div>
  );
};

export default ProfileEditPage;
