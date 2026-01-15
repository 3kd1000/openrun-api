import React from "react";

export interface UserGuideStep {
    number: number;
    text: string;
    badgePosition: {
        top: string; // e.g. "20%"
        left: string; // e.g. "50%"
    };
}

interface UserGuideSlideProps {
    imageSrc: string;
    title?: string;
    description?: string;
    steps: UserGuideStep[];
    onBadgeClick?: (stepNumber: number) => void;
    onImageClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    isDevMode?: boolean;
}

const UserGuideSlide: React.FC<UserGuideSlideProps> = ({
    imageSrc,
    title,
    description,
    steps,
    onBadgeClick,
    onImageClick,
    onSwipeLeft,
    onSwipeRight,
    isDevMode = false,
}) => {
    return (
        <div className="ug-slide-container">

            {/* 📱 Left Column: Phone Mockup Area */}
            <div className="ug-phone-frame-container">

                {/* Desktop Frame (Only visible on lg/769px+) */}
                <div className="ug-phone-frame">
                    {/* Notch */}
                    <div className="ug-phone-notch"></div>
                    {/* Buttons */}
                    <div className="ug-phone-btn" style={{ height: '32px', left: '-17px', top: '72px' }}></div>
                    <div className="ug-phone-btn" style={{ height: '46px', left: '-17px', top: '124px' }}></div>
                    <div className="ug-phone-btn" style={{ height: '64px', right: '-17px', top: '142px' }}></div>

                    {/* Screen Container */}
                    <div className="ug-phone-screen">
                        <SlideContent
                            imageSrc={imageSrc}
                            steps={steps}
                            onBadgeClick={onBadgeClick}
                            onImageClick={onImageClick}
                            onSwipeLeft={onSwipeLeft}
                            onSwipeRight={onSwipeRight}
                            isDevMode={isDevMode}
                        />
                    </div>
                </div>

                {/* Mobile View (Visible on sm/md) - No Bezel, Maximum Width */}
                <div className="ug-mobile-view">
                    <div className="ug-mobile-aspect-ratio">
                        <SlideContent
                            imageSrc={imageSrc}
                            steps={steps}
                            onBadgeClick={onBadgeClick}
                            onImageClick={onImageClick}
                            onSwipeLeft={onSwipeLeft}
                            onSwipeRight={onSwipeRight}
                            isDevMode={isDevMode}
                        />
                    </div>
                </div>
            </div>

            {/* 📝 Right Column: Description Deck */}
            <div className="ug-description-deck">
                <div className="ug-title-box">
                    {title && (
                        <h2 className="ug-main-title">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="ug-desc-text">{description}</p>
                    )}
                </div>

                {/* Step List Cards */}
                <div className="ug-step-list">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            id={`step-desc-${step.number}`}
                            className="ug-step-item"
                        >
                            {/* Number Badge (List) */}
                            <div
                                className="ug-badge-list"
                            >
                                {step.number}
                            </div>

                            {/* Text */}
                            <div className="ug-step-text">
                                <p className="ug-step-desc">
                                    {step.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Reusable Inner Content (Image + Badges)
const SlideContent: React.FC<{
    imageSrc: string;
    steps: UserGuideStep[];
    onBadgeClick?: (id: number) => void;
    onImageClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    isDevMode?: boolean;
}> = ({ imageSrc, steps, onBadgeClick, onImageClick, onSwipeLeft, onSwipeRight, isDevMode }) => {
    const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);
    const [mouseStart, setMouseStart] = React.useState<{ x: number; y: number } | null>(null);

    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isDevMode) return; // Disable swipe in dev mode
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDevMode || !touchStart) return;
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        });
    };

    const handleTouchEnd = () => {
        if (isDevMode || !touchStart || !touchEnd) return;
        
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;
        const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

        // Only trigger if horizontal swipe is dominant
        if (!isVerticalSwipe) {
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            }
            if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        }
        
        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDevMode) return; // Disable swipe in dev mode
        setMouseStart({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handleMouseMove = () => {
        if (isDevMode || !mouseStart) return;
        // Mouse move tracking for potential drag
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isDevMode || !mouseStart) return;
        
        const distanceX = mouseStart.x - e.clientX;
        const distanceY = mouseStart.y - e.clientY;
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;
        const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

        // Only trigger if horizontal swipe is dominant
        if (!isVerticalSwipe) {
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            }
            if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        }
        
        setMouseStart(null);
    };

    return (
        <div
            className="ug-swipe-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <img
                src={imageSrc}
                alt="Guide Screen"
                className={`ug-image-full ${isDevMode ? 'ug-image-dev-cursor' : ''}`}
                onClick={onImageClick}
                draggable={false}
            />
            {steps.map((step) => (
                <div
                    key={step.number}
                    className="ug-badge-overlay"
                    style={{
                        top: step.badgePosition.top,
                        left: step.badgePosition.left,
                    }}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent image click
                        if (onBadgeClick) onBadgeClick(step.number);
                    }}
                >
                    {step.number}
                </div>
            ))}
        </div>
    );
};

export default UserGuideSlide;
