import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import type { Club } from '../../types/club';
import { Link } from 'react-router-dom';

const ClubListPage: React.FC = () => {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const response = await axiosInstance.get('/clubs');
            setClubs(response.data.content); // Page 객체 반환 가정
        } catch (error) {
            console.error('Failed to fetch clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>클럽 목록</h1>
            <Link to="/clubs/create" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                클럽 생성
            </Link>
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {clubs.map(club => (
                    <div key={club.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                        <h3>{club.name}</h3>
                        <p>{club.description}</p>
                        <p>지역: {club.region}</p>
                        <Link to={`/clubs/${club.id}`}>상세보기</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClubListPage;
