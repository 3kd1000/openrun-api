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
  let targetUrl = "/";

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

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려있는 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // 열려있는 창이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
