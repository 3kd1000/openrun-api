// 한국 공휴일 정보를 가져오는 서비스
// date.nager.at API 사용 (무료, 한국 포함)

interface Holiday {
  date: string; // YYYY-MM-DD 형식
  localName: string; // 한국어 공휴일 이름
  name: string; // 영어 공휴일 이름
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

class HolidayService {
  private cache: Map<number, Holiday[]> = new Map(); // 년도별 캐시

  /**
   * 특정 년도의 한국 공휴일 목록 가져오기
   * @param year 년도 (예: 2025)
   * @returns 공휴일 목록
   */
  async getHolidays(year: number): Promise<Holiday[]> {
    // 캐시 확인
    if (this.cache.has(year)) {
      return this.cache.get(year)!;
    }

    try {
      // date.nager.at API는 한국 공휴일을 제대로 반환하지 않으므로
      // 직접 계산한 한국 공휴일 사용
      const holidays = this.getFixedHolidays(year);

      // 캐시에 저장
      this.cache.set(year, holidays);

      return holidays;
    } catch (error) {
      console.error("공휴일 정보 조회 실패:", error);
      // 에러 발생 시 빈 배열 반환
      return [];
    }
  }

  /**
   * 한국 공휴일 계산 (고정 공휴일 + 음력 기반 공휴일)
   * @param year 년도
   * @returns 공휴일 목록
   */
  private getFixedHolidays(year: number): Holiday[] {
    const fixedHolidays: Holiday[] = [
      {
        date: `${year}-01-01`,
        localName: "신정",
        name: "New Year's Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-03-01`,
        localName: "삼일절",
        name: "Independence Movement Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-05-05`,
        localName: "어린이날",
        name: "Children's Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-06-06`,
        localName: "현충일",
        name: "Memorial Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-08-15`,
        localName: "광복절",
        name: "Liberation Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-10-03`,
        localName: "개천절",
        name: "National Foundation Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-10-09`,
        localName: "한글날",
        name: "Hangul Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
      {
        date: `${year}-12-25`,
        localName: "크리스마스",
        name: "Christmas Day",
        countryCode: "KR",
        fixed: true,
        global: false,
        counties: null,
        launchYear: null,
        types: ["Public"],
      },
    ];

    // 음력 기반 공휴일 추가 (매년 업데이트 필요)
    const lunarHolidays = this.getLunarHolidays(year);
    fixedHolidays.push(...lunarHolidays);

    return fixedHolidays;
  }

  /**
   * 음력 기반 공휴일 (설날, 추석 등)
   * @param year 년도
   * @returns 음력 기반 공휴일 목록
   */
  private getLunarHolidays(year: number): Holiday[] {
    // 한국 공휴일 날짜 (2025-2040년, 한국천문연구원 기준)
    // 참고: 매년 정부에서 공식 발표하는 날짜로 업데이트 권장
    const lunarHolidaysByYear: {
      [key: number]: Array<{ date: string; name: string }>;
    } = {
      2024: [
        { date: "2024-02-09", name: "설날" },
        { date: "2024-02-10", name: "설날" },
        { date: "2024-02-11", name: "설날" },
        { date: "2024-02-12", name: "설날 대체공휴일" },
        { date: "2024-05-15", name: "부처님오신날" },
        { date: "2024-09-16", name: "추석" },
        { date: "2024-09-17", name: "추석" },
        { date: "2024-09-18", name: "추석" },
      ],
      2025: [
        { date: "2025-01-28", name: "설날" },
        { date: "2025-01-29", name: "설날" },
        { date: "2025-01-30", name: "설날" },
        { date: "2025-05-05", name: "부처님오신날" }, // 어린이날과 겹침
        { date: "2025-10-05", name: "추석" },
        { date: "2025-10-06", name: "추석" },
        { date: "2025-10-07", name: "추석" },
        { date: "2025-10-08", name: "추석 대체공휴일" },
      ],
      2026: [
        { date: "2026-02-16", name: "설날" },
        { date: "2026-02-17", name: "설날" },
        { date: "2026-02-18", name: "설날" },
        { date: "2026-05-24", name: "부처님오신날" },
        { date: "2026-09-24", name: "추석" },
        { date: "2026-09-25", name: "추석" },
        { date: "2026-09-26", name: "추석" },
        { date: "2026-09-27", name: "추석 대체공휴일" },
      ],
      2027: [
        { date: "2027-02-06", name: "설날" },
        { date: "2027-02-07", name: "설날" },
        { date: "2027-02-08", name: "설날" },
        { date: "2027-05-13", name: "부처님오신날" },
        { date: "2027-10-14", name: "추석" },
        { date: "2027-10-15", name: "추석" },
        { date: "2027-10-16", name: "추석" },
      ],
      2028: [
        { date: "2028-01-26", name: "설날" },
        { date: "2028-01-27", name: "설날" },
        { date: "2028-01-28", name: "설날" },
        { date: "2028-05-02", name: "부처님오신날" },
        { date: "2028-10-02", name: "추석" },
        { date: "2028-10-03", name: "추석" },
        { date: "2028-10-04", name: "추석" },
        { date: "2028-10-05", name: "추석 대체공휴일" },
      ],
      2029: [
        { date: "2029-02-12", name: "설날" },
        { date: "2029-02-13", name: "설날" },
        { date: "2029-02-14", name: "설날" },
        { date: "2029-05-20", name: "부처님오신날" },
        { date: "2029-09-21", name: "추석" },
        { date: "2029-09-22", name: "추석" },
        { date: "2029-09-23", name: "추석" },
        { date: "2029-09-24", name: "추석 대체공휴일" },
      ],
      2030: [
        { date: "2030-02-02", name: "설날" },
        { date: "2030-02-03", name: "설날" },
        { date: "2030-02-04", name: "설날" },
        { date: "2030-05-09", name: "부처님오신날" },
        { date: "2030-10-11", name: "추석" },
        { date: "2030-10-12", name: "추석" },
        { date: "2030-10-13", name: "추석" },
      ],
      2031: [
        { date: "2031-01-22", name: "설날" },
        { date: "2031-01-23", name: "설날" },
        { date: "2031-01-24", name: "설날" },
        { date: "2031-04-28", name: "부처님오신날" },
        { date: "2031-09-30", name: "추석" },
        { date: "2031-10-01", name: "추석" },
        { date: "2031-10-02", name: "추석" },
        { date: "2031-10-03", name: "추석 대체공휴일" },
      ],
      2032: [
        { date: "2032-02-10", name: "설날" },
        { date: "2032-02-11", name: "설날" },
        { date: "2032-02-12", name: "설날" },
        { date: "2032-05-16", name: "부처님오신날" },
        { date: "2032-09-18", name: "추석" },
        { date: "2032-09-19", name: "추석" },
        { date: "2032-09-20", name: "추석" },
        { date: "2032-09-21", name: "추석 대체공휴일" },
      ],
      2033: [
        { date: "2033-01-30", name: "설날" },
        { date: "2033-01-31", name: "설날" },
        { date: "2033-02-01", name: "설날" },
        { date: "2033-05-05", name: "부처님오신날" }, // 어린이날과 겹침
        { date: "2033-10-07", name: "추석" },
        { date: "2033-10-08", name: "추석" },
        { date: "2033-10-09", name: "추석" },
        { date: "2033-10-10", name: "추석 대체공휴일" },
      ],
      2034: [
        { date: "2034-02-18", name: "설날" },
        { date: "2034-02-19", name: "설날" },
        { date: "2034-02-20", name: "설날" },
        { date: "2034-05-25", name: "부처님오신날" },
        { date: "2034-09-26", name: "추석" },
        { date: "2034-09-27", name: "추석" },
        { date: "2034-09-28", name: "추석" },
        { date: "2034-09-29", name: "추석 대체공휴일" },
      ],
      2035: [
        { date: "2035-02-08", name: "설날" },
        { date: "2035-02-09", name: "설날" },
        { date: "2035-02-10", name: "설날" },
        { date: "2035-05-14", name: "부처님오신날" },
        { date: "2035-10-15", name: "추석" },
        { date: "2035-10-16", name: "추석" },
        { date: "2035-10-17", name: "추석" },
      ],
      2036: [
        { date: "2036-01-28", name: "설날" },
        { date: "2036-01-29", name: "설날" },
        { date: "2036-01-30", name: "설날" },
        { date: "2036-05-02", name: "부처님오신날" },
        { date: "2036-10-03", name: "추석" },
        { date: "2036-10-04", name: "추석" },
        { date: "2036-10-05", name: "추석" },
        { date: "2036-10-06", name: "추석 대체공휴일" },
      ],
      2037: [
        { date: "2037-02-15", name: "설날" },
        { date: "2037-02-16", name: "설날" },
        { date: "2037-02-17", name: "설날" },
        { date: "2037-05-22", name: "부처님오신날" },
        { date: "2037-09-22", name: "추석" },
        { date: "2037-09-23", name: "추석" },
        { date: "2037-09-24", name: "추석" },
        { date: "2037-09-25", name: "추석 대체공휴일" },
      ],
      2038: [
        { date: "2038-02-04", name: "설날" },
        { date: "2038-02-05", name: "설날" },
        { date: "2038-02-06", name: "설날" },
        { date: "2038-05-11", name: "부처님오신날" },
        { date: "2038-10-11", name: "추석" },
        { date: "2038-10-12", name: "추석" },
        { date: "2038-10-13", name: "추석" },
      ],
      2039: [
        { date: "2039-01-24", name: "설날" },
        { date: "2039-01-25", name: "설날" },
        { date: "2039-01-26", name: "설날" },
        { date: "2039-04-30", name: "부처님오신날" },
        { date: "2039-09-30", name: "추석" },
        { date: "2039-10-01", name: "추석" },
        { date: "2039-10-02", name: "추석" },
        { date: "2039-10-03", name: "추석 대체공휴일" },
      ],
      2040: [
        { date: "2040-02-12", name: "설날" },
        { date: "2040-02-13", name: "설날" },
        { date: "2040-02-14", name: "설날" },
        { date: "2040-05-18", name: "부처님오신날" },
        { date: "2040-09-19", name: "추석" },
        { date: "2040-09-20", name: "추석" },
        { date: "2040-09-21", name: "추석" },
        { date: "2040-09-22", name: "추석 대체공휴일" },
      ],
    };

    const holidays = lunarHolidaysByYear[year] || [];

    return holidays.map((holiday) => ({
      date: holiday.date,
      localName: holiday.name,
      name: holiday.name,
      countryCode: "KR",
      fixed: false,
      global: false,
      counties: null,
      launchYear: null,
      types: ["Public"],
    }));
  }

  /**
   * 날짜가 공휴일인지 확인
   * @param date 확인할 날짜
   * @returns 공휴일 여부
   */
  async isHoliday(date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const holidays = await this.getHolidays(year);

    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD 형식

    return holidays.some((holiday) => holiday.date === dateStr);
  }

  /**
   * 날짜 문자열이 공휴일인지 확인 (캐시된 데이터 사용)
   * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
   * @param holidays 공휴일 목록 (선택적, 없으면 API 호출)
   * @returns 공휴일 여부
   */
  isHolidayFromString(dateStr: string, holidays?: Holiday[]): boolean {
    if (!holidays) {
      // 캐시에서 찾기
      const year = parseInt(dateStr.split("-")[0]);
      const cachedHolidays = this.cache.get(year);
      if (!cachedHolidays) {
        return false;
      }
      return cachedHolidays.some((holiday) => holiday.date === dateStr);
    }

    return holidays.some((holiday) => holiday.date === dateStr);
  }
}

export const holidayService = new HolidayService();
export type { Holiday };
