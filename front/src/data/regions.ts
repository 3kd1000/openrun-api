/**
 * 대한민국 행정구역 데이터 (법정동 기준)
 * - depth1: 시/도 (17개)
 * - depth2: 시/군/구
 */

export interface Region {
  code: string;
  name: string;
}

export interface RegionData {
  depth1: Region[];
  depth2: Record<string, Region[]>; // key: depth1 code
}

export const regionData: RegionData = {
  depth1: [
    { code: "11", name: "서울특별시" },
    { code: "26", name: "부산광역시" },
    { code: "27", name: "대구광역시" },
    { code: "28", name: "인천광역시" },
    { code: "29", name: "광주광역시" },
    { code: "30", name: "대전광역시" },
    { code: "31", name: "울산광역시" },
    { code: "36", name: "세종특별자치시" },
    { code: "41", name: "경기도" },
    { code: "42", name: "강원특별자치도" },
    { code: "43", name: "충청북도" },
    { code: "44", name: "충청남도" },
    { code: "45", name: "전북특별자치도" },
    { code: "46", name: "전라남도" },
    { code: "47", name: "경상북도" },
    { code: "48", name: "경상남도" },
    { code: "50", name: "제주특별자치도" },
  ],
  depth2: {
    // 서울특별시 (25개 구)
    "11": [
      { code: "11010", name: "종로구" },
      { code: "11020", name: "중구" },
      { code: "11030", name: "용산구" },
      { code: "11040", name: "성동구" },
      { code: "11050", name: "광진구" },
      { code: "11060", name: "동대문구" },
      { code: "11070", name: "중랑구" },
      { code: "11080", name: "성북구" },
      { code: "11090", name: "강북구" },
      { code: "11100", name: "도봉구" },
      { code: "11110", name: "노원구" },
      { code: "11120", name: "은평구" },
      { code: "11130", name: "서대문구" },
      { code: "11140", name: "마포구" },
      { code: "11150", name: "양천구" },
      { code: "11160", name: "강서구" },
      { code: "11170", name: "구로구" },
      { code: "11180", name: "금천구" },
      { code: "11190", name: "영등포구" },
      { code: "11200", name: "동작구" },
      { code: "11210", name: "관악구" },
      { code: "11220", name: "서초구" },
      { code: "11230", name: "강남구" },
      { code: "11240", name: "송파구" },
      { code: "11250", name: "강동구" },
    ],
    // 부산광역시 (16개 구/군)
    "26": [
      { code: "26010", name: "중구" },
      { code: "26020", name: "서구" },
      { code: "26030", name: "동구" },
      { code: "26040", name: "영도구" },
      { code: "26050", name: "부산진구" },
      { code: "26060", name: "동래구" },
      { code: "26070", name: "남구" },
      { code: "26080", name: "북구" },
      { code: "26090", name: "해운대구" },
      { code: "26100", name: "사하구" },
      { code: "26110", name: "금정구" },
      { code: "26120", name: "강서구" },
      { code: "26130", name: "연제구" },
      { code: "26140", name: "수영구" },
      { code: "26150", name: "사상구" },
      { code: "26160", name: "기장군" },
    ],
    // 대구광역시 (8개 구/군)
    "27": [
      { code: "27010", name: "중구" },
      { code: "27020", name: "동구" },
      { code: "27030", name: "서구" },
      { code: "27040", name: "남구" },
      { code: "27050", name: "북구" },
      { code: "27060", name: "수성구" },
      { code: "27070", name: "달서구" },
      { code: "27080", name: "달성군" },
      { code: "27090", name: "군위군" },
    ],
    // 인천광역시 (10개 구/군)
    "28": [
      { code: "28010", name: "중구" },
      { code: "28020", name: "동구" },
      { code: "28030", name: "미추홀구" },
      { code: "28040", name: "연수구" },
      { code: "28050", name: "남동구" },
      { code: "28060", name: "부평구" },
      { code: "28070", name: "계양구" },
      { code: "28080", name: "서구" },
      { code: "28090", name: "강화군" },
      { code: "28100", name: "옹진군" },
    ],
    // 광주광역시 (5개 구)
    "29": [
      { code: "29010", name: "동구" },
      { code: "29020", name: "서구" },
      { code: "29030", name: "남구" },
      { code: "29040", name: "북구" },
      { code: "29050", name: "광산구" },
    ],
    // 대전광역시 (5개 구)
    "30": [
      { code: "30010", name: "동구" },
      { code: "30020", name: "중구" },
      { code: "30030", name: "서구" },
      { code: "30040", name: "유성구" },
      { code: "30050", name: "대덕구" },
    ],
    // 울산광역시 (5개 구/군)
    "31": [
      { code: "31010", name: "중구" },
      { code: "31020", name: "남구" },
      { code: "31030", name: "동구" },
      { code: "31040", name: "북구" },
      { code: "31050", name: "울주군" },
    ],
    // 세종특별자치시 (하위 행정구역 없음 - 읍/면/동 레벨)
    "36": [],
    // 경기도 (31개 시/군)
    "41": [
      { code: "41110", name: "수원시" },
      { code: "41130", name: "성남시" },
      { code: "41150", name: "의정부시" },
      { code: "41170", name: "안양시" },
      { code: "41190", name: "부천시" },
      { code: "41210", name: "광명시" },
      { code: "41220", name: "평택시" },
      { code: "41250", name: "동두천시" },
      { code: "41270", name: "안산시" },
      { code: "41280", name: "고양시" },
      { code: "41290", name: "과천시" },
      { code: "41310", name: "구리시" },
      { code: "41360", name: "남양주시" },
      { code: "41370", name: "오산시" },
      { code: "41390", name: "시흥시" },
      { code: "41410", name: "군포시" },
      { code: "41430", name: "의왕시" },
      { code: "41450", name: "하남시" },
      { code: "41460", name: "용인시" },
      { code: "41480", name: "파주시" },
      { code: "41500", name: "이천시" },
      { code: "41550", name: "안성시" },
      { code: "41570", name: "김포시" },
      { code: "41590", name: "화성시" },
      { code: "41610", name: "광주시" },
      { code: "41630", name: "양주시" },
      { code: "41650", name: "포천시" },
      { code: "41670", name: "여주시" },
      { code: "41800", name: "연천군" },
      { code: "41820", name: "가평군" },
      { code: "41830", name: "양평군" },
    ],
    // 강원특별자치도 (18개 시/군)
    "42": [
      { code: "42110", name: "춘천시" },
      { code: "42130", name: "원주시" },
      { code: "42150", name: "강릉시" },
      { code: "42170", name: "동해시" },
      { code: "42190", name: "태백시" },
      { code: "42210", name: "속초시" },
      { code: "42230", name: "삼척시" },
      { code: "42720", name: "홍천군" },
      { code: "42730", name: "횡성군" },
      { code: "42750", name: "영월군" },
      { code: "42760", name: "평창군" },
      { code: "42770", name: "정선군" },
      { code: "42780", name: "철원군" },
      { code: "42790", name: "화천군" },
      { code: "42800", name: "양구군" },
      { code: "42810", name: "인제군" },
      { code: "42820", name: "고성군" },
      { code: "42830", name: "양양군" },
    ],
    // 충청북도 (11개 시/군)
    "43": [
      { code: "43110", name: "청주시" },
      { code: "43130", name: "충주시" },
      { code: "43150", name: "제천시" },
      { code: "43720", name: "보은군" },
      { code: "43730", name: "옥천군" },
      { code: "43740", name: "영동군" },
      { code: "43750", name: "증평군" },
      { code: "43760", name: "진천군" },
      { code: "43770", name: "괴산군" },
      { code: "43800", name: "음성군" },
      { code: "43810", name: "단양군" },
    ],
    // 충청남도 (15개 시/군)
    "44": [
      { code: "44130", name: "천안시" },
      { code: "44150", name: "공주시" },
      { code: "44180", name: "보령시" },
      { code: "44200", name: "아산시" },
      { code: "44210", name: "서산시" },
      { code: "44230", name: "논산시" },
      { code: "44250", name: "계룡시" },
      { code: "44270", name: "당진시" },
      { code: "44710", name: "금산군" },
      { code: "44760", name: "부여군" },
      { code: "44770", name: "서천군" },
      { code: "44790", name: "청양군" },
      { code: "44800", name: "홍성군" },
      { code: "44810", name: "예산군" },
      { code: "44825", name: "태안군" },
    ],
    // 전북특별자치도 (14개 시/군)
    "45": [
      { code: "45110", name: "전주시" },
      { code: "45130", name: "군산시" },
      { code: "45140", name: "익산시" },
      { code: "45180", name: "정읍시" },
      { code: "45190", name: "남원시" },
      { code: "45210", name: "김제시" },
      { code: "45710", name: "완주군" },
      { code: "45720", name: "진안군" },
      { code: "45730", name: "무주군" },
      { code: "45740", name: "장수군" },
      { code: "45750", name: "임실군" },
      { code: "45770", name: "순창군" },
      { code: "45790", name: "고창군" },
      { code: "45800", name: "부안군" },
    ],
    // 전라남도 (22개 시/군)
    "46": [
      { code: "46110", name: "목포시" },
      { code: "46130", name: "여수시" },
      { code: "46150", name: "순천시" },
      { code: "46170", name: "나주시" },
      { code: "46230", name: "광양시" },
      { code: "46710", name: "담양군" },
      { code: "46720", name: "곡성군" },
      { code: "46730", name: "구례군" },
      { code: "46770", name: "고흥군" },
      { code: "46780", name: "보성군" },
      { code: "46790", name: "화순군" },
      { code: "46800", name: "장흥군" },
      { code: "46810", name: "강진군" },
      { code: "46820", name: "해남군" },
      { code: "46830", name: "영암군" },
      { code: "46840", name: "무안군" },
      { code: "46860", name: "함평군" },
      { code: "46870", name: "영광군" },
      { code: "46880", name: "장성군" },
      { code: "46890", name: "완도군" },
      { code: "46900", name: "진도군" },
      { code: "46910", name: "신안군" },
    ],
    // 경상북도 (23개 시/군)
    "47": [
      { code: "47110", name: "포항시" },
      { code: "47130", name: "경주시" },
      { code: "47150", name: "김천시" },
      { code: "47170", name: "안동시" },
      { code: "47190", name: "구미시" },
      { code: "47210", name: "영주시" },
      { code: "47230", name: "영천시" },
      { code: "47250", name: "상주시" },
      { code: "47280", name: "문경시" },
      { code: "47290", name: "경산시" },
      { code: "47730", name: "의성군" },
      { code: "47750", name: "청송군" },
      { code: "47760", name: "영양군" },
      { code: "47770", name: "영덕군" },
      { code: "47820", name: "청도군" },
      { code: "47830", name: "고령군" },
      { code: "47840", name: "성주군" },
      { code: "47850", name: "칠곡군" },
      { code: "47900", name: "예천군" },
      { code: "47920", name: "봉화군" },
      { code: "47930", name: "울진군" },
      { code: "47940", name: "울릉군" },
    ],
    // 경상남도 (18개 시/군)
    "48": [
      { code: "48120", name: "창원시" },
      { code: "48170", name: "진주시" },
      { code: "48220", name: "통영시" },
      { code: "48240", name: "사천시" },
      { code: "48250", name: "김해시" },
      { code: "48270", name: "밀양시" },
      { code: "48310", name: "거제시" },
      { code: "48330", name: "양산시" },
      { code: "48720", name: "의령군" },
      { code: "48730", name: "함안군" },
      { code: "48740", name: "창녕군" },
      { code: "48820", name: "고성군" },
      { code: "48840", name: "남해군" },
      { code: "48850", name: "하동군" },
      { code: "48860", name: "산청군" },
      { code: "48870", name: "함양군" },
      { code: "48880", name: "거창군" },
      { code: "48890", name: "합천군" },
    ],
    // 제주특별자치도 (2개 시)
    "50": [
      { code: "50110", name: "제주시" },
      { code: "50130", name: "서귀포시" },
    ],
  },
};

/**
 * 시/도 코드로 시/도 이름 찾기
 */
export const getDepth1Name = (code: string): string => {
  return regionData.depth1.find((r) => r.code === code)?.name ?? "";
};

/**
 * 시/도 이름으로 시/도 코드 찾기
 */
export const getDepth1Code = (name: string): string => {
  return regionData.depth1.find((r) => r.name === name)?.code ?? "";
};

/**
 * 시/군/구 목록 가져오기 (시/도 코드 기준)
 */
export const getDepth2List = (depth1Code: string): Region[] => {
  return regionData.depth2[depth1Code] ?? [];
};

/**
 * 시/군/구 목록 가져오기 (시/도 이름 기준)
 */
export const getDepth2ListByName = (depth1Name: string): Region[] => {
  const code = getDepth1Code(depth1Name);
  return code ? getDepth2List(code) : [];
};
