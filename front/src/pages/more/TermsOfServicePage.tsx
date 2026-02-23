import React from "react";
import { Link } from "react-router-dom";

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] p-5">
      <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-10 max-md:px-4 max-md:py-6">
        <div className="text-center mb-10 pb-5 border-b-2 border-[#e9ecef]">
          <span className="block text-[32px] max-md:text-2xl font-bold text-[#212529] mb-2.5">서비스 이용약관</span>
          <p className="text-[#6c757d] text-sm m-0">최종 수정일: 2026년 2월 6일</p>
        </div>

        <div className="leading-[1.8] text-[#495057]">
          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">OpenRun 소개</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              OpenRun은 테니스를 즐기는 개발자가 취미 겸 재능기부 차원에서
              만든 <strong>서비스</strong>입니다. 테니스 클럽의
              일정 관리와 대진표 생성을 편하게 도와드리기 위해 개발되었습니다.
            </p>
            <p className="mb-4 text-[15px] max-md:text-sm">
              개인이 운영하는 서비스이며, 유료 결제 기능이 없습니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">제공 기능</h2>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">테니스 클럽 일정 관리</li>
              <li className="mb-2 text-sm text-[#6c757d]">대진표 자동 생성 (한울 방식)</li>
              <li className="mb-2 text-sm text-[#6c757d]">참가 신청 및 관리</li>
              <li className="mb-2 text-sm text-[#6c757d]">스코어보드 및 랭킹</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">회원 가입 및 로그인</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              Google, 카카오, 네이버 소셜 로그인을 통해 간편하게 가입할 수
              있습니다. 자동 로그인을 선택하시면 마지막 접속일로부터 30일간
              로그인 상태가 유지됩니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">개인정보</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              서비스 이용에 필요한 최소한의 정보(이름, 이메일, 프로필 사진)만
              수집하며, 소셜 로그인 제공업체를 통해 전달받습니다.
            </p>
            <p className="mb-4 text-[15px] max-md:text-sm">
              수집된 정보는 서비스 제공 목적으로만 사용되며, 제3자에게 제공하지
              않습니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">회원 탈퇴</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              회원은 언제든지 설정 메뉴에서 탈퇴를 요청할 수 있습니다. 탈퇴 시
              개인정보는 즉시 삭제되며, 클럽 활동 기록은 익명 처리됩니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">면책 사항</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              개인이 운영하는 서비스 특성상, 서버 장애나 예기치 못한
              오류가 발생할 수 있습니다. 서비스 이용 중 발생한 데이터 손실이나
              불편에 대해 법적 책임을 지지 않습니다.
            </p>
            <p className="mb-4 text-[15px] max-md:text-sm">
              최선을 다해 안정적인 서비스를 제공하겠지만, 상업적 서비스 수준의
              가용성을 보장하지는 않습니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">이용 규칙</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">다음 행위는 삼가 주세요:</p>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">타인의 계정 도용</li>
              <li className="mb-2 text-sm text-[#6c757d]">허위 정보 등록</li>
              <li className="mb-2 text-sm text-[#6c757d]">서비스 운영을 방해하는 행위</li>
              <li className="mb-2 text-sm text-[#6c757d]">다른 이용자에게 불쾌감을 주는 행위</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">약관 변경</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              약관이 변경될 경우 서비스 내 공지를 통해 안내드립니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">문의</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              서비스 이용 중 문의사항이 있으시면 카카오톡 오픈프로필을 통해
              연락 주세요.
              문의: <a href="https://open.kakao.com/o/s2uaa3ei" target="_blank" rel="noopener noreferrer">카카오톡 오픈프로필</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-5 border-t border-[#e9ecef] text-center">
          <Link
            to="/login"
            className="inline-block text-[#007bff] no-underline text-base font-medium transition-colors duration-200 hover:text-[#0056b3] hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
