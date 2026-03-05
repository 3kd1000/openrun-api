import React from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/common/AppHeader";

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="개인정보처리방침" onBack={() => navigate(-1)} />
      <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-10 max-md:px-4 max-md:py-6">
        <div className="text-center mb-10 pb-5 border-b-2 border-[#e9ecef]">
          <span className="block text-[32px] max-md:text-2xl font-bold text-[#212529] mb-2.5">개인정보처리방침</span>
          <p className="text-[#6c757d] text-sm m-0">Privacy Policy</p>
          <p className="text-[#6c757d] text-sm m-0">최종 수정일: 2026년 3월 5일</p>
        </div>

        <div className="leading-[1.8] text-[#495057]">
          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">1. 개요</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              OpenRun(이하 "서비스")은 테니스 클럽 일정 관리 및 대진표 생성을 위한 웹 서비스입니다.
              본 개인정보처리방침은 서비스 이용 과정에서 수집되는 개인정보의 처리에 관한 사항을 안내합니다.
            </p>
            <p className="mb-4 text-[15px] max-md:text-sm">
              서비스 운영자: 정주상 (개인 개발자)<br />
              문의: <a href="https://open.kakao.com/o/s2uaa3ei" target="_blank" rel="noopener noreferrer" className="text-[#007bff] hover:underline">카카오톡 오픈프로필</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">2. 수집하는 개인정보</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              서비스는 회원가입 및 서비스 제공을 위해 아래 정보를 수집합니다.
            </p>
            <h3 className="text-base font-semibold text-[#212529] mb-2">소셜 로그인 (Google, 카카오)</h3>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">이름 (닉네임)</li>
              <li className="mb-2 text-sm text-[#6c757d]">이메일 주소</li>
              <li className="mb-2 text-sm text-[#6c757d]">프로필 사진 URL</li>
            </ul>
            <h3 className="text-base font-semibold text-[#212529] mb-2">Google Calendar 연동 (선택)</h3>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">Google 계정 이메일 주소</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google Calendar API 접근 토큰 (Access Token, Refresh Token)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">3. 개인정보의 이용 목적</h2>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">회원 식별 및 서비스 로그인</li>
              <li className="mb-2 text-sm text-[#6c757d]">클럽 일정 관리 및 참가자 표시</li>
              <li className="mb-2 text-sm text-[#6c757d]">푸시 알림 발송 (일정, 대진표 등)</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google Calendar 연동: 테니스 일정을 사용자의 Google Calendar에 자동 동기화</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">4. Google Calendar 데이터 사용</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              Google Calendar 연동은 사용자가 명시적으로 동의한 경우에만 활성화됩니다.
            </p>
            <h3 className="text-base font-semibold text-[#212529] mb-2">사용 범위</h3>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">"OpenRun"이라는 별도의 서브 캘린더를 생성하여 테니스 일정만 관리합니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">사용자의 기존 캘린더 데이터를 읽거나 수정하지 않습니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">참가 확정된 테니스 일정의 생성, 수정, 삭제만 수행합니다.</li>
            </ul>
            <h3 className="text-base font-semibold text-[#212529] mb-2">데이터 저장</h3>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">Google OAuth 토큰은 암호화하여 서버에 저장됩니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">토큰은 캘린더 이벤트 동기화 목적으로만 사용됩니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google Calendar의 기존 이벤트 데이터를 서버에 저장하지 않습니다.</li>
            </ul>
            <h3 className="text-base font-semibold text-[#212529] mb-2">연동 해제</h3>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">사용자는 언제든지 캘린더 설정에서 연동을 해제할 수 있습니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">연동 해제 시 서버에 저장된 토큰이 즉시 삭제됩니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google Calendar에 생성된 "OpenRun" 서브 캘린더도 함께 삭제됩니다.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">5. 개인정보의 제3자 제공</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              서비스는 수집된 개인정보를 제3자에게 제공하지 않습니다.
              다만, 서비스 운영에 필요한 아래 외부 서비스를 이용합니다.
            </p>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">Firebase Authentication: 소셜 로그인 인증 처리</li>
              <li className="mb-2 text-sm text-[#6c757d]">Firebase Cloud Messaging: 푸시 알림 발송</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google Calendar API: 캘린더 일정 동기화 (사용자 동의 시)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">6. 개인정보의 보유 및 파기</h2>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">회원 탈퇴 시 개인정보(이름, 이메일, 프로필 사진)는 즉시 삭제됩니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">클럽 활동 기록(일정 참가, 대진 결과)은 익명 처리되어 보존됩니다.</li>
              <li className="mb-2 text-sm text-[#6c757d]">캘린더 연동 정보(토큰)는 탈퇴 또는 연동 해제 시 즉시 삭제됩니다.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">7. 이용자의 권리</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              이용자는 언제든지 다음 권리를 행사할 수 있습니다.
            </p>
            <ul className="my-2 mb-4 pl-6">
              <li className="mb-2 text-sm text-[#6c757d]">개인정보 열람 요청</li>
              <li className="mb-2 text-sm text-[#6c757d]">개인정보 수정 (프로필 편집)</li>
              <li className="mb-2 text-sm text-[#6c757d]">캘린더 연동 해제 (설정에서 직접 가능)</li>
              <li className="mb-2 text-sm text-[#6c757d]">회원 탈퇴 및 개인정보 삭제 (설정에서 직접 가능)</li>
              <li className="mb-2 text-sm text-[#6c757d]">Google 계정 보안 설정에서 OpenRun 앱 접근 권한 직접 해제</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">8. 방침 변경</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              본 개인정보처리방침이 변경될 경우 서비스 내 공지를 통해 안내드립니다.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl max-md:text-lg font-semibold text-[#212529] mt-0 mb-4 pb-2 border-b border-[#dee2e6]">9. 문의</h2>
            <p className="mb-4 text-[15px] max-md:text-sm">
              개인정보 관련 문의사항은 아래로 연락해 주세요.<br />
              문의:{" "}
              <a href="https://open.kakao.com/o/s2uaa3ei" target="_blank" rel="noopener noreferrer" className="text-[#007bff] hover:underline">
                카카오톡 오픈프로필
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-5 border-t border-[#e9ecef] text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-block text-[#007bff] bg-transparent border-none cursor-pointer text-base font-medium transition-colors duration-200 hover:text-[#0056b3] hover:underline"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
