const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- 상수 ---
const WIDTH = 1200;
const HEIGHT = 630;
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

// --- 캐시 ---
const imageCache = new Map();

function getCached(key) {
  const entry = imageCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    imageCache.delete(key);
    return null;
  }
  return entry.buffer;
}

function setCache(key, buffer) {
  // LRU: 가장 오래된 항목 제거
  if (imageCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = imageCache.keys().next().value;
    imageCache.delete(oldestKey);
  }
  imageCache.set(key, { buffer, timestamp: Date.now() });
}

// --- 배경 이미지 (서버 시작 시 1회 생성) ---
let backgroundBuffer = null;

async function initBackground() {
  const bgSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <!-- 장식: 테니스 코트 라인 느낌 -->
  <line x1="0" y1="315" x2="1200" y2="315" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <line x1="600" y1="0" x2="600" y2="630" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
  <circle cx="600" cy="315" r="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
  <!-- 장식: 테니스공 -->
  <circle cx="1050" cy="100" r="40" fill="rgba(255,255,255,0.07)" />
  <circle cx="150" cy="530" r="25" fill="rgba(255,255,255,0.05)" />
</svg>`;

  backgroundBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  console.log('[OG Image] Background initialized');
}

// --- 로고 SVG 로드 ---
function getLogoSvg() {
  // dist/logo/ 경로에서 로고 읽기 (Vite 빌드 시 public → dist 복사)
  const logoPath = path.join(__dirname, 'dist', 'logo', 'openrun-horizontal-emerald.svg');
  if (fs.existsSync(logoPath)) {
    return fs.readFileSync(logoPath, 'utf-8');
  }
  // 로컬 개발 시
  const devLogoPath = path.join(__dirname, 'public', 'logo', 'openrun-horizontal-emerald.svg');
  if (fs.existsSync(devLogoPath)) {
    return fs.readFileSync(devLogoPath, 'utf-8');
  }
  return null;
}

// --- HTML 엔티티 이스케이프 ---
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// --- 텍스트 말줄임 ---
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

// --- 텍스트 오버레이 SVG 생성 ---
function createTextOverlay(title, subtitle, description) {
  const safeTitle = escapeXml(truncate(title, 30));
  const safeSubtitle = escapeXml(truncate(subtitle, 40));
  const safeDescription = escapeXml(truncate(description, 50));

  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- 반투명 카드 영역 -->
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="rgba(255,255,255,0.95)" />

  <!-- 로고 텍스트 (SVG 로고 대신 텍스트로 표시) -->
  <text x="110" y="140" font-family="'Noto Sans CJK KR', 'Noto Sans KR', sans-serif" font-size="28" font-weight="700" fill="#059669">Open</text>
  <text x="200" y="140" font-family="'Noto Sans CJK KR', 'Noto Sans KR', sans-serif" font-size="28" font-weight="700" fill="#334155">Run</text>

  <!-- 구분선 -->
  <line x1="110" y1="170" x2="1090" y2="170" stroke="#e5e7eb" stroke-width="1.5" />

  <!-- 제목 (코트명/클럽명) -->
  <text x="110" y="280" font-family="'Noto Sans CJK KR', 'Noto Sans KR', sans-serif" font-size="52" font-weight="700" fill="#1f2937">${safeTitle}</text>

  <!-- 부제 (날짜/지역) -->
  <text x="110" y="350" font-family="'Noto Sans CJK KR', 'Noto Sans KR', sans-serif" font-size="34" font-weight="500" fill="#059669">${safeSubtitle}</text>

  <!-- 설명 (클럽|참가자) -->
  <text x="110" y="430" font-family="'Noto Sans CJK KR', 'Noto Sans KR', sans-serif" font-size="26" font-weight="400" fill="#6b7280">${safeDescription}</text>

  <!-- 우측 하단 OpenRun 앱 아이콘 -->
  <g transform="translate(990, 440) scale(0.9)" opacity="1">
    <rect width="80" height="80" rx="18" fill="#059669"/>
    <rect x="10" y="56" width="60" height="3" rx="1" fill="#fff" opacity="0.9"/>
    <ellipse cx="35" cy="57.5" rx="7" ry="2" fill="#fff" opacity="0.55"/>
    <path d="M64 16 C52 24, 42 38, 38 48 C36 52, 35.5 54, 35 56 C34.5 54, 33 50, 30 44 C26 35, 22 27, 17 20" fill="none" stroke="#fff" stroke-width="2.8" opacity="0.55" stroke-linecap="round"/>
    <circle cx="16" cy="17" r="8" fill="#fff"/>
  </g>
</svg>`;
}

