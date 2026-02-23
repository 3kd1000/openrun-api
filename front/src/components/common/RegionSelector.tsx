import React from "react";
import { regionData, getDepth2ListByName } from "../../data/regions";

interface RegionSelectorProps {
  depth1: string;  // 시/도 이름 (예: "서울특별시")
  depth2: string;  // 시/군/구 이름 (예: "강남구")
  onChangeDepth1: (value: string) => void;
  onChangeDepth2: (value: string) => void;
  disabled?: boolean;
  showAllOption?: boolean;  // 검색 필터용 "전체" 옵션
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  depth1,
  depth2,
  onChangeDepth1,
  onChangeDepth2,
  disabled = false,
  showAllOption = false,
}) => {
  const depth2Options = depth1 ? getDepth2ListByName(depth1) : [];
  const hasDepth2 = depth2Options.length > 0;

  const handleDepth1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepth1 = e.target.value;
    onChangeDepth1(newDepth1);
    onChangeDepth2("");  // depth1 변경 시 depth2 초기화
  };

  // Custom chevron SVG as data URL
  const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

  const selectClassName = [
    "flex-1 min-w-0 h-9 pl-4 pr-9 text-base leading-9",
    "border border-border rounded-md bg-white outline-none cursor-pointer appearance-none",
    "focus:border-primary",
    "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60",
  ].join(" ");

  const selectStyle: React.CSSProperties = {
    backgroundImage: chevronBg,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };

  return (
    <div className="flex gap-2">
      <select
        className={selectClassName}
        style={selectStyle}
        value={depth1}
        onChange={handleDepth1Change}
        disabled={disabled}
      >
        {showAllOption ? (
          <option value="">전체</option>
        ) : (
          <option value="">시/도 선택</option>
        )}
        {regionData.depth1.map((r) => (
          <option key={r.code} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>

      {/* depth2가 있는 시/도인 경우에만 두 번째 select 표시 */}
      {(hasDepth2 || showAllOption) && (
        <select
          className={selectClassName}
          style={selectStyle}
          value={depth2}
          onChange={(e) => onChangeDepth2(e.target.value)}
          disabled={disabled || (!depth1 && !showAllOption)}
        >
          {showAllOption ? (
            <option value="">전체</option>
          ) : (
            <option value="">시/군/구 선택</option>
          )}
          {depth2Options.map((r) => (
            <option key={r.code} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default RegionSelector;
