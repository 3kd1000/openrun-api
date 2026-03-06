import type React from "react";
import { useState } from "react";
import { Users, Globe, ChevronLeft, ChevronRight, PenLine, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { AppHeader } from "../../../components/common/AppHeader";
import { cn } from "../../../lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RegionSelector from "../../../components/common/RegionSelector";
import type { MatchType } from "../../../types/schedule";

// native select에 Input과 동일한 높이/스타일
const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

// 시간 옵션 생성 (정시만)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    options.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return options;
};
const timeOptions = generateTimeOptions();

export interface WizardData {
  isPublic: boolean;
  courtName: string;
  courtAddress: string;
  regionDepth1: string;
  regionDepth2: string;
  selectedDate: string;
  selectedTime: string;
  durationMinutes: number;
  maxCapacity: number;
  numberOfCourts?: number;
  cost?: number;
  matchType?: MatchType;
  description: string;
}

interface ScheduleTypeWizardProps {
  hasClub: boolean;
  onComplete: (data: WizardData, dontShowAgain: boolean) => void;
  onSkip: (dontShowAgain: boolean) => void;
  onBack: () => void;
  defaultDate?: string;
}

const TOTAL_STEPS = 4;

export default function ScheduleTypeWizard({ hasClub, onComplete, onSkip, onBack, defaultDate }: ScheduleTypeWizardProps) {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Step 1: 유형
  const [selectedType, setSelectedType] = useState<"club" | "public" | null>(null);

  // Step 2: 코트 정보
  const [courtName, setCourtName] = useState("");
  const [courtAddress, setCourtAddress] = useState("");
  const [regionDepth1, setRegionDepth1] = useState("");
  const [regionDepth2, setRegionDepth2] = useState("");

  // Step 3: 일정 정보
  const now = new Date();
  const defaultHour = now.getHours() + 3;
  const defaultDateFallback = defaultHour >= 24
    ? format(new Date(now.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd")
    : format(now, "yyyy-MM-dd");
  const defaultTimeFallback = `${String(defaultHour >= 24 ? defaultHour - 24 : defaultHour).padStart(2, "0")}:00`;

  const [selectedDate, setSelectedDate] = useState(defaultDate || defaultDateFallback);
  const [selectedTime, setSelectedTime] = useState(defaultTimeFallback);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [numberOfCourts, setNumberOfCourts] = useState<number | undefined>(undefined);

  // Step 4: 추가 정보
  const [cost, setCost] = useState<number | undefined>(undefined);
  const [matchType, setMatchType] = useState<MatchType>(undefined as unknown as MatchType);
  const [description, setDescription] = useState("");

  const canNext = () => {
    switch (step) {
      case 1: return !!selectedType;
      case 2: return courtName.trim().length > 0;
      case 3: return !!selectedDate && !!selectedTime && maxCapacity > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // 완료
      onComplete({
        isPublic: selectedType === "public",
        courtName: courtName.trim(),
        courtAddress: courtAddress.trim(),
        regionDepth1,
        regionDepth2,
        selectedDate,
        selectedTime,
        durationMinutes,
        maxCapacity,
        numberOfCourts,
        cost,
        matchType: matchType === ("NONE" as unknown as MatchType) ? undefined : matchType,
        description: description.trim(),
      }, dontShowAgain);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const stepLabels = ["유형 선택", "코트 정보", "일정 정보", "추가 정보"];

  return (
    <div className="page-container">
      <AppHeader
        title="일정 등록"
        onBack={handlePrev}
        rightElement={
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={() => onSkip(dontShowAgain)}
          >
            <PenLine size={14} />
            바로 작성
          </button>
        }
      />

      {/* 프로그레스 바 */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={cn(
                "text-xs font-semibold",
                i + 1 === step
                  ? "text-primary"
                  : i + 1 < step
                  ? "text-primary/60"
                  : "text-muted-foreground/40"
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 내용 */}
      <div className="flex-1">
        {step === 1 && (
          <Step1TypeSelection
            selectedType={selectedType}
            hasClub={hasClub}
            onSelect={setSelectedType}
          />
        )}
        {step === 2 && (
          <Step2CourtInfo
            courtName={courtName}
            onCourtNameChange={setCourtName}
            courtAddress={courtAddress}
            onCourtAddressChange={setCourtAddress}
            regionDepth1={regionDepth1}
            regionDepth2={regionDepth2}
            onRegionDepth1Change={setRegionDepth1}
            onRegionDepth2Change={setRegionDepth2}
          />
        )}
        {step === 3 && (
          <Step3ScheduleInfo
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
            durationMinutes={durationMinutes}
            onDurationChange={setDurationMinutes}
            maxCapacity={maxCapacity}
            onMaxCapacityChange={setMaxCapacity}
            numberOfCourts={numberOfCourts}
            onNumberOfCourtsChange={setNumberOfCourts}
          />
        )}
        {step === 4 && (
          <Step4AdditionalInfo
            isClub={selectedType === "club"}
            cost={cost}
            onCostChange={setCost}
            matchType={matchType}
            onMatchTypeChange={setMatchType}
            description={description}
            onDescriptionChange={setDescription}
          />
        )}
      </div>

      {/* 하단: 네비게이션 버튼 + 건너뛰기 + 다음부터 보지않기 */}
      <div className="flex flex-col gap-3 mt-6">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-1 flex-1 py-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium cursor-pointer transition-colors hover:bg-muted"
            onClick={handlePrev}
          >
            <ChevronLeft size={16} />
            이전
          </button>
          <button
            type="button"
            disabled={!canNext()}
            className={cn(
              "flex items-center justify-center gap-1 flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
              canNext()
                ? "bg-primary text-white cursor-pointer hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={handleNext}
          >
            {step === TOTAL_STEPS ? "확인" : "다음"}
            {step < TOTAL_STEPS && <ChevronRight size={16} />}
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer self-center">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">다음부터 보지않기</span>
        </label>
      </div>
    </div>
  );
}

/* ── Step 1: 유형 선택 ── */
function Step1TypeSelection({
  selectedType,
  hasClub,
  onSelect,
}: {
  selectedType: "club" | "public" | null;
  hasClub: boolean;
  onSelect: (type: "club" | "public") => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground mb-1">
          어떤 일정을 만들까요?
        </h2>
        <p className="text-xs text-muted-foreground">
          목적에 맞는 일정 유형을 선택하세요
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!hasClub}
          className={cn(
            "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer bg-card",
            selectedType === "club"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40",
            !hasClub && "opacity-40 cursor-not-allowed hover:border-border"
          )}
          onClick={() => hasClub && onSelect("club")}
        >
          <div className="flex items-start gap-3">
            <Users className={cn(
              "mt-0.5 h-8 w-8 shrink-0",
              selectedType === "club" ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">클럽일정</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                소속 클럽 멤버만 참가할 수 있는 일정입니다.
                클럽 내 코트 예약, 정기 모임 등에 활용하세요.
              </p>
              {!hasClub && (
                <p className="text-xs text-destructive mt-1">
                  가입한 클럽이 없어 선택할 수 없습니다
                </p>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          className={cn(
            "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer bg-card",
            selectedType === "public"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
          onClick={() => onSelect("public")}
        >
          <div className="flex items-start gap-3">
            <Globe className={cn(
              "mt-0.5 h-8 w-8 shrink-0",
              selectedType === "public" ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">공개일정</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                누구나 참가 신청할 수 있는 일정입니다.
                다른 클럽이나 개인 플레이어와 함께 칠 수 있습니다.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── Step 2: 코트 정보 ── */
function Step2CourtInfo({
  courtName,
  onCourtNameChange,
  courtAddress,
  onCourtAddressChange,
  regionDepth1,
  regionDepth2,
  onRegionDepth1Change,
  onRegionDepth2Change,
}: {
  courtName: string;
  onCourtNameChange: (v: string) => void;
  courtAddress: string;
  onCourtAddressChange: (v: string) => void;
  regionDepth1: string;
  regionDepth2: string;
  onRegionDepth1Change: (v: string) => void;
  onRegionDepth2Change: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground mb-1">
          어디에서 만나나요?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          코트 이름은 필수입니다. 주소와 지역은 나중에 수정할 수 있어요.
          <br />
          자주 쓰는 코트는 <span className="font-semibold text-foreground">즐겨찾기</span>로 저장해두면 다음에 바로 불러올 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">코트명 *</Label>
          <Input
            type="text"
            value={courtName}
            onChange={(e) => onCourtNameChange(e.target.value)}
            placeholder="예: 올림픽공원 테니스장 센터코트"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">코트 주소</Label>
          <Input
            type="text"
            value={courtAddress}
            onChange={(e) => onCourtAddressChange(e.target.value)}
            placeholder="예: 서울시 송파구 올림픽로 424"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">지역</Label>
          <RegionSelector
            depth1={regionDepth1}
            depth2={regionDepth2}
            onChangeDepth1={onRegionDepth1Change}
            onChangeDepth2={onRegionDepth2Change}
          />
        </div>
      </div>

    </div>
  );
}

/* ── Step 3: 일정 정보 ── */
function Step3ScheduleInfo({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  durationMinutes,
  onDurationChange,
  maxCapacity,
  onMaxCapacityChange,
  numberOfCourts,
  onNumberOfCourtsChange,
}: {
  selectedDate: string;
  onDateChange: (v: string) => void;
  selectedTime: string;
  onTimeChange: (v: string) => void;
  durationMinutes: number;
  onDurationChange: (v: number) => void;
  maxCapacity: number;
  onMaxCapacityChange: (v: number) => void;
  numberOfCourts?: number;
  onNumberOfCourtsChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground mb-1">
          일정 정보를 알려주세요
        </h2>
        <p className="text-xs text-muted-foreground">
          날짜, 시간, 참가 정원을 설정하세요
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* 날짜 / 시간 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">날짜 *</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">시간 *</Label>
            <select
              className={selectClassName}
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 기간 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">기간</Label>
          <select
            className={selectClassName}
            value={durationMinutes}
            onChange={(e) => onDurationChange(parseInt(e.target.value))}
          >
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
            <option value={90}>1시간 30분</option>
            <option value={120}>2시간</option>
            <option value={150}>2시간 30분</option>
            <option value={180}>3시간</option>
            <option value={240}>4시간</option>
            <option value={300}>5시간</option>
          </select>
        </div>

        {/* 정원 / 코트 수 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">최대 정원 *</Label>
            <Input
              type="number"
              value={maxCapacity}
              onChange={(e) => onMaxCapacityChange(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">코트 수</Label>
            <Input
              type="number"
              value={numberOfCourts || ""}
              onChange={(e) => onNumberOfCourtsChange(
                e.target.value ? parseInt(e.target.value) : undefined
              )}
              min="1"
              placeholder="자동"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: 추가 정보 ── */
function Step4AdditionalInfo({
  isClub,
  cost,
  onCostChange,
  matchType,
  onMatchTypeChange,
  description,
  onDescriptionChange,
}: {
  isClub: boolean;
  cost?: number;
  onCostChange: (v: number | undefined) => void;
  matchType?: MatchType;
  onMatchTypeChange: (v: MatchType) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground mb-1">
          추가 정보를 입력하세요
        </h2>
        <p className="text-xs text-muted-foreground">
          선택 항목입니다. 건너뛰어도 괜찮아요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">참가 비용</Label>
            <Input
              type="number"
              value={cost || ""}
              onChange={(e) => onCostChange(
                e.target.value ? parseInt(e.target.value) : undefined
              )}
              placeholder="25000"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">모임 타입</Label>
            <select
              className={selectClassName}
              value={(matchType as string) || "NONE"}
              onChange={(e) => {
                const value = e.target.value;
                onMatchTypeChange((value === "NONE" ? null : value) as MatchType);
              }}
            >
              <option value="NONE">선택안함</option>
              <option value="MEN_DOUBLES">남복</option>
              <option value="WOMEN_DOUBLES">여복</option>
              <option value="MIXED_DOUBLES">혼복</option>
              <option value="SINGLES">단식</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">설명</Label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="일정에 대한 추가 설명을 입력하세요"
            rows={3}
          />
        </div>
      </div>

      {isClub && (
        <TipBox>
          다음 화면에서 클럽 전용 설정도 할 수 있어요.{"\n"}
          <b>· 참가신청 시작시간</b> — 특정 시점부터 참가 가능하도록 제한{"\n"}
          <b>· 예약자</b> — 코트를 예약한 사람을 지정하면 예약왕 어워드 집계에 반영됩니다
        </TipBox>
      )}
    </div>
  );
}

/* ── 공통: 팁 박스 ── */
function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-primary/5 border border-primary/15 p-3">
      <Lightbulb size={16} className="shrink-0 mt-0.5 text-primary" />
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}
