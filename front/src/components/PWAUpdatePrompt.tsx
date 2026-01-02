import { useEffect, useState } from 'react';
import './PWAUpdatePrompt.css';

interface PWAUpdatePromptProps {
  onUpdate: () => void;
}

export function PWAUpdatePrompt({ onUpdate }: PWAUpdatePromptProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 애니메이션을 위해 약간의 딜레이
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    setShow(false);
    setTimeout(onUpdate, 300); // 애니메이션 후 업데이트
  };

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <div className={`pwa-update-prompt ${show ? 'show' : ''}`}>
      <div className="pwa-update-content">
        <div className="pwa-update-message">
          <p className="pwa-update-title">새 버전이 있습니다</p>
          <p className="pwa-update-description">
            업데이트하여 최신 기능을 사용하세요
          </p>
        </div>
        <div className="pwa-update-actions">
          <button
            className="btn-pwa-dismiss"
            onClick={handleDismiss}
            type="button"
          >
            나중에
          </button>
          <button
            className="btn-pwa-update"
            onClick={handleUpdate}
            type="button"
          >
            업데이트
          </button>
        </div>
      </div>
    </div>
  );
}
