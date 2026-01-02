import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    // main.tsx에서 업데이트가 필요할 때 이 함수를 호출
    window.triggerPWAUpdate = () => {
      setNeedRefresh(true);
    };

    return () => {
      // cleanup
      window.triggerPWAUpdate = undefined;
    };
  }, []);

  const updateServiceWorker = async () => {
    if (window.updatePWA) {
      await window.updatePWA();
      setNeedRefresh(false);
    }
  };

  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    updateServiceWorker,
    dismissUpdate,
  };
}
