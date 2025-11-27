export interface Club {
    id: number;
    name: string;
    description: string;
    region: string;
    ownerUserId: number;
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
    description: string;
    region: string;
}