// --- 일정용 OG 이미지 생성 ---
async function generateScheduleOgImage(schedule) {
  const cacheKey = `schedule_${schedule.id}_${schedule.currentParticipants}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 날짜 포맷
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dt = new Date(schedule.scheduledAt);
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const dayName = days[dt.getDay()];
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');

  const title = schedule.courtName || '일정';
  const subtitle = `${month}/${day}(${dayName}) ${hours}:${minutes}`;
  const clubLabel = schedule.clubName || '공개일정';
  const participants = `${schedule.currentParticipants || 0}/${schedule.maxCapacity || 0}명 참가`;
  const description = `${clubLabel} | ${participants}`;

  const overlaySvg = createTextOverlay(title, subtitle, description);

  const result = await sharp(backgroundBuffer)
    .composite([
      { input: Buffer.from(overlaySvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  setCache(cacheKey, result);
  return result;
}

// --- 클럽용 텍스트 오버레이 SVG (로고 좌측 + 텍스트 우측 레이아웃) ---
function createClubTextOverlay(club, showPlaceholder) {
  const FONT = "'Noto Sans CJK KR', 'Noto Sans KR', sans-serif";
  const safeName = escapeXml(truncate(club.name || '테니스 클럽', 18));
  const safeRegion = escapeXml(truncate(club.region || '', 20));
  const safeDesc = escapeXml(truncate(club.description || '', 35));
  const memberInfo = `${club.memberCount || 0}명 활동 중`;
  const safeActivity = escapeXml(club.activitySummary || '');
  const bottomText = safeActivity ? `${memberInfo}  ·  ${safeActivity}` : memberInfo;

  // 로고 placeholder (로고 fetch 실패 시 표시)
  const logoPlaceholder = showPlaceholder ? `
    <rect x="110" y="190" width="200" height="200" rx="20" fill="#e5e7eb" />
    <circle cx="210" cy="280" r="30" fill="#d1d5db" />
    <path d="M234 256 C226 261, 221 270, 219 277 C218 279, 217.5 280, 217 281 C216.5 280, 216 278, 214 275 C212 270, 209 264, 206 260"
      fill="none" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
  ` : '';

  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- 반투명 카드 영역 -->
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="rgba(255,255,255,0.95)" />

  <!-- OpenRun 로고 텍스트 -->
  <text x="110" y="132" font-family="${FONT}" font-size="28" font-weight="700" fill="#059669">Open</text>
  <text x="200" y="132" font-family="${FONT}" font-size="28" font-weight="700" fill="#334155">Run</text>

  <!-- 구분선 -->
  <line x1="110" y1="158" x2="1090" y2="158" stroke="#e5e7eb" stroke-width="1.5" />

  <!-- 로고 영역 placeholder -->
  ${logoPlaceholder}

  <!-- 클럽명 -->
  <text x="340" y="265" font-family="${FONT}" font-size="44" font-weight="700" fill="#1f2937">${safeName}</text>

  <!-- 지역 -->
  <text x="340" y="310" font-family="${FONT}" font-size="26" font-weight="500" fill="#059669">${safeRegion}</text>

  <!-- 설명 -->
  <text x="340" y="360" font-family="${FONT}" font-size="22" font-weight="400" fill="#6b7280">${safeDesc}</text>

  <!-- 하단 활동 정보 -->
  <line x1="110" y1="440" x2="1090" y2="440" stroke="#f3f4f6" stroke-width="1" />
  <text x="110" y="480" font-family="${FONT}" font-size="22" font-weight="400" fill="#6b7280">${escapeXml(bottomText)}</text>

  <!-- 우측 하단 OpenRun 앱 아이콘 -->
  <g transform="translate(990, 450) scale(0.85)" opacity="1">
    <rect width="80" height="80" rx="18" fill="#059669"/>
    <rect x="10" y="56" width="60" height="3" rx="1" fill="#fff" opacity="0.9"/>
    <ellipse cx="35" cy="57.5" rx="7" ry="2" fill="#fff" opacity="0.55"/>
    <path d="M64 16 C52 24, 42 38, 38 48 C36 52, 35.5 54, 35 56 C34.5 54, 33 50, 30 44 C26 35, 22 27, 17 20" fill="none" stroke="#fff" stroke-width="2.8" opacity="0.55" stroke-linecap="round"/>
    <circle cx="16" cy="17" r="8" fill="#fff"/>
  </g>
</svg>`;
}

// --- 클럽 로고 fetch + 라운드 크롭 ---
async function fetchClubLogo(logoUrl) {
  const resp = await fetch(logoUrl);
  if (!resp.ok) throw new Error(`Logo fetch ${resp.status}`);
  const arrBuf = await resp.arrayBuffer();
  const roundMask = Buffer.from(
    `<svg width="200" height="200"><rect width="200" height="200" rx="20" fill="#fff"/></svg>`
  );
  return sharp(Buffer.from(arrBuf))
    .resize(200, 200, { fit: 'cover' })
    .composite([{ input: roundMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// --- 클럽용 OG 이미지 템플릿 생성 (로고 + 텍스트 레이아웃) ---
async function generateClubOgTemplate(club) {
  const cacheKey = `club_tpl_${club.id}_${club.memberCount}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. 로고 fetch + round crop
  let logoBuffer = null;
  if (club.logoUrl) {
    try {
      logoBuffer = await fetchClubLogo(club.logoUrl);
    } catch (err) {
      console.error(`[OG Image] Logo fetch failed for club/${club.id}:`, err.message);
    }
  }

  // 2. SVG 텍스트 오버레이 생성
  const overlaySvg = createClubTextOverlay(club, !logoBuffer);

  // 3. composite 레이어: 배경 + SVG 오버레이 + 클럽 로고
  const layers = [{ input: Buffer.from(overlaySvg), top: 0, left: 0 }];
  if (logoBuffer) {
    layers.push({ input: logoBuffer, top: 190, left: 110 });
  }

  const result = await sharp(backgroundBuffer)
    .composite(layers)
    .png()
    .toBuffer();

  setCache(cacheKey, result);
  return result;
}

module.exports = { generateScheduleOgImage, generateClubOgTemplate, initBackground };
