export type RankingPeriod = "MONTHLY" | "QUARTERLY" | "HALF_YEAR" | "YEARLY" | "CUSTOM";

export interface RankingCustomSeason {
  name: string;
  startMonth: number; // 1~12
  endMonth: number; // 1~12
}

export interface RankingPeriodOption {
  label: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}

export const RANKING_PERIOD_LABELS: Record<RankingPeriod, string> = {
  MONTHLY: "월별",
  QUARTERLY: "분기별",
  HALF_YEAR: "반기",
  YEARLY: "연간",
  CUSTOM: "커스텀",
};

/**
 * 랭킹 주기별 기간 옵션 생성 (front/src/services/awardService.ts의
 * generateRankingPeriodOptions와 동일한 규칙 - 현재 진행 중인 기간을 첫 번째로 포함)
 */
export function generateRankingPeriodOptions(
  periodType: RankingPeriod,
  count: number = 10,
  customSeasons?: RankingCustomSeason[]
): RankingPeriodOption[] {
  const options: RankingPeriodOption[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1~12

  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = (year: number, month: number) => new Date(year, month, 0).getDate();

  if (periodType === "MONTHLY") {
    let year = currentYear;
    let month = currentMonth;
    for (let i = 0; i < count; i++) {
      options.push({
        label: `${year}년 ${month}월`,
        periodStart: `${year}-${pad(month)}-01`,
        periodEnd: `${year}-${pad(month)}-${pad(lastDay(year, month))}`,
      });
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
    }
  } else if (periodType === "QUARTERLY") {
    const currentQ = Math.ceil(currentMonth / 3);
    let year = currentYear;
    let q = currentQ;
    const qLabels = ["1분기", "2분기", "3분기", "4분기"];
    for (let i = 0; i < count; i++) {
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      options.push({
        label: `${year}년 ${qLabels[q - 1]}`,
        periodStart: `${year}-${pad(startMonth)}-01`,
        periodEnd: `${year}-${pad(endMonth)}-${pad(lastDay(year, endMonth))}`,
      });
      q--;
      if (q < 1) {
        q = 4;
        year--;
      }
    }
  } else if (periodType === "HALF_YEAR") {
    const isFirstHalf = currentMonth <= 6;
    let year = currentYear;
    let first = isFirstHalf;
    for (let i = 0; i < count; i++) {
      if (first) {
        options.push({
          label: `${year}년 상반기`,
          periodStart: `${year}-01-01`,
          periodEnd: `${year}-06-30`,
        });
        first = false;
        year--;
      } else {
        options.push({
          label: `${year}년 하반기`,
          periodStart: `${year}-07-01`,
          periodEnd: `${year}-12-31`,
        });
        first = true;
      }
    }
  } else if (periodType === "YEARLY") {
    for (let i = 0; i < count; i++) {
      const year = currentYear - i;
      options.push({
        label: `${year}년`,
        periodStart: `${year}-01-01`,
        periodEnd: `${year}-12-31`,
      });
    }
  } else if (periodType === "CUSTOM" && customSeasons && customSeasons.length > 0) {
    const findCurrentSeasonIndex = (): number => {
      for (let i = 0; i < customSeasons.length; i++) {
        const s = customSeasons[i];
        if (s.startMonth <= s.endMonth) {
          if (currentMonth >= s.startMonth && currentMonth <= s.endMonth) return i;
        } else {
          if (currentMonth >= s.startMonth || currentMonth <= s.endMonth) return i;
        }
      }
      return 0;
    };

    const currentIdx = findCurrentSeasonIndex();
    const currentSeason = customSeasons[currentIdx];
    let year = currentYear;
    // 현재 시즌이 연도 경계를 넘는 시즌이고, 아직 그 경계를 넘기 전(예: 12월)이라면
    // "이 시즌은 내년까지 이어진다" - year 기준을 한 해 앞으로 당겨서 이후 로직을 단일 규칙으로 통일
    if (currentSeason.startMonth > currentSeason.endMonth && currentMonth > currentSeason.endMonth) {
      year = currentYear + 1;
    }
    let idx = currentIdx;

    for (let i = 0; i < count; i++) {
      const season = customSeasons[idx];
      const isWrapAround = season.startMonth > season.endMonth;

      // 연도 경계를 넘는 시즌은 항상 "작년 시작 ~ 올해(year) 종료"로 통일
      const startYear = isWrapAround ? year - 1 : year;
      const endYear = year;

      options.push({
        label: `${startYear} ${season.name} (${season.startMonth}~${season.endMonth}월)`,
        periodStart: `${startYear}-${pad(season.startMonth)}-01`,
        periodEnd: `${endYear}-${pad(season.endMonth)}-${pad(lastDay(endYear, season.endMonth))}`,
      });

      idx--;
      if (idx < 0) {
        idx = customSeasons.length - 1;
        year--;
      }
    }
  }

  return options;
}
