const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateScheduleOgImage, generateClubOgImage, initBackground } = require('./og-image-generator.cjs');

const app = express();
const PORT = process.env.PORT || 80;
const API_URL = process.env.API_INTERNAL_URL || 'http://localhost:8080/api';
const SITE_URL = process.env.SITE_URL || 'https://front.openrun.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og_image_v4.png`;

// index.html 템플릿 로드 (서버 시작 시 1회)
const distPath = path.join(__dirname, 'dist');
const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

// --- 크롤러 감지 ---
const CRAWLER_AGENTS = [
  'kakao', 'facebookexternalhit', 'facebot', 'twitterbot',
  'linkedinbot', 'slackbot', 'discordbot', 'telegrambot',
  'line', 'whatsapp', 'googlebot', 'bingbot', 'yandexbot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some(bot => ua.includes(bot));
}

// --- 공유 대상 라우트 패턴 ---
const OG_ROUTES = [
  { pattern: /^\/clubs\/(\d+)\/recruiting$/, type: 'club', idIndex: 1 },
  { pattern: /^\/schedules\/(\d+)$/, type: 'schedule', idIndex: 1 },
  { pattern: /^\/schedules\/(\d+)\/recruit$/, type: 'schedule', idIndex: 1 },
  { pattern: /^\/clubs\/\d+\/guest-recruit\/(\d+)$/, type: 'schedule', idIndex: 1 },
  { pattern: /^\/clubs\/\d+\/interclub-recruit\/(\d+)$/, type: 'schedule', idIndex: 1 },
];

// --- API 데이터 fetch ---
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

// --- OG 데이터 생성 ---
function buildClubOgData(club, requestUrl, resourceId) {
  const description = club.description
    || `${club.region || ''}의 테니스 클럽. ${club.memberCount || 0}명 활동 중`;
  return {
    title: `${club.name} - 테니스 클럽 가입하기`,
    description: description.length > 100 ? description.substring(0, 100) + '...' : description,
    image: club.logoUrl || `${SITE_URL}/og-image/club/${resourceId}`,
    url: `${SITE_URL}${requestUrl}`,
  };
}

function buildScheduleOgData(schedule, requestUrl, resourceId) {
  // 날짜 포맷: MM/DD(요일) HH:mm
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dt = new Date(schedule.scheduledAt);
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const dayName = days[dt.getDay()];
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  const dateStr = `${month}/${day}(${dayName}) ${hours}:${minutes}`;

  const clubLabel = schedule.clubName || '공개일정';
  const participants = `${schedule.currentParticipants || 0}/${schedule.maxCapacity || 0}명 참가`;

  return {
    title: `${schedule.courtName} - ${dateStr}`,
    description: `${clubLabel} | ${participants}`,
    image: `${SITE_URL}/og-image/schedule/${resourceId}`,
    url: `${SITE_URL}${requestUrl}`,
  };
}

// --- OG 태그 치환 ---
function injectOgTags(html, og) {
  return html
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, `$1${og.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*("\s*\/?>)/, `$1${og.description}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*("\s*\/?>)/, `$1${og.image}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*("\s*\/?>)/, `$1${og.url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*("\s*\/?>)/, `$1${og.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*("\s*\/?>)/, `$1${og.description}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*("\s*\/?>)/, `$1${og.image}$2`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${og.description}$2`);
}

// --- 동적 OG 이미지 엔드포인트 (크롤러가 og:image URL로 직접 요청) ---
app.get('/og-image/schedule/:id', async (req, res) => {
  try {
    const data = await fetchJson(`${API_URL}/schedules/${req.params.id}`);
    const imageBuffer = await generateScheduleOgImage(data);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=600'); // 10분 CDN 캐시
    res.send(imageBuffer);
  } catch (err) {
    console.error(`[OG Image] Failed to generate schedule/${req.params.id}:`, err.message);
    // 실패 시 정적 이미지로 리다이렉트
    res.redirect(DEFAULT_OG_IMAGE);
  }
});

app.get('/og-image/club/:id', async (req, res) => {
  try {
    const data = await fetchJson(`${API_URL}/clubs/${req.params.id}`);
    const imageBuffer = await generateClubOgImage(data);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=600');
    res.send(imageBuffer);
  } catch (err) {
    console.error(`[OG Image] Failed to generate club/${req.params.id}:`, err.message);
    res.redirect(DEFAULT_OG_IMAGE);
  }
});

// --- 크롤러 요청 처리 (정적 파일보다 먼저) ---
app.get('*', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isCrawler(ua)) return next();

  // 공유 대상 라우트 매칭
  for (const route of OG_ROUTES) {
    const match = req.path.match(route.pattern);
    if (!match) continue;

    const resourceId = match[route.idIndex];
    try {
      const apiPath = route.type === 'club'
        ? `${API_URL}/clubs/${resourceId}`
        : `${API_URL}/schedules/${resourceId}`;

      const data = await fetchJson(apiPath);
      const ogData = route.type === 'club'
        ? buildClubOgData(data, req.path, resourceId)
        : buildScheduleOgData(data, req.path, resourceId);

      return res.send(injectOgTags(indexHtml, ogData));
    } catch (err) {
      console.error(`[OG] Failed to fetch ${route.type}/${resourceId}:`, err.message);
      // API 실패 시 기본 OG 태그로 폴백
      return res.send(indexHtml);
    }
  }

  next();
});

// --- 정적 파일 서빙 ---
app.use(express.static(distPath));

// --- SPA 폴백 (모든 미매칭 경로 → index.html) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- 서버 시작 ---
initBackground().then(() => {
  app.listen(PORT, () => {
    console.log(`[OG Server] Running on port ${PORT}`);
    console.log(`[OG Server] API: ${API_URL}`);
    console.log(`[OG Server] Site: ${SITE_URL}`);
    console.log(`[OG Server] Dynamic OG images enabled`);
  });
}).catch((err) => {
  console.error('[OG Server] Failed to initialize background:', err);
  // 배경 초기화 실패해도 서버는 시작 (정적 이미지로 폴백)
  app.listen(PORT, () => {
    console.log(`[OG Server] Running on port ${PORT} (without dynamic OG images)`);
  });
});
