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
import { cn } from "../lib/utils";

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
    if (newValue.trim() === "") {
      setNameError("이름을 입력해주세요.");
    } else {
      setNameError(null);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateName(name)) {
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

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

  // Shared base classes for input, select, textarea
  const fieldBase =
    "w-full max-w-full box-border min-h-[40px] px-[10px] py-[8px] text-sm border border-border rounded-sm bg-background text-foreground transition-colors leading-[1.2] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]";
  const selectBase = cn(fieldBase, "cursor-pointer pr-10");
  const textareaBase = cn(fieldBase, "min-h-[72px] resize-y leading-normal");

  // Grid row used for label+visibility pairs
  const gridRow =
    "grid gap-[10px] mb-4 [grid-template-columns:minmax(0,1fr)_160px] max-[360px]:[grid-template-columns:1fr]";
  const labelBase = "block mb-1 text-xs font-semibold text-muted-foreground";

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4",
        "max-[425px]:p-0 max-[425px]:items-end"
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "bg-background rounded-md shadow-lg w-full max-w-[500px] max-h-[90vh] overflow-y-auto",
          "max-[425px]:max-w-full max-[425px]:max-h-[95vh] max-[425px]:rounded-t-md max-[425px]:rounded-b-none"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border max-[425px]:p-3">
          <div className="flex items-center justify-between gap-2 w-full min-h-[32px]">
            <h2 className="m-0 text-xl font-bold text-foreground flex-1 text-left leading-[1.2] max-[425px]:text-base">
              프로필 수정
            </h2>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-x-hidden max-[425px]:p-3">
          {error && (
            <div className="p-3 mb-4 bg-[#fee] border border-[#fcc] rounded-sm text-[#c33] text-xs">
              {error}
            </div>
          )}

          {/* Section: 기본 정보 */}
          <div className="mb-4 text-sm font-bold text-foreground">기본 정보</div>

          {/* Name + Gender */}
          <div className={gridRow}>
            <div>
              <label htmlFor="name" className={labelBase}>이름 *</label>
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
                  fieldBase,
                  nameError &&
                    "border-[#c33] focus:border-[#c33] focus:shadow-[0_0_0_3px_rgba(204,51,51,0.1)]"
                )}
              />
              {nameError && (
                <div className="mt-1 text-xs text-[#c33]">{nameError}</div>
              )}
            </div>

            <div>
              <label htmlFor="gender" className={labelBase}>성별 *</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "MALE" | "FEMALE" | "PRIVATE")
                }
                className={selectBase}
              >
                <option value="MALE">남자</option>
                <option value="FEMALE">여자</option>
                <option value="PRIVATE">비공개</option>
              </select>
            </div>
          </div>

          {/* Email + visibility */}
          <div className="mb-4">
            <div className={gridRow.replace("mb-4", "")}>
              <div>
                <label htmlFor="email" className={labelBase}>이메일</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className={cn(fieldBase, "bg-muted text-muted-foreground cursor-not-allowed")}
                />
                <small className="block mt-1 text-xs text-muted-foreground">
                  이메일은 변경할 수 없습니다.
                </small>
              </div>
              <div>
                <label htmlFor="emailVisibility" className={labelBase}>공개</label>
                <select
                  id="emailVisibility"
                  value={emailVisibility}
                  onChange={(e) =>
                    setEmailVisibility(e.target.value as ContactVisibility)
                  }
                  className={selectBase}
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

          {/* Phone + visibility */}
          <div className="mb-4">
            <div className={gridRow.replace("mb-4", "")}>
              <div>
                <label htmlFor="phoneNumber" className={labelBase}>전화번호</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  onBlur={() => validatePhoneNumber(phoneNumber)}
                  placeholder="01012345678"
                  className={cn(
                    fieldBase,
                    phoneError &&
                      "border-[#c33] focus:border-[#c33] focus:shadow-[0_0_0_3px_rgba(204,51,51,0.1)]"
                  )}
                />
              </div>
              <div>
                <label htmlFor="phoneVisibility" className={labelBase}>공개</label>
                <select
                  id="phoneVisibility"
                  value={phoneVisibility}
                  onChange={(e) =>
                    setPhoneVisibility(e.target.value as ContactVisibility)
                  }
                  className={selectBase}
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
              <div className="mt-1 text-xs text-[#c33]">{phoneError}</div>
            )}
          </div>

          {/* BirthDate + visibility */}
          <div className="mb-4">
            <div className={gridRow.replace("mb-4", "")}>
              <div>
                <label htmlFor="birthDate" className={labelBase}>생년월일</label>
                <input
                  type="text"
                  id="birthDate"
                  value={birthDate}
                  onChange={(e) =>
                    setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="950101"
                  maxLength={6}
                  className={fieldBase}
                />
              </div>
              <div>
                <label htmlFor="birthDateVisibility" className={labelBase}>공개</label>
                <select
                  id="birthDateVisibility"
                  value={birthDateVisibility}
                  onChange={(e) =>
                    setBirthDateVisibility(e.target.value as ContactVisibility)
                  }
                  className={selectBase}
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

          {/* Region */}
          <div className="mb-4">
            <label className={labelBase}>지역</label>
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

          {/* Section: 테니스 프로필 */}
          <div className="pt-6 mb-4 text-sm font-bold text-foreground">테니스 프로필</div>

          {/* Tennis start month */}
          <div className="mb-4">
            <label htmlFor="tennisStartedMonth" className={labelBase}>
              테니스 시작일 (연/월)
            </label>
            <input
              type="month"
              id="tennisStartedMonth"
              value={tennisStartedMonth}
              onChange={(e) => setTennisStartedMonth(e.target.value)}
              placeholder="YYYY-MM"
              className={cn(fieldBase, "overflow-hidden")}
            />
          </div>

          {/* NTRP + Former player */}
          <div className={gridRow}>
            <div>
              <label htmlFor="ntrp" className={labelBase}>NTRP</label>
              <input
                type="text"
                id="ntrp"
                value={ntrp}
                onChange={(e) => setNtrp(e.target.value)}
                placeholder="예: 3.5"
                className={fieldBase}
              />
            </div>

            <div>
              <label htmlFor="formerPlayer" className={labelBase}>선수출신</label>
              <select
                id="formerPlayer"
                value={formerPlayer ? "true" : "false"}
                onChange={(e) => setFormerPlayer(e.target.value === "true")}
                className={selectBase}
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
          </div>

          {/* Tournament history */}
          <div className="mb-4">
            <label htmlFor="tournamentHistory" className={labelBase}>대회/리그 경력</label>
            <textarea
              id="tournamentHistory"
              value={tournamentHistory}
              onChange={(e) => setTournamentHistory(e.target.value)}
              placeholder="예: 2025 ○○ 대회 8강"
              rows={2}
              className={textareaBase}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 text-base font-semibold min-h-[44px] border-none rounded-sm cursor-pointer transition-colors bg-muted text-foreground hover:bg-border"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 p-3 text-base font-semibold min-h-[44px] border-none rounded-sm cursor-pointer transition-colors bg-primary text-primary-foreground hover:enabled:brightness-90 hover:enabled:-translate-y-px hover:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
