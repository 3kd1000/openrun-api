import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import type { RangeKeyDict, Range } from "react-date-range";
import { ko } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./DateRangePicker.css";

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
    <div className="date-range-picker" ref={containerRef}>
      <button
        type="button"
        className={`date-range-picker__trigger ${hasValue ? "date-range-picker__trigger--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="date-range-picker__text">{getDisplayText()}</span>
        {hasValue && (
          <span className="date-range-picker__clear" onClick={handleClear}>
            &times;
          </span>
        )}
      </button>

      {isOpen && (
        <div className="date-range-picker__dropdown">
          <DateRange
            ranges={range}
            onChange={handleSelect}
            locale={ko}
            months={1}
            direction="horizontal"
            showDateDisplay={false}
            rangeColors={["var(--color-primary)"]}
          />
          <div className="date-range-picker__actions">
            <button
              type="button"
              className="date-range-picker__done"
              onClick={() => setIsOpen(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
