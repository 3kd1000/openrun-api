// 공용구 거래 유형
export type BallTransactionType = 'ADD' | 'DISTRIBUTE' | 'USE' | 'ADJUST';

// 공용구 보유자 정보
export interface BallKeeper {
  memberId: number;
  userId: number;
  userName: string;
  imageUrl: string | null;
  quantity: number;
}

// 공용구 현황 응답
export interface BallSummaryResponse {
  totalQuantity: number;
  ballKeeperCount: number;
  monthlyUsed: number;
  monthlyAdded: number;
  keepers: BallKeeper[];
}

// 공용구 거래 내역 응답
export interface BallTransactionResponse {
  id: number;
  type: BallTransactionType;
  quantity: number;
  fromMemberId: number | null;
  fromMemberName: string | null;
  toMemberId: number | null;
  toMemberName: string | null;
  scheduleId: number | null;
  scheduleAt: string | null;
  scheduleCourt: string | null;
  scheduleParticipants: number | null;
  scheduleMaxCapacity: number | null;
  description: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;
}

// 공용구 거래 내역 페이지 응답
export interface BallTransactionPageResponse {
  content: BallTransactionResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// 공용구 입고 요청
export interface AddBallRequest {
  toMemberId: number;
  quantity: number;
  description?: string;
}

// 공용구 배분 요청
export interface DistributeBallRequest {
  fromMemberId: number;
  toMemberId: number;
  quantity: number;
  description?: string;
}

// 공용구 사용 기록 요청
export interface UseBallRequest {
  fromMemberId: number;
  scheduleId: number;
  quantity: number;
  description?: string;
}

// 보유자 지정/해제 요청
export interface UpdateBallKeeperRequest {
  isBallKeeper: boolean;
}

// 공용구 수량 조정 요청 (단일)
export interface AdjustBallRequest {
  memberId: number;
  quantity: number;
  description?: string;
}

// 공용구 수량 조정 배치 요청
export interface BatchAdjustBallRequest {
  adjustments: AdjustBallRequest[];
}
