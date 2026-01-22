export interface Club {
    id: number;
    name: string;
    description: string;
    region: string;
    ownerUserId: number;
    joinPolicy?: 'APPROVAL' | 'AUTO';
    interclubRecruitmentStatus?: 'CLOSED' | 'OPEN';
    memberRecruitmentStatus?: 'CLOSED' | 'OPEN';
    memberRecruitmentNote?: string | null;
    activitySummary?: string | null;
    memberCount?: number;
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
}

export interface UpdateClubRequest {
    name?: string;
    description?: string;
    region?: string;
}

export interface UpdateClubPolicyRequest {
    joinPolicy: 'APPROVAL' | 'AUTO';
    interclubRecruitmentStatus: 'CLOSED' | 'OPEN';
    memberRecruitmentStatus: 'CLOSED' | 'OPEN';
    memberRecruitmentNote?: string | null;
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
}
