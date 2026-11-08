import { useState, useRef, useCallback, useEffect } from 'react';
import { getCoverDrawMetrics } from '../utils/helpers';

/**
 * Hook quản lý toàn bộ engine trích xuất và render frame từ video
 *
 * Bao gồm:
 * - Trích xuất chuỗi frame từ video → ImageBitmap trong RAM
 * - Double Buffering + Sub-frame Interpolation (Blending)
 * - Offscreen canvas chống xé hình
 *
 * @param {Object} options
 * @param {number} options.exportWidth - Chiều rộng tối đa khi trích xuất frame
 * @param {boolean} options.enableFrameBlend - Bật/tắt sub-frame blending
 * @returns {Object}
 */
export default function useFrameEngine({ exportWidth, enableFrameBlend }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [cachedBitmaps, setCachedBitmaps] = useState([]);
    const [videoDuration, setVideoDuration] = useState(0);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);

    // Offscreen buffer canvas để chống xé hình (Double Buffering)
    const offscreenCanvasRef = useRef(null);
    const offscreenCtxRef = useRef(null);

    // Khởi tạo Offscreen Canvas
    useEffect(() => {
        const offscreen = document.createElement('canvas');
        offscreenCanvasRef.current = offscreen;
        offscreenCtxRef.current = offscreen.getContext('2d', { alpha: false });
    }, []);

    /**
     * KỸ THUẬT SIÊU MƯỢT 1: DOUBLE BUFFERING + SUB-FRAME INTERPOLATION (BLENDING)
     * Thay vì chỉ vẽ 1 ảnh làm giật khi cuộn chậm, kỹ thuật này hòa trộn mượt 2 ảnh liền kề
     */
    const renderFrameWithBlending = useCallback((progress) => {
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
        const fraction = exactIndex - baseIndex; // Phần thập phân từ 0 -> 1

        const img1 = cachedBitmaps[baseIndex];
        const img2 = cachedBitmaps[nextIndex];
        if (!img1) return;

        const { cx, cy, nw, nh } = getCoverDrawMetrics(cw, ch, img1.width, img1.height);

        // Vẽ frame cơ sở vào Offscreen buffer
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
    }, [cachedBitmaps, enableFrameBlend]);

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

        const aspect = (videoEl.videoHeight || 720) / (videoEl.videoWidth || 1280);
        const targetW = Math.min(window.innerWidth * 1.5, exportWidth);
        const targetH = Math.round(targetW * aspect);

        for (let i = 0; i < count; i++) {
            const seekTime = Math.min(i * step, duration - 0.01);

            await new Promise((resolve) => {
                const handleSeeked = async () => {
                    videoEl.removeEventListener('seeked', handleSeeked);
                    try {
                        const bmp = await createImageBitmap(videoEl, {
                            resizeWidth: Math.round(targetW),
                            resizeHeight: Math.round(targetH),
                            resizeQuality: 'high'
                        });
                        newBitmaps.push(bmp);
                    } catch {
                        const temp = document.createElement('canvas');
                        temp.width = Math.round(targetW);
                        temp.height = Math.round(targetH);
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

    // Resize canvas đồng bộ DPR
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        // State
        isProcessing,
        processProgress,
        cachedBitmaps,
        videoDuration,
        setVideoDuration,

        // Refs
        canvasRef,
        videoRef,

        // Methods
        renderFrameWithBlending,
        extractFrames,
    };
}

