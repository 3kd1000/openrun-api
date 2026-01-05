import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInstance';
import type { ClubMember } from '../../types/club';

const ClubAdminPage: React.FC = () => {
    const { clubId } = useParams<{ clubId: string }>();
    const [pendingMembers, setPendingMembers] = useState<ClubMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clubId) {
            fetchPendingMembers();
        }
    }, [clubId]);

    const fetchPendingMembers = async () => {
        try {
            // Backend API: getClubMembers supports status query param
            // But currently getClubMembers returns List<UserResponse>, not ClubMember.
            // This is a problem. The frontend needs to know the ClubMember ID or User ID to approve/reject.
            // The current API `approveMember(clubId, userId)` uses userId.
            // `getClubMembers` returns `UserResponse` which has `id` (userId).
            // So we can use that.
            // However, we need to filter by status=PENDING.

            const response = await axiosInstance.get(`/clubs/${clubId}/members`, {
                params: { status: 'PENDING' }
            });
            setPendingMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch pending members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: number) => {
        if (!confirm('승인하시겠습니까?')) return;
        try {
            await axiosInstance.post(`/clubs/${clubId}/members/${userId}/approve`);
            alert('승인되었습니다.');
            fetchPendingMembers(); // Refresh list
        } catch (error) {
            console.error('Approve failed:', error);
            alert('승인 실패');
        }
    };

    const handleReject = async (userId: number) => {
        if (!confirm('거절하시겠습니까?')) return;
        try {
            await axiosInstance.post(`/clubs/${clubId}/members/${userId}/reject`);
            alert('거절되었습니다.');
            fetchPendingMembers(); // Refresh list
        } catch (error) {
            console.error('Reject failed:', error);
            alert('거절 실패');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>가입 신청 관리</h1>
            <Link to={`/clubs/${clubId}`}>&larr; 클럽으로 돌아가기</Link>

            <div style={{ marginTop: '20px' }}>
                {pendingMembers.length === 0 ? (
                    <p>대기 중인 가입 신청이 없습니다.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {pendingMembers.map((member) => (
                            <li key={member.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong>{member.user.name}</strong> ({member.user.email})
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleApprove(member.user.id)}
                                        style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                    >
                                        승인
                                    </button>
                                    <button
                                        onClick={() => handleReject(member.user.id)}
                                        style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                    >
                                        거절
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ClubAdminPage;
