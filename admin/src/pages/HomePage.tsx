import "./HomePage.css";

function HomePage() {
  return (
    <div className="home-page">
      <h2>Dashboard</h2>
      <p className="home-page__description">
        OpenRun 백오피스 관리 시스템입니다.
      </p>

      <div className="home-page__cards">
        <div className="dashboard-card">
          <h3>Audit Logs</h3>
          <p>Schedule, Club, ClubMember 변경 이력 조회</p>
        </div>
        <div className="dashboard-card">
          <h3>Coming Soon</h3>
          <p>추가 기능 예정</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
