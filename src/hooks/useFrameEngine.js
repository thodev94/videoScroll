import { useState, useRef, useCallback, useEffect } from 'react';
import {
    detectAspectRatio,
    detectScreenMetrics,
    compareAspectRatios,
    getDrawMetrics,
    calculateRamEstimate,
    getOptimalDimensions
} from '../utils/helpers';

/**
 * Hook quản lý toàn bộ engine trích xuất và render frame từ video
 *
 * Tính năng chính:
 * - Trích xuất chuỗi frame từ video → ImageBitmap trong RAM (hỗ trợ nút HỦY nạp source tức thì)
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
    initialFitMode = 'adaptive',
    initialRamProfile = 'balanced'
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [cachedBitmaps, setCachedBitmaps] = useState([]);
    const [videoDuration, setVideoDuration] = useState(0);

    // Chế độ hiển thị: 'adaptive' | 'cover' | 'contain'
    const [renderFitMode, setRenderFitMode] = useState(initialFitMode);

    // Chế độ tối ưu hóa RAM: 'eco' (tiết kiệm 50% RAM) | 'balanced' (chuẩn sắc nét) | 'high' (cao)
    const [ramProfile, setRamProfile] = useState(initialRamProfile);
    const [currentRamEstimate, setCurrentRamEstimate] = useState(() => calculateRamEstimate(1024, 576, 200));

    // Thông tin phát hiện tỷ lệ khung hình & phân giải
    const [videoMetrics, setVideoMetrics] = useState(() => detectAspectRatio(1280, 720));
    const [screenMetrics, setScreenMetrics] = useState(() => detectScreenMetrics());

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const lastProgressRef = useRef(0);
    const cancelExtractionRef = useRef(false);

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

        // Bật làm mịn phần cứng cấp cao (Bicubic Resampling): Giúp ảnh 960p/1152p hiển thị căng nét, không bể hình
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';

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

    // Hủy bỏ quá trình nạp / trích xuất frames từ video source
    const cancelExtraction = useCallback(() => {
        cancelExtractionRef.current = true;
        setIsProcessing(false);
        setProcessProgress(0);
    }, []);

    // Trích xuất chuỗi frame từ video thành chuỗi ImageBitmap trong RAM (Tối ưu RAM & Tăng tốc 3X)
    const extractFrames = useCallback(async (videoEl, count, profile = ramProfile) => {
        if (!videoEl || !videoEl.duration) return;
        cancelExtractionRef.current = false;
        setIsProcessing(true);
        setProcessProgress(0);

        // BƯỚC 1: GIẢI PHÓNG TOÀN BỘ BITMAP CŨ NGAY LẬP TỨC (CHỐNG NHÂN ĐÔI RAM KHI NẠP MỚI)
        setCachedBitmaps((prev) => {
            if (prev && prev.length > 0) {
                prev.forEach(bm => {
                    try {
                        if (bm && bm.close) bm.close();
                    } catch {}
                });
            }
            return [];
        });

        const newBitmaps = [];
        const duration = videoEl.duration;
        const step = duration / Math.max(1, count - 1);

        const vw = videoEl.videoWidth || 1280;
        const vh = videoEl.videoHeight || 720;

        // Cập nhật thông số tỷ lệ video được detect
        const detected = detectAspectRatio(vw, vh);
        setVideoMetrics(detected);

        // BƯỚC 2: TÍNH TOÁN KÍCH THƯỚC NẠP TỐI ƯU (VỪA SẮC NÉT KHÔNG BỂ, VỪA TIẾT KIỆM 50% RAM)
        const optimal = getOptimalDimensions(vw, vh, profile, screenMetrics);
        const targetW = optimal.width;
        const targetH = optimal.height;

        // Cập nhật chỉ số RAM ước tính thời gian thực
        const ramEstimate = calculateRamEstimate(targetW, targetH, count);
        setCurrentRamEstimate(ramEstimate);

        // Fallback canvas tái sử dụng (tránh tạo mới DOM element liên tục gây rò rỉ bộ nhớ)
        let fallbackCanvas = null;
        let fallbackCtx = null;

        for (let i = 0; i < count; i++) {
            // Kiểm tra tín hiệu HỦY bỏ từ người dùng
            if (cancelExtractionRef.current) {
                newBitmaps.forEach(bm => bm && bm.close && bm.close());
                setIsProcessing(false);
                setProcessProgress(0);
                return;
            }

            const seekTime = Math.min(i * step, duration - 0.01);

            await new Promise((resolve) => {
                const handleSeeked = async () => {
                    videoEl.removeEventListener('seeked', handleSeeked);

                    if (cancelExtractionRef.current) {
                        resolve();
                        return;
                    }

                    try {
                        // Kỹ thuật nạp chất lượng cao: resizeQuality 'high' (Bicubic / Lanczos) giữ trọn chi tiết sắc nét
                        const bmp = await createImageBitmap(videoEl, {
                            resizeWidth: targetW,
                            resizeHeight: targetH,
                            resizeQuality: 'high',
                            premultiplyAlpha: 'none',
                            colorSpaceConversion: 'none'
                        });
                        newBitmaps.push(bmp);
                    } catch {
                        if (!fallbackCanvas) {
                            fallbackCanvas = document.createElement('canvas');
                            fallbackCanvas.width = targetW;
                            fallbackCanvas.height = targetH;
                            fallbackCtx = fallbackCanvas.getContext('2d', { alpha: false });
                            fallbackCtx.imageSmoothingEnabled = true;
                            fallbackCtx.imageSmoothingQuality = 'high';
                        }
                        fallbackCtx.drawImage(videoEl, 0, 0, targetW, targetH);
                        try {
                            const fallbackBmp = await createImageBitmap(fallbackCanvas);
                            newBitmaps.push(fallbackBmp);
                        } catch {
                            const temp = document.createElement('canvas');
                            temp.width = targetW;
                            temp.height = targetH;
                            temp.getContext('2d', { alpha: false }).drawImage(fallbackCanvas, 0, 0);
                            newBitmaps.push(temp);
                        }
                    }

                    const pct = Math.round(((i + 1) / count) * 100);
                    setProcessProgress(pct);
                    resolve();
                };

                videoEl.addEventListener('seeked', handleSeeked, { once: true });
                videoEl.currentTime = seekTime;
            });

            // BƯỚC 3: YIELD GC MỖI 12 FRAMES ĐỂ TRÌNH DUYỆT THU GOM RÁC BỘ NHỚ VÀ HẠ NHIỆT CPU
            if (i > 0 && i % 12 === 0) {
                await new Promise((r) => setTimeout(r, 0));
            }
        }

        // Nếu bị hủy ở bước cuối cùng
        if (cancelExtractionRef.current) {
            newBitmaps.forEach(bm => bm && bm.close && bm.close());
            setIsProcessing(false);
            setProcessProgress(0);
            return;
        }

        // Quá trình trích xuất hoàn tất thành công: Lưu mảng tối ưu vào RAM
        setCachedBitmaps(newBitmaps);
        setIsProcessing(false);
    }, [ramProfile, screenMetrics]);

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

        // RAM Optimization & Safety States
        ramProfile,
        setRamProfile,
        currentRamEstimate,

        // Refs
        canvasRef,
        videoRef,

        // Methods
        renderFrameWithBlending,
        extractFrames,
        cancelExtraction,
    };
}
