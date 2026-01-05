import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInstance';
import type { Club, ClubMember } from '../../types/club';

const ClubDetailPage: React.FC = () => {
    const { clubId } = useParams<{ clubId: string }>();
    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [joinStatus, setJoinStatus] = useState<'NONE' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('NONE');
    const [loading, setLoading] = useState(true);

    const currentUserId = Number(localStorage.getItem('user_id'));

    useEffect(() => {
        if (clubId) {
            fetchClubDetail();
            fetchClubMembers();
        }
    }, [clubId]);

    const fetchClubDetail = async () => {
        try {
            const response = await axiosInstance.get(`/clubs/${clubId}`);
            setClub(response.data);
        } catch (error) {
            console.error('Failed to fetch club detail:', error);
        }
    };

    const fetchClubMembers = async () => {
        try {
            // 현재 멤버 조회 API가 UserResponse 리스트만 반환하므로, 
            // 내 상태를 알기 위해서는 별도 API가 필요하거나, 
            // getClubMembers가 ClubMember 정보를 포함해야 함.
            // 일단 UserResponse 리스트라고 가정하고, 내가 있는지 확인.
            // 하지만 status를 알 수 없음.
            // Backend Controller: getClubMembers returns List<UserResponse>.
            // We need to know my status.
            // Let's assume we add an API to check my membership status or 
            // update getClubMembers to return ClubMemberDto.

            // For now, let's just try to join and see if it fails, or 
            // we can infer from the list if I am active.

            const response = await axiosInstance.get(`/clubs/${clubId}/members`);
            const memberList: ClubMember[] = response.data as ClubMember[];
            setMembers(memberList);

            // Check if I am in the list (Active members)
            const me = memberList.find((m) => m.id === currentUserId);
            if (me) {
                setJoinStatus('ACTIVE');
            } else {
                // If not active, I might be pending.
                // We don't have an API to check pending status for myself easily yet without admin rights.
                // Let's just show "Join Request" if not active for now.
                setJoinStatus('NONE');
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        if (!confirm('가입 신청하시겠습니까?')) return;
        try {
            await axiosInstance.post(`/clubs/${clubId}/join`);
            alert('가입 신청이 완료되었습니다.');
            setJoinStatus('PENDING'); // Optimistic update
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            alert('가입 신청 실패: ' + (errorMessage || '오류 발생'));
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!club) return <div>Club not found</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>{club.name}</h1>
            <p>{club.description}</p>
            <p>지역: {club.region}</p>
            <p>멤버 수: {members.length}</p>

            <div style={{ marginTop: '20px' }}>
                {joinStatus === 'ACTIVE' && <button disabled>이미 멤버입니다</button>}
                {joinStatus === 'PENDING' && <button disabled>가입 대기중</button>}
                {joinStatus === 'NONE' && (
                    <button onClick={handleJoinRequest} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        가입 신청
                    </button>
                )}
            </div>

            {/* Admin Section (Only visible if owner) */}
            {club.ownerUserId === currentUserId && (
                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <h3>관리자 메뉴</h3>
                    <Link to={`/clubs/${clubId}/admin`} style={{ color: '#007bff', textDecoration: 'none' }}>
                        가입 신청 관리
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ClubDetailPage;
