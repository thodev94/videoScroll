import { useState, useRef, useCallback, useEffect } from 'react';
import {
    detectAspectRatio,
    detectScreenMetrics,
    compareAspectRatios,
    getDrawMetrics
} from '../utils/helpers';

/**
 * Hook quản lý toàn bộ engine trích xuất và render frame từ video
 *
 * Tính năng chính:
 * - Trích xuất chuỗi frame từ video → ImageBitmap trong RAM
 * - Double Buffering + Sub-frame Interpolation (Blending)
 * - Tự động DETECT RATIO video & phân giải màn hình / viewport (16:9, 9:16, 4:3, 21:9...)
 * - Đa dạng chế độ hiển thị: Adaptive (tự động thông minh), Cover (tràn viền), Contain (vừa vặn có ambient glow)
 * - Tự động đồng bộ DPR và Canvas Size khi xoay màn hình (orientation change) hoặc resize
 *
 * @param {Object} options
 * @param {number} options.exportWidth - Chiều rộng tối đa khi trích xuất frame
 * @param {boolean} options.enableFrameBlend - Bật/tắt sub-frame blending
 * @param {string} [options.initialFitMode='adaptive'] - 'adaptive' | 'cover' | 'contain'
 * @returns {Object}
 */
    export default function useFrameEngine({
        exportWidth = 1280,
        enableFrameBlend = true,
        initialFitMode = 'adaptive'
    }) {
        const [isProcessing, setIsProcessing] = useState(false);
        const [processProgress, setProcessProgress] = useState(0);
        const [cachedBitmaps, setCachedBitmaps] = useState([]);
        const [videoDuration, setVideoDuration] = useState(0);

        // Chế độ hiển thị: 'adaptive' | 'cover' | 'contain'
        const [renderFitMode, setRenderFitMode] = useState(initialFitMode);

        // Thông tin phát hiện tỷ lệ khung hình & phân giải
        const [videoMetrics, setVideoMetrics] = useState(() => detectAspectRatio(1280, 720));
        const [screenMetrics, setScreenMetrics] = useState(() => detectScreenMetrics());

        const canvasRef = useRef(null);
        const videoRef = useRef(null);
        const lastProgressRef = useRef(0);

        // Offscreen buffer canvas để chống xé hình (Double Buffering)
        const offscreenCanvasRef = useRef(null);
        const offscreenCtxRef = useRef(null);

        // Khởi tạo Offscreen Canvas
        useEffect(() => {
            const offscreen = document.createElement('canvas');
            offscreenCanvasRef.current = offscreen;
            offscreenCtxRef.current = offscreen.getContext('2d', { alpha: false });
        }, []);

        // So sánh tương thích tỷ lệ giữa Video và Màn hình hiện tại
        const aspectComparison = compareAspectRatios(videoMetrics, screenMetrics);

        /**
         * KỸ THUẬT SIÊU MƯỢT: DOUBLE BUFFERING + ADAPTIVE RATIO + SUB-FRAME BLENDING
         * Hòa trộn mượt 2 ảnh liền kề và tự động căn chỉnh tỷ lệ theo màn hình
         */
        const renderFrameWithBlending = useCallback((progress) => {
            lastProgressRef.current = progress;
            const canvas = canvasRef.current;
            const offscreen = offscreenCanvasRef.current;
            const offCtx = offscreenCtxRef.current;
            if (!canvas || !offscreen || !offCtx || cachedBitmaps.length === 0) return;

            const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
            if (!ctx) return;

            const cw = canvas.width;
            const ch = canvas.height;
            if (offscreen.width !== cw || offscreen.height !== ch) {
                offscreen.width = cw;
                offscreen.height = ch;
            }

            const total = cachedBitmaps.length;
            const exactIndex = progress * (total - 1);
            const baseIndex = Math.floor(exactIndex);
            const nextIndex = Math.min(baseIndex + 1, total - 1);
            const fraction = exactIndex - baseIndex;

            const img1 = cachedBitmaps[baseIndex];
            const img2 = cachedBitmaps[nextIndex];
            if (!img1) return;

            // Tính toán thông số vẽ theo chế độ (Cover, Contain, hoặc Adaptive)
            const { cx, cy, nw, nh, activeMode, isLetterboxed } = getDrawMetrics(
                renderFitMode,
                cw,
                ch,
                img1.width,
                img1.height
            );

            // Xóa buffer với màu nền đen rạp chiếu phim
            offCtx.fillStyle = '#05070c';
            offCtx.fillRect(0, 0, cw, ch);

            // Nếu ở chế độ letterbox (ví dụ video 9:16 dọc trên màn hình ngang desktop):
            // Vẽ thêm hiệu ứng Ambient Glow mờ phía sau để tạo chiều sâu tuyệt đẹp
            if (isLetterboxed && activeMode === 'contain') {
                offCtx.save();
                const bgMetrics = getDrawMetrics('cover', cw, ch, img1.width, img1.height);
                offCtx.globalAlpha = 0.22;
                try {
                    offCtx.filter = 'blur(24px) brightness(0.65)';
                } catch {
                    // fallback if filter not supported
                }
                offCtx.drawImage(img1, bgMetrics.cx, bgMetrics.cy, bgMetrics.nw, bgMetrics.nh);
                offCtx.restore();
            }

            // Vẽ frame cơ sở
            offCtx.globalAlpha = 1.0;
            offCtx.drawImage(img1, cx, cy, nw, nh);

            // Nếu bật Sub-frame Blending và có phần lẻ, hòa trộn frame kế tiếp lên trên
            if (enableFrameBlend && fraction > 0.02 && img2 && img1 !== img2) {
                offCtx.globalAlpha = fraction;
                offCtx.drawImage(img2, cx, cy, nw, nh);
                offCtx.globalAlpha = 1.0;
            }

            // Đẩy từ Buffer sang Canvas chính (1 lần duy nhất, chống flicker & xé hình)
            ctx.drawImage(offscreen, 0, 0);
    }, [cachedBitmaps, enableFrameBlend, renderFitMode]);

    // Trích xuất chuỗi frame từ video thành chuỗi ImageBitmap trong RAM
    const extractFrames = useCallback(async (videoEl, count) => {
        if (!videoEl || !videoEl.duration) return;
        setIsProcessing(true);
        setProcessProgress(0);

        // Giải phóng bộ nhớ RAM từ các Bitmap cũ
        cachedBitmaps.forEach(bm => bm && bm.close && bm.close());
        const newBitmaps = [];
        const duration = videoEl.duration;
        const step = duration / (count - 1);

        const vw = videoEl.videoWidth || 1280;
        const vh = videoEl.videoHeight || 720;

        // Cập nhật thông số tỷ lệ video được detect
        const detected = detectAspectRatio(vw, vh);
        setVideoMetrics(detected);

        // Tính toán kích thước tối ưu theo tỷ lệ thực tế, chống tràn RAM
        const maxDim = exportWidth;
        const scale = Math.min(1, maxDim / Math.max(vw, vh));
        const targetW = Math.round(vw * scale);
        const targetH = Math.round(vh * scale);

        for (let i = 0; i < count; i++) {
            const seekTime = Math.min(i * step, duration - 0.01);

            await new Promise((resolve) => {
                const handleSeeked = async () => {
                    videoEl.removeEventListener('seeked', handleSeeked);
                    try {
                        const bmp = await createImageBitmap(videoEl, {
                            resizeWidth: targetW,
                            resizeHeight: targetH,
                            resizeQuality: 'high'
                        });
                        newBitmaps.push(bmp);
                    } catch {
                        const temp = document.createElement('canvas');
                        temp.width = targetW;
                        temp.height = targetH;
                        const tCtx = temp.getContext('2d');
                        tCtx.drawImage(videoEl, 0, 0, temp.width, temp.height);
                        newBitmaps.push(temp);
                    }

                    const pct = Math.round(((i + 1) / count) * 100);
                    setProcessProgress(pct);
                    resolve();
                };

                videoEl.addEventListener('seeked', handleSeeked, { once: true });
                videoEl.currentTime = seekTime;
            });
        }

        setCachedBitmaps(newBitmaps);
        setIsProcessing(false);
    }, [cachedBitmaps, exportWidth]);

    // Resize canvas đồng bộ DPR và phân giải màn hình theo thời gian thực
    useEffect(() => {
        const handleResize = () => {
            const screen = detectScreenMetrics();
            setScreenMetrics(screen);

            if (!canvasRef.current) return;
            const dpr = screen.dpr;
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;

            // Render lại ngay frame hiện tại theo kích thước mới
            renderFrameWithBlending(lastProgressRef.current);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        handleResize();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    };
}, [renderFrameWithBlending]);

// Khi thay đổi renderFitMode, lập tức re-render frame
useEffect(() => {
    renderFrameWithBlending(lastProgressRef.current);
}, [renderFitMode, renderFrameWithBlending]);

return {
    // State
    isProcessing,
    processProgress,
    cachedBitmaps,
    videoDuration,
    setVideoDuration,

    // Ratio & Resolution Detection States
    videoMetrics,
    setVideoMetrics,
    screenMetrics,
    aspectComparison,
    renderFitMode,
    setRenderFitMode,

    // Refs
    canvasRef,
    videoRef,

    // Methods
    renderFrameWithBlending,
    extractFrames,
};
}
