import React from "react";
import { regionData, getDepth2ListByName } from "../../data/regions";
import "./RegionSelector.css";

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

  return (
    <div className="region-selector">
      <select
        className="region-selector__select"
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
          className="region-selector__select"
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
