import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BASE_HOST } from '../config/api';

interface ImageCarouselProps {
    images: string[];
    autoRotateMs?: number;
    className?: string;
    showDots?: boolean;
    showArrows?: boolean;
    aspectRatio?: string;
    objectFit?: 'cover' | 'contain';
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    autoRotateMs = 3000,
    className = '',
    showDots = true,
    showArrows = true,
    aspectRatio = '1/1',
    objectFit = 'cover',
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const getImageUrl = (src: string) => {
        if (!src) return '';
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
            return src;
        }
        return `${BASE_HOST}/${src}`;
    };

    const validImages = images.filter(Boolean);

    const goToNext = useCallback(() => {
        if (validImages.length <= 1) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
        setTimeout(() => setIsTransitioning(false), 400);
    }, [validImages.length]);

    const goToPrev = useCallback(() => {
        if (validImages.length <= 1) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
        setTimeout(() => setIsTransitioning(false), 400);
    }, [validImages.length]);

    const goToIndex = useCallback((index: number) => {
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 400);
    }, []);

    // Auto-rotate
    useEffect(() => {
        if (validImages.length <= 1 || isHovered) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(goToNext, autoRotateMs);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [validImages.length, isHovered, autoRotateMs, goToNext]);

    // Reset index if images change
    useEffect(() => {
        setCurrentIndex(0);
    }, [images.length]);

    if (validImages.length === 0) {
        return (
            <div
                className={`carousel-container ${className}`}
                style={{ aspectRatio, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>No Image</span>
            </div>
        );
    }

    if (validImages.length === 1) {
        return (
            <div className={`carousel-container ${className}`} style={{ position: 'relative', overflow: 'hidden', aspectRatio }}>
                <img
                    src={getImageUrl(validImages[0])}
                    alt="Product"
                    style={{ width: '100%', height: '100%', objectFit, display: 'block' }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={`carousel-container ${className}`}
            style={{ position: 'relative', overflow: 'hidden', aspectRatio }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Images */}
            <div
                style={{
                    display: 'flex',
                    width: `${validImages.length * 100}%`,
                    height: '100%',
                    transform: `translateX(-${(currentIndex * 100) / validImages.length}%)`,
                    transition: 'transform 0.4s ease-in-out',
                }}
            >
                {validImages.map((img, idx) => (
                    <div key={idx} style={{ width: `${100 / validImages.length}%`, height: '100%', flexShrink: 0 }}>
                        <img
                            src={getImageUrl(img)}
                            alt={`Image ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit, display: 'block' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = '0.3';
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Arrow Buttons */}
            {showArrows && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        style={{
                            position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '14px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s',
                            zIndex: 2,
                        }}
                        aria-label="Previous image"
                    >
                        ‹
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        style={{
                            position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '14px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s',
                            zIndex: 2,
                        }}
                        aria-label="Next image"
                    >
                        ›
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {showDots && (
                <div
                    style={{
                        position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '4px', zIndex: 2,
                    }}
                >
                    {validImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); goToIndex(idx); }}
                            style={{
                                width: idx === currentIndex ? '16px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                border: 'none',
                                background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.3s ease',
                            }}
                            aria-label={`Go to image ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Image Counter */}
            <div
                style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    borderRadius: '10px', padding: '2px 8px', fontSize: '11px',
                    zIndex: 2, opacity: isHovered ? 1 : 0.6, transition: 'opacity 0.2s',
                }}
            >
                {currentIndex + 1}/{validImages.length}
            </div>
        </div>
    );
};

export default ImageCarousel;
