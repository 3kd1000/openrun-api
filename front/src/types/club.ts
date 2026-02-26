// 어워드 타입
export type AwardType = 'ATTENDANCE' | 'POINTS' | 'BOOKING';
export type AwardPeriod = 'HALF_YEAR' | 'YEARLY';

// 어워드 랭킹 타입
export interface AwardRankingEntry {
    rank: number;
    userId: number;
    userName: string;
    value: number;  // 참석 횟수, 승점, 예약 횟수
}

export interface AwardRankingResponse {
    type: AwardType;
    period: AwardPeriod;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
    rankings: AwardRankingEntry[];
}

export interface Club {
    id: number;
    name: string;
    description: string;
    region: string;
    regionDepth1?: string | null;
    regionDepth2?: string | null;
    ownerUserId: number;
    // 기본 정책 필드 (Boolean 통일)
    autoJoinEnabled?: boolean | null;
    interclubRecruitmentOpen?: boolean | null;
    memberRecruitmentOpen?: boolean | null;
    memberRecruitmentNote?: string | null;
    activitySummary?: string | null;
    memberCount?: number;
    logoUrl?: string | null;
    logoThumbnailUrl?: string | null;
    // 어워드 정책 필드
    awardEnabled?: boolean | null;
    awardPeriod?: AwardPeriod | null;
    awardAttendanceEnabled?: boolean | null;
    awardPointsEnabled?: boolean | null;
    awardBookingEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClubMember {
    id: number;
    clubId: number;
    user: {
        id: number;
        name: string;
        email: string;
        imageUrl: string;
    };
    status: 'PENDING' | 'ACTIVE' | 'REJECTED';
    joinedAt: string;
}

export interface CreateClubRequest {
    name: string;
    description?: string;
    region?: string;
    regionDepth1?: string;
    regionDepth2?: string;
}

export interface UpdateClubRequest {
    name?: string;
    description?: string;
    region?: string;
    regionDepth1?: string;
    regionDepth2?: string;
}

export interface UpdateClubPolicyRequest {
    autoJoinEnabled: boolean;
    interclubRecruitmentOpen: boolean;
    memberRecruitmentOpen: boolean;
    memberRecruitmentNote?: string | null;
}

export interface UpdateAwardPolicyRequest {
    awardEnabled: boolean;
    awardPeriod: AwardPeriod;
    awardAttendanceEnabled: boolean;
    awardPointsEnabled: boolean;
    awardBookingEnabled: boolean;
}

export interface ClubRule {
    id: number;
    clubId: number;
    title: string;
    content: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClubRuleRequest {
    title: string;
    content: string;
}

export interface UpdateClubRuleRequest {
    title: string;
    content: string;
}

export interface ReorderClubRulesRequest {
    orders: Record<number, number>; // ruleId -> newOrder
}

export interface ClubNotice {
    id: number;
    clubId: number;
    title: string;
    content: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClubNoticeRequest {
    title: string;
    content: string;
}

export interface UpdateClubNoticeRequest {
    title: string;
    content: string;
}

export interface ClubMembership {
    memberId: number;
    role: 'OWNER' | 'ADMIN' | 'REGULAR';
    status: 'PENDING' | 'ACTIVE' | 'REJECTED';
    joinedAt: string;
    userId: number;
    name: string;
    email: string | null;
    imageUrl: string | null;
    tennisStartedAt: string | null;
    isBallKeeper?: boolean;
    ballQuantity?: number;
}
