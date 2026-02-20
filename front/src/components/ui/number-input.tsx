
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
  /** 최솟값 (기본: 0) */
  min?: number;
  /** 최댓값 */
  max?: number;
  /** 빈 문자열일 때 표시할 기본값 (기본: min ?? 0) */
  emptyDefault?: number;
}

/**
 * 숫자 입력 컴포넌트 - string 기반으로 동작하여 "0이 안 지워지는" 문제 해결
 * - 입력 중에는 string으로 표시 (빈 문자열 허용)
 * - blur 시 number로 변환하여 부모에 전달
 * - 정원, 비용, 소요시간 등 숫자 입력이 필요한 곳에 공용으로 사용
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { value, onChange, min = 0, max, emptyDefault, className, onBlur, ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(String(value));

    // 부모 value가 변경되면 동기화
    React.useEffect(() => {
      setDisplayValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // 빈 문자열 허용
      if (raw === "") {
        setDisplayValue("");
        return;
      }

      // 숫자만 허용 (음수 부호는 min < 0일 때만)
      const pattern = min < 0 ? /^-?\d*$/ : /^\d*$/;
      if (!pattern.test(raw)) return;

      setDisplayValue(raw);

      // 유효한 숫자면 즉시 부모에 전달
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        const clamped = clamp(num, min, max);
        onChange(clamped);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // blur 시 빈 문자열이면 기본값 적용
      if (displayValue === "" || isNaN(parseInt(displayValue, 10))) {
        const fallback = emptyDefault ?? min;
        setDisplayValue(String(fallback));
        onChange(fallback);
      } else {
        const num = clamp(parseInt(displayValue, 10), min, max);
        setDisplayValue(String(num));
        onChange(num);
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn("tabular-nums", className)}
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

export { NumberInput };
