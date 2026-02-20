export type BallTransactionType = "ADD" | "DISTRIBUTE" | "USE" | "ADJUST";

export interface BallKeeper {
  memberId: number;
  userId: number;
  userName: string;
  imageUrl: string | null;
  quantity: number;
}

export interface BallSummaryResponse {
  totalQuantity: number;
  ballKeeperCount: number;
  monthlyUsed: number;
  monthlyAdded: number;
  keepers: BallKeeper[];
}

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

export interface BallTransactionPageResponse {
  content: BallTransactionResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AddBallRequest {
  toMemberId: number;
  quantity: number;
  description?: string;
}

export interface DistributeBallRequest {
  fromMemberId: number;
  toMemberId: number;
  quantity: number;
  description?: string;
}

export interface UseBallRequest {
  fromMemberId: number;
  scheduleId: number;
  quantity: number;
  description?: string;
}

export interface UpdateBallKeeperRequest {
  isBallKeeper: boolean;
}

export interface AdjustBallRequest {
  memberId: number;
  quantity: number;
  description?: string;
}

export interface BatchAdjustBallRequest {
  adjustments: AdjustBallRequest[];
}
