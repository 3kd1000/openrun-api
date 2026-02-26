// Firebase Cloud Messaging Service Worker
// 백그라운드 푸시 알림 수신 처리
/* eslint-disable no-undef */

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

// Firebase 설정 (런타임에 주입되지 않으므로 하드코딩 필요)
// 실제 값은 Firebase 콘솔에서 확인하여 교체해야 합니다
firebase.initializeApp({
  apiKey: "AIzaSyBs5-OMmuj7ONsUosbyfwowjO-1diBhXoU",
  authDomain: "openrun-ed7a1.firebaseapp.com",
  projectId: "openrun-ed7a1",
  storageBucket: "openrun-ed7a1.appspot.com",
  messagingSenderId: "4793689059",
  appId: "1:4793689059:web:282843d13c85bb7efb76d6",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
// notification 페이로드 없이 data만 수신하므로 직접 알림 표시
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw] 백그라운드 메시지 수신:", payload);

  const data = payload.data || {};
  const notificationTitle = data.title || "OpenRun";
  const notificationOptions = {
    body: data.body || "",
    icon: "/icon-192x192-v4.png",
    badge: "/icon-192x192-v4.png",
    data: data,
    tag: data.type || "default",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw] 알림 클릭:", event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/explore";

  // 알림 타입 + referenceType 기반으로 이동할 페이지 결정
  if ((data.type === "SCHEDULE" || data.type === "DRAW") && data.referenceId) {
    targetUrl = `/schedules/${data.referenceId}`;
  } else if (data.type === "EXTERNAL_REQUEST" && data.referenceId) {
    if (data.referenceType === "SCHEDULE") {
      targetUrl = `/schedules/${data.referenceId}`;
    } else {
      targetUrl = `/clubs/${data.referenceId}/manage/external-requests`;
    }
  } else if (data.type === "REQUEST_RESULT" && data.referenceId) {
    if (data.referenceType === "SCHEDULE") {
      targetUrl = `/schedules/${data.referenceId}`;
    } else {
      targetUrl = `/clubs/${data.referenceId}`;
    }
  } else if (data.type === "CLUB_INVITE" && data.referenceId) {
    targetUrl = `/clubs/${data.referenceId}`;
  } else if (data.type === "MESSAGE" && data.referenceId) {
    // referenceId = senderId (대화 상대)
    targetUrl = `/messages/${data.referenceId}`;
  }

  // FCM SW는 /firebase-cloud-messaging-push-scope 스코프이므로
  // PWA 메인 윈도우를 제어하지 않아 client.navigate()가 실패할 수 있음
  // → Cache API에 pending URL을 저장하여 앱이 열릴 때/복귀할 때 확인
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            try {
              await client.navigate(targetUrl);
              return client.focus();
            } catch (e) {
              // navigate 실패 (스코프 불일치) → Cache API + postMessage 이중 보장
              console.log("[firebase-messaging-sw] navigate 실패, Cache API + postMessage 사용:", e);
              const payload = JSON.stringify({ url: targetUrl, timestamp: Date.now() });
              await caches.open("notification-pending").then(cache =>
                cache.put("pending-url", new Response(payload))
              );
              client.postMessage({ type: "NOTIFICATION_CLICK", url: targetUrl });
              return client.focus();
            }
          }
        }
        // 열려있는 창이 없으면 Cache에 저장 후 새 창 열기
        if (clients.openWindow) {
          const payload = JSON.stringify({ url: targetUrl, timestamp: Date.now() });
          await caches.open("notification-pending").then(cache =>
            cache.put("pending-url", new Response(payload))
          );
          return clients.openWindow(targetUrl);
        }
      })
  );
});
