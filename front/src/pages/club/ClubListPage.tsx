import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInstance';
import type { Club } from '../../types/club';
import { isNotEmpty } from '../../utils/isEmpty';
import './ClubListPage.css';

const ClubListPage: React.FC = () => {
    const navigate = useNavigate();
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

    return (
        <div className="club-list-page">
            <div className="club-list-content">
                <div className="club-list-header">
                    <button className="back-btn" onClick={() => navigate("/more")}>
                        ← 뒤로
                    </button>
                    <h1>클럽 목록</h1>
                </div>

                {loading ? (
                    <div className="loading">로딩 중...</div>
                ) : clubs.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-icon">🏟️</p>
                        <p className="empty-message">가입한 클럽이 없습니다.</p>
                    </div>
                ) : (
                    <div className="clubs-list">
                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                className="club-item"
                                onClick={() => navigate(`/clubs/${club.id}`)}
                            >
                                <div className="club-icon">🏟️</div>
                                <div className="club-info">
                                    <div className="club-name">{club.name}</div>
                                    {isNotEmpty(club.description) && (
                                        <div className="club-description">{club.description}</div>
                                    )}
                                    {club.region && (
                                        <div className="club-region">지역: {club.region}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubListPage;
