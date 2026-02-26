/**
 * API 응답이 배열이 아닐 경우 빈 배열로 변환하는 안전장치.
 * TanStack Query의 select 옵션에서 사용.
 *
 * Spring Boot의 Page<T> 응답이 content로 래핑되는 경우나,
 * 예상치 못한 null/undefined 응답을 안전하게 처리합니다.
 */
export function ensureArray<T>(data: T | T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data == null) return [];

  // Spring Page<T> 응답: { content: [...], totalElements: N, ... }
  if (typeof data === "object" && "content" in data && Array.isArray((data as Record<string, unknown>).content)) {
    return (data as Record<string, unknown>).content as T[];
  }

  return [];
}
