#!/usr/bin/env python3
"""
OpenRun 회원 연락처 일괄 업데이트 스크립트

사용법:
    1. Firebase 토큰을 아래 FIREBASE_TOKEN 변수에 설정
    2. python update_phone_numbers.py 실행

토큰 얻는 방법:
    - Admin 페이지(admin.openrun.app)에서 개발자 도구 > Network 탭
    - 아무 API 호출 후 Authorization 헤더에서 Bearer 토큰 복사
"""

import requests
import time

# ============================================
# 설정
# ============================================

# Firebase 토큰 (여기에 붙여넣기)
FIREBASE_TOKEN = "YOUR_FIREBASE_TOKEN_HERE"

# API URL (환경에 맞게 수정)
API_URL = "https://api.openrun.app/api/admin/users/phone"
# API_URL = "https://dev-api.openrun.app/api/admin/users/phone"  # 개발 환경
# API_URL = "http://localhost:8080/api/admin/users/phone"  # 로컬

# ============================================
# 회원 명단 (이름, 연락처)
# ============================================

MEMBERS = [
    # 경기도 용인시
    ("장석원", "010-4036-8430"),
    ("정윤환", "010-9098-3107"),
    ("박영근", "010-8241-6225"),
    ("최승연", "010-3021-0333"),
    ("이상훈", "010-2793-3399"),
    ("김정오", "010-5521-7908"),
    ("송명우", "010-7926-5461"),
    ("장현석", "010-4958-0523"),
    ("안현우", "010-6663-4624"),
    ("나수한", "010-5835-7250"),
    ("마동혁", "010-3691-5044"),
    ("서영재", "010-7350-5721"),
    ("이대현", "010-5299-8308"),
    ("성치호", "010-4921-1593"),
    # 경기도 성남시
    ("김민표", "010-4302-4057"),
    ("김민석", "010-8749-6446"),
    ("이강일", "010-8514-8509"),
    ("정주상", "010-8377-0944"),
    # 경기도 화성시
    ("정민식", "010-3837-2972"),
    ("이동주", "010-6233-6186"),
    ("권종근", "010-4526-7697"),
    ("김범준", "010-6771-2214"),
    ("김형준", "010-3661-7425"),
    ("백규철", "010-4765-8214"),
    # 경기도 수원시
    ("김영준", "010-9490-1984"),
    ("송현우", "010-8075-3238"),
    ("채민식", "010-5087-3011"),
    ("박성익", "010-9920-8107"),
    ("김준영", "010-8660-2765"),
    # 대전광역시
    ("구현호", "010-2850-0913"),
]


def update_phone(name: str, phone: str) -> dict:
    """단일 사용자 연락처 업데이트"""
    headers = {
        "Authorization": f"Bearer {FIREBASE_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "userName": name,
        "phoneNumber": phone,
    }

    response = requests.put(API_URL, headers=headers, json=payload, timeout=10)
    return {
        "name": name,
        "status_code": response.status_code,
        "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
    }


def main():
    print("=" * 50)
    print("OpenRun 회원 연락처 일괄 업데이트")
    print("=" * 50)
    print(f"대상: {len(MEMBERS)}명")
    print(f"API: {API_URL}")
    print()

    if FIREBASE_TOKEN == "YOUR_FIREBASE_TOKEN_HERE":
        print("❌ 오류: FIREBASE_TOKEN을 설정해주세요.")
        print("   스크립트 상단의 FIREBASE_TOKEN 변수에 토큰을 입력하세요.")
        return

    success_count = 0
    fail_count = 0
    failed_members = []

    for i, (name, phone) in enumerate(MEMBERS, 1):
        print(f"[{i}/{len(MEMBERS)}] {name}...", end=" ")

        try:
            result = update_phone(name, phone)

            if result["status_code"] == 200:
                print("✅ 성공")
                success_count += 1
            else:
                print(f"❌ 실패 ({result['status_code']})")
                print(f"    → {result['response']}")
                fail_count += 1
                failed_members.append((name, phone, result))

        except Exception as e:
            print(f"❌ 오류: {e}")
            fail_count += 1
            failed_members.append((name, phone, str(e)))

        # API 부하 방지를 위한 딜레이
        time.sleep(0.1)

    print()
    print("=" * 50)
    print("결과 요약")
    print("=" * 50)
    print(f"성공: {success_count}명")
    print(f"실패: {fail_count}명")

    if failed_members:
        print()
        print("실패 목록:")
        for name, phone, error in failed_members:
            print(f"  - {name} ({phone}): {error}")


if __name__ == "__main__":
    main()
