#!/usr/bin/env python3
import re

input_file = 'openrun_2025_2nd_half_score.csv'
output_file = 'openrun_2025_2nd_half_score_fixed.csv'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 따옴표로 감싸진 필드 내의 줄바꿈을 공백으로 치환
def replace_newlines_in_quotes(text):
    result = []
    in_quotes = False
    i = 0
    while i < len(text):
        char = text[i]
        if char == '"':
            in_quotes = not in_quotes
            result.append(char)
        elif char == '\n' and in_quotes:
            # 따옴표 안의 줄바꿈은 공백으로
            result.append(' ')
        else:
            result.append(char)
        i += 1
    return ''.join(result)

# 2. 따옴표 내 줄바꿈 제거
fixed_content = replace_newlines_in_quotes(content)

# 3. '게스트'를 '게스트1'로 치환 (게스트1, 게스트2, 게스트3는 그대로)
# 단어 경계를 고려하여 정확히 '게스트'만 치환
fixed_content = re.sub(r'(?<![0-9])게스트(?![0-9])', '게스트1', fixed_content)

# 4. 결과 저장
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(fixed_content)

# 5. 통계 출력
lines = [line for line in fixed_content.split('\n') if line.strip()]
guest_count = fixed_content.count('게스트1')

print(f"✅ 수정 완료: {output_file}")
print(f"   - 총 {len(lines)}개 행")
print(f"   - 따옴표 내 줄바꿈 제거")
print(f"   - '게스트1' {guest_count}회 발견")
