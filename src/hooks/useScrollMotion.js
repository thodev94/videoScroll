import { useState, useRef, useEffect } from 'react';

/**
 * Hook quản lý scroll tracking, vật lý quán tính LERP, và vận tốc cuộn
 *
 * KỸ THUẬT SIÊU MƯỢT 2: DELTA-TIME LERP + ADAPTIVE VELOCITY SMOOTHING
 * Đảm bảo tốc độ mượt mà ổn định ở mọi màn hình (60Hz, 120Hz ProMotion hay 144Hz)
 *
 * @param {Object} options
 * @param {Function} options.renderFrameWithBlending - Hàm render frame từ useFrameEngine
 * @param {boolean} options.enableMotionBlur - Bật/tắt motion blur cinematic
 * @returns {Object}
 */
export default function useScrollMotion({ renderFrameWithBlending, enableMotionBlur }) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [fps, setFps] = useState(60);
    const [motionVelocity, setMotionVelocity] = useState(0);

    const containerRef = useRef(null);
    const viewportRef = useRef(null);
    const reqAnimRef = useRef(null);

    // Motion Physics Tracking Refs
    const targetProgressRef = useRef(0);
    const smoothProgressRef = useRef(0);
    const velocityRef = useRef(0);
    const lastScrollYRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());
    const frameCounterRef = useRef(0);
    const lastFpsCalcTimeRef = useRef(performance.now());

    // Lắng nghe sự kiện cuộn với tính toán vận tốc mượt
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
            const current = -rect.top;

            const progress = Math.min(Math.max(current / (totalScrollable || 1), 0), 1);
            targetProgressRef.current = progress;

            const currentScrollY = window.scrollY;
            const deltaY = currentScrollY - lastScrollYRef.current;
            velocityRef.current = deltaY;
            lastScrollYRef.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Vòng lặp render chính: Delta-time LERP + Adaptive Velocity Smoothing
    useEffect(() => {
        let active = true;

        const loop = (timestamp) => {
            if (!active) return;

            const dt = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
            lastFrameTimeRef.current = timestamp;

            // Đo FPS thời gian thực
            frameCounterRef.current++;
            if (timestamp - lastFpsCalcTimeRef.current >= 1000) {
                setFps(frameCounterRef.current);
                frameCounterRef.current = 0;
                lastFpsCalcTimeRef.current = timestamp;
            }

            // Giảm dần vận tốc theo thời gian (Exponential Decay)
            velocityRef.current *= Math.exp(-9.0 * dt);
            if (Math.abs(velocityRef.current) < 0.05) velocityRef.current = 0;
            setMotionVelocity(Math.abs(Math.round(velocityRef.current * 10)));

            // Nội suy LERP thích ứng theo Delta-time (Lerp Factor ~ 0.15 ở 60fps)
            const diff = targetProgressRef.current - smoothProgressRef.current;
            const lerpSpeed = 12.0; // Tốc độ bắt kịp mượt mà
            const step = 1 - Math.exp(-lerpSpeed * dt);

            if (Math.abs(diff) > 0.00002) {
                smoothProgressRef.current += diff * step;
                setScrollProgress(smoothProgressRef.current);
                renderFrameWithBlending(smoothProgressRef.current);

                // Hiệu ứng Cinematic Motion: Camera Parallax Zoom & Subtle Motion Blur
                if (viewportRef.current) {
                    const vel = velocityRef.current;
                    const dynamicScale = 1 + Math.min(Math.abs(vel) * 0.0004, 0.035);
                    const dynamicTilt = Math.max(Math.min(vel * 0.015, 2.5), -2.5);
                    const blurVal = enableMotionBlur ? Math.min(Math.abs(vel) * 0.04, 1.8) : 0;

                    viewportRef.current.style.transform = `scale(${dynamicScale}) rotateX(${dynamicTilt}deg)`;
                    viewportRef.current.style.filter = blurVal > 0.3 ? `blur(${blurVal.toFixed(1)}px)` : 'none';
                }
            } else {
                if (viewportRef.current) {
                    viewportRef.current.style.transform = 'scale(1) rotateX(0deg)';
                    viewportRef.current.style.filter = 'none';
                }
            }

            reqAnimRef.current = requestAnimationFrame(loop);
        };

        reqAnimRef.current = requestAnimationFrame(loop);
        return () => {
            active = false;
            if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
        };
    }, [renderFrameWithBlending, enableMotionBlur]);

    return {
        scrollProgress,
        fps,
        motionVelocity,
        containerRef,
        viewportRef,
        smoothProgressRef,
    };
}

