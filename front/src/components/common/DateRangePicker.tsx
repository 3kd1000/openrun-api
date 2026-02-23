import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import type { RangeKeyDict, Range } from "react-date-range";
import { ko } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { cn } from "../../lib/utils";

// react-date-range third-party library overrides (cannot be expressed as Tailwind utilities)
const rdrOverrides = `
  .date-range-picker-rdr .rdrCalendarWrapper { font-size: 14px; }
  .date-range-picker-rdr .rdrMonthAndYearWrapper { padding-top: 8px; }
  .date-range-picker-rdr .rdrMonth { padding: 0 12px 12px 12px; }
  .date-range-picker-rdr .rdrWeekDay { font-weight: 500; color: var(--color-text-secondary); }
  .date-range-picker-rdr .rdrDayNumber span { color: var(--color-text); }
  .date-range-picker-rdr .rdrDayPassive .rdrDayNumber span { color: var(--color-text-tertiary); }
`;

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  placeholder?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = "기간 선택",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [range, setRange] = useState<Range[]>([
    {
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      key: "selection",
    },
  ]);

  useEffect(() => {
    setRange([
      {
        startDate: startDate || new Date(),
        endDate: endDate || new Date(),
        key: "selection",
      },
    ]);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    setRange([selection]);

    if (selection.startDate && selection.endDate) {
      onChange(selection.startDate, selection.endDate);
    }
  };

  const formatDateFull = (date: Date) => {
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  const formatDateShort = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}.${day}`;
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && endDate) {
      const sameYear = startDate.getFullYear() === endDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const isCurrentYear = sameYear && startDate.getFullYear() === currentYear;

      if (formatDateFull(startDate) === formatDateFull(endDate)) {
        return isCurrentYear ? formatDateShort(startDate) : formatDateFull(startDate);
      }

      if (isCurrentYear) {
        return `${formatDateShort(startDate)} ~ ${formatDateShort(endDate)}`;
      }
      return `${formatDateFull(startDate)} ~ ${formatDateFull(endDate)}`;
    }
    return placeholder;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    setRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
  };

  const hasValue = startDate || endDate;

  return (
    <>
      <style>{rdrOverrides}</style>
      <div className="relative inline-block" ref={containerRef}>
        {/* Trigger button */}
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 h-9 px-3 text-sm border border-border rounded-md bg-white text-muted-foreground cursor-pointer whitespace-nowrap min-w-0 w-full overflow-hidden",
            "hover:border-primary",
            hasValue && "border-primary text-foreground"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex-1 text-left overflow-hidden text-ellipsis">
            {getDisplayText()}
          </span>
          {hasValue && (
            <span
              className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-muted text-muted-foreground text-sm leading-none hover:bg-border hover:text-foreground"
              onClick={handleClear}
            >
              &times;
            </span>
          )}
        </button>

        {/* Dropdown calendar */}
        {isOpen && (
          <div
            className={cn(
              "date-range-picker-rdr fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white border border-border rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
              // Scale down on very small screens
              "max-[360px]:[transform:translate(-50%,-50%)_scale(0.9)]"
            )}
          >
            <DateRange
              ranges={range}
              onChange={handleSelect}
              locale={ko}
              months={1}
              direction="horizontal"
              showDateDisplay={false}
              rangeColors={["var(--color-primary)"]}
            />
            {/* Actions */}
            <div className="flex justify-end px-3 py-2 border-t border-border">
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium border-none rounded-sm bg-[#4caf50] text-white cursor-pointer hover:bg-[#43a047]"
                onClick={() => setIsOpen(false)}
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DateRangePicker;
