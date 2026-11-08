import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Upload,
    Download,
    Code2,
    Layers,
    Zap,
    Check,
    Copy,
    FileArchive,
    Sparkles,
    Info,
    SlidersHorizontal,
    Gauge,
    Plus,
    Trash2,
    Edit3,
    AlignLeft,
    Eye,
    Type,
    Terminal
} from 'lucide-react';

// Nạp thư viện JSZip từ CDN để hỗ trợ nén và xuất file ZIP
const loadJSZip = () => {
    return new Promise((resolve, reject) => {
        if (window.JSZip) return resolve(window.JSZip);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

export default function App() {
    // Video & Frame Engine States
    const [videoSrc, setVideoSrc] = useState('https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4');
    const [videoName, setVideoName] = useState('paraglide-mountain.mp4');
    const [framesCount, setFramesCount] = useState(200);
    const [exportQuality, setExportQuality] = useState(0.85);
    const [exportWidth, setExportWidth] = useState(1280);

    // Motion Settings
    const [enableFrameBlend, setEnableFrameBlend] = useState(true); // Sub-frame blending
    const [enableMotionBlur, setEnableMotionBlur] = useState(true);

    // Thêm chế độ xuất Code: 'embedded' (Nhúng Base64 trực tiếp vào code) hoặc 'folder' (Dùng thư mục /public/frames/)
    const [codeExportMode, setCodeExportMode] = useState('embedded');
    const [embeddedFramesCode, setEmbeddedFramesCode] = useState('');
    const [isGeneratingBase64, setIsGeneratingBase64] = useState(false);
    const [base64Progress, setBase64Progress] = useState(0);

    // Package Manager cho câu lệnh cài đặt nhanh 1 chạm
    const [packageManager, setPackageManager] = useState('npm'); // 'npm' | 'pnpm' | 'yarn' | 'bun'

    // Story Overlay Content System (Chèn nội dung linh hoạt theo Scroll)
    const [storyNodes, setStoryNodes] = useState([
        {
            id: '1',
            startProgress: 0.0,
            endProgress: 0.28,
            position: 'top-left', // top-left | top-right | center | bottom-left | bottom-right
            tag: '01 / ĐIỂM XUẤT PHÁT',
            tagColor: 'cyan',
            title: 'Lướt mượt từng nhịp',
            description: 'Công nghệ Frame Blending kết hợp quán tính LERP biến từng mili-giây cuộn thành trải nghiệm phim điện ảnh.',
            ctaText: 'Khám phá thông số'
        },
        {
            id: '2',
            startProgress: 0.35,
            endProgress: 0.65,
            position: 'bottom-right',
            tag: '02 / DÒNG CHẢY TỰ DO',
            tagColor: 'emerald',
            title: 'Thăng hoa cùng tốc độ',
            description: 'Lực cản quán tính lũy thừa tự động làm chậm mượt mà khi bạn buông tay khỏi chuột hoặc màn hình cảm ứng.',
            ctaText: 'Xem demo'
        },
        {
            id: '3',
            startProgress: 0.72,
            endProgress: 1.0,
            position: 'bottom-left',
            tag: '03 / VỀ ĐÍCH AN TOÀN',
            tagColor: 'indigo',
            title: 'Hiệu năng hoàn hảo',
            description: 'Sẵn sàng tích hợp trực tiếp vào Next.js, Vite hoặc Landing page với bộ file frame và code tối ưu sẵn.',
            ctaText: 'Tải ngay dự án'
        }
    ]);

    // Processing States
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [cachedBitmaps, setCachedBitmaps] = useState([]);
    const [videoDuration, setVideoDuration] = useState(0);

    // Modals & UI States
    const [activeModal, setActiveModal] = useState(null); // 'export-code' | 'export-zip' | 'manage-content' | null
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [copiedTab, setCopiedTab] = useState(null);
    const [zipProgress, setZipProgress] = useState(0);
    const [isZipping, setIsZipping] = useState(false);

    // HUD Stats
    const [scrollProgress, setScrollProgress] = useState(0);
    const [fps, setFps] = useState(60);
    const [motionVelocity, setMotionVelocity] = useState(0);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const viewportRef = useRef(null);
    const reqAnimRef = useRef(null);

    // Offscreen buffer canvas để chống xé hình (Double Buffering)
    const offscreenCanvasRef = useRef(null);
    const offscreenCtxRef = useRef(null);

    // Motion Physics Tracking Refs
    const targetProgressRef = useRef(0);
    const smoothProgressRef = useRef(0);
    const velocityRef = useRef(0);
    const lastScrollYRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());
    const frameCounterRef = useRef(0);
    const lastFpsCalcTimeRef = useRef(performance.now());

    // Khởi tạo Offscreen Canvas
    useEffect(() => {
        const offscreen = document.createElement('canvas');
        offscreenCanvasRef.current = offscreen;
        offscreenCtxRef.current = offscreen.getContext('2d', { alpha: false });
    }, []);

    // Tính toán vùng vẽ Cover tỉ lệ chuẩn
    const getCoverDrawMetrics = (cw, ch, sw, sh) => {
        const ratio = Math.max(cw / sw, ch / sh);
        const nw = sw * ratio;
        const nh = sh * ratio;
        const cx = (cw - nw) * 0.5;
        const cy = (ch - nh) * 0.5;
        return { cx, cy, nw, nh };
    };

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

    // Load Metadata của Video
    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setVideoDuration(videoRef.current.duration);
        extractFrames(videoRef.current, framesCount);
    };

    // Resize canvas đồng bộ DPR
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;
            renderFrameWithBlending(smoothProgressRef.current);
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [renderFrameWithBlending]);

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

    /**
     * KỸ THUẬT SIÊU MƯỢT 2: DELTA-TIME LERP + ADAPTIVE VELOCITY SMOOTHING
     * Đảm bảo tốc độ mượt mà ổn định ở mọi màn hình (60Hz, 120Hz ProMotion hay 144Hz)
     */
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

    // Xử lý nạp file video từ máy
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoName(file.name);
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
    };

    // Đóng gói và tải trọn bộ frames dạng ZIP
    const downloadFramesAsZip = async () => {
        if (cachedBitmaps.length === 0) return;
        setIsZipping(true);
        setZipProgress(0);

        try {
            const JSZip = await loadJSZip();
            const zip = new JSZip();
            const folder = zip.folder('frames');

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            const total = cachedBitmaps.length;
            for (let i = 0; i < total; i++) {
                const item = cachedBitmaps[i];
                tempCanvas.width = item.width;
                tempCanvas.height = item.height;
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(item, 0, 0);

                const blob = await new Promise((resolve) => {
                    tempCanvas.toBlob(resolve, 'image/webp', exportQuality);
                });

                const fileName = `frame_${String(i).padStart(4, '0')}.webp`;
                folder.file(fileName, blob);

                setZipProgress(Math.round(((i + 1) / total) * 100));
            }

            folder.file('metadata.json', JSON.stringify({
                totalFrames: total,
                width: cachedBitmaps[0].width,
                height: cachedBitmaps[0].height,
                fpsTarget: 60,
                originalVideo: videoName,
                blendingSupported: true
            }, null, 2));

            const content = await zip.generateAsync({ type: 'blob' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = `${videoName.replace(/\.[^/.]+$/, '')}-smooth-frames.zip`;
            downloadLink.click();
        } catch (err) {
            console.error("Lỗi đóng gói ZIP:", err);
        } finally {
            setIsZipping(false);
        }
    };

    // Copy code vào clipboard
    const handleCopyCode = (text, tab) => {
        navigator.clipboard.writeText(text);
        setCopiedTab(tab);
        setTimeout(() => setCopiedTab(null), 2500);
    };

    // Tạo câu lệnh cài đặt thư viện theo package manager
    const getInstallCommand = () => {
        switch (packageManager) {
            case 'pnpm':
                return 'pnpm add lucide-react clsx tailwind-merge';
            case 'yarn':
                return 'yarn add lucide-react clsx tailwind-merge';
            case 'bun':
                return 'bun add lucide-react clsx tailwind-merge';
            case 'npm':
            default:
                return 'npm install lucide-react clsx tailwind-merge';
        }
    };

    // Tạo câu lệnh khởi tạo dự án Vite mới siêu tốc 1 dòng
    const getQuickInitCommand = () => {
        switch (packageManager) {
            case 'pnpm':
                return 'pnpm create vite my-scroll-app --template react && cd my-scroll-app && pnpm add -D tailwindcss postcss autoprefixer && pnpm add lucide-react && npx tailwindcss init -p';
            case 'yarn':
                return 'yarn create vite my-scroll-app --template react && cd my-scroll-app && yarn add -D tailwindcss postcss autoprefixer && yarn add lucide-react && npx tailwindcss init -p';
            case 'bun':
                return 'bun create vite my-scroll-app --template react && cd my-scroll-app && bun add -d tailwindcss postcss autoprefixer && bun add lucide-react && bunx tailwindcss init -p';
            case 'npm':
            default:
                return 'npx create-vite@latest my-scroll-app --template react && cd my-scroll-app && npm i && npm i -D tailwindcss postcss autoprefixer && npm i lucide-react && npx tailwindcss init -p';
        }
    };

    // Tạo chuỗi mã nguồn chứa mảng Base64 của toàn bộ Frame
    const generateEmbeddedCode = async () => {
        if (cachedBitmaps.length === 0) return;
        setIsGeneratingBase64(true);
        setBase64Progress(0);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const base64List = [];

        // Để nhúng trực tiếp vào file mã nguồn mà không làm file code quá nặng hàng chục MB,
        // tự động scale kích thước khung hình ở mức tối ưu nhẹ (~640px) và chất lượng 0.65
        const embedScale = Math.min(window.innerWidth, 720);
        const aspect = (cachedBitmaps[0].height || 720) / (cachedBitmaps[0].width || 1280);
        tempCanvas.width = embedScale;
        tempCanvas.height = Math.round(embedScale * aspect);

        const total = cachedBitmaps.length;
        for (let i = 0; i < total; i++) {
            const bm = cachedBitmaps[i];
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(bm, 0, 0, tempCanvas.width, tempCanvas.height);

            const b64 = tempCanvas.toDataURL('image/webp', 0.68);
            base64List.push(b64);

            if (i % 10 === 0 || i === total - 1) {
                setBase64Progress(Math.round(((i + 1) / total) * 100));
                // Cho trình duyệt nhả event loop một chút để không đơ UI
                await new Promise((r) => setTimeout(r, 0));
            }
        }

        const code = `import React, { useEffect, useRef, useState } from 'react';

// Dữ liệu nội dung Storyboard theo Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

// Mảng chứa toàn bộ dữ liệu khung hình dạng Base64 Data URL (Nhúng sẵn trong code)
const EMBEDDED_FRAMES = ${JSON.stringify(base64List, null, 2)};

const TOTAL_FRAMES = EMBEDDED_FRAMES.length;

export default function SingleFileScrollVideo() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  // 1. Khởi tạo và nạp Image objects từ mảng Base64 có sẵn
  useEffect(() => {
    const images = [];
    let loaded = 0;

    EMBEDDED_FRAMES.forEach((b64, idx) => {
      const img = new Image();
      img.src = b64;
      img.onload = () => {
        loaded++;
        setLoadedPercent(Math.round((loaded / TOTAL_FRAMES) * 100));
        if (loaded === 1 && canvasRef.current) {
          drawCover(img, 1.0);
        }
      };
      images.push(img);
    });
    imagesRef.current = images;
  }, []);

  // 2. Vẽ hình ảnh phủ kín Canvas (Object-fit: Cover)
  const drawCover = (img, alpha = 1.0) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const nw = img.naturalWidth * ratio;
    const nh = img.naturalHeight * ratio;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, cx, cy, nw, nh);
  };

  // 3. Vòng lặp render đồng bộ LERP + Sub-frame Blending
  useEffect(() => {
    let animId;
    let targetProgress = 0;
    let smoothProgress = 0;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgress = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      // Delta-time LERP siêu mượt
      const step = 1 - Math.exp(-12.0 * dt);
      smoothProgress += (targetProgress - smoothProgress) * step;
      setScrollProgress(smoothProgress);

      const exact = smoothProgress * (TOTAL_FRAMES - 1);
      const baseIdx = Math.floor(exact);
      const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
      const fraction = exact - baseIdx;

      const img1 = imagesRef.current[baseIdx];
      const img2 = imagesRef.current[nextIdx];

      if (img1 && img1.complete) {
        drawCover(img1, 1.0);
        if (fraction > 0.02 && img2 && img2.complete && img1 !== img2) {
          drawCover(img2, fraction);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh] bg-black text-white">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={1920} 
          height={1080} 
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Lớp phủ Nội dung Storyboard theo Scroll */}
        <div className="absolute inset-0 pointer-events-none p-6 sm:p-12">
          {STORY_NODES.map((node) => {
            const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
            return (
              <div
                key={node.id}
                className={\`absolute transition-all duration-700 \${
                  isVisible 
                    ? 'opacity-100 translate-y-0 filter-none pointer-events-auto' 
                    : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                }\`}
                style={{
                  top: node.position.includes('top') ? '5rem' : node.position.includes('bottom') ? 'auto' : '50%',
                  bottom: node.position.includes('bottom') ? '5rem' : 'auto',
                  left: node.position.includes('left') ? '3rem' : node.position.includes('right') ? 'auto' : '50%',
                  right: node.position.includes('right') ? '3rem' : 'auto',
                  transform: node.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                  textAlign: node.position.includes('right') ? 'right' : node.position === 'center' ? 'center' : 'left'
                }}
              >
                {node.tag && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 px-3 py-1 bg-cyan-950/70 border border-cyan-800 rounded-full">
                    {node.tag}
                  </span>
                )}
                <h2 className="text-3xl sm:text-5xl font-black drop-shadow-xl">{node.title}</h2>
                <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md backdrop-blur-sm bg-black/40 p-3 rounded-xl border border-white/10">
                  {node.description}
                </p>
                {node.ctaText && (
                  <button className="mt-4 px-5 py-2.5 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-cyan-400 transition">
                    {node.ctaText}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white font-mono text-xs">
            Nạp bộ nhớ đệm Base64: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
}`;

        setEmbeddedFramesCode(code);
        setIsGeneratingBase64(false);
    };

    // Tự động sinh mã nguồn khi mở modal Xuất Code nếu ở chế độ nhúng
    useEffect(() => {
        if (activeModal === 'export-code' && codeExportMode === 'embedded' && !embeddedFramesCode) {
            generateEmbeddedCode();
        }
    }, [activeModal, codeExportMode, embeddedFramesCode]);

    // Thêm mới một đoạn Content theo Scroll
    const handleAddStoryNode = () => {
        const newNode = {
            id: Date.now().toString(),
            startProgress: Math.min(Math.round(scrollProgress * 10) / 10, 0.7),
            endProgress: Math.min(Math.round(scrollProgress * 10) / 10 + 0.25, 1.0),
            position: 'center',
            tag: `0${storyNodes.length + 1} / NỘI DUNG MỚI`,
            tagColor: 'cyan',
            title: 'Tiêu đề mới',
            description: 'Mô tả nội dung xuất hiện khi người dùng cuộn đến vị trí này.',
            ctaText: ''
        };
        setStoryNodes([...storyNodes, newNode]);
        setEditingNodeId(newNode.id);
    };

    // Xóa Story Node
    const handleDeleteNode = (id) => {
        setStoryNodes(storyNodes.filter(n => n.id !== id));
    };

    // Cập nhật thuộc tính của Node
    const handleUpdateNode = (id, field, value) => {
        setStoryNodes(storyNodes.map(n => n.id === id ? { ...n, [field]: value } : n));
    };

    // Lấy class Tailwind theo vị trí
    const getPositionClasses = (position) => {
        switch (position) {
            case 'top-left': return 'top-20 left-6 sm:left-14 items-start text-left max-w-xl';
            case 'top-right': return 'top-20 right-6 sm:right-14 items-end text-right max-w-xl';
            case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center text-center max-w-2xl';
            case 'bottom-right': return 'bottom-24 right-6 sm:right-14 items-end text-right max-w-xl';
            case 'bottom-left':
            default: return 'bottom-24 left-6 sm:left-14 items-start text-left max-w-xl';
        }
    };

    // Code React Component chuẩn hóa cho dự án với hệ thống Story Overlay chèn theo scroll
    const reactComponentCode = `import React, { useEffect, useRef, useState } from 'react';

// Tổng số khung hình nén tải từ public/frames/
const TOTAL_FRAMES = ${cachedBitmaps.length || framesCount};

// Dữ liệu nội dung hiển thị theo tiến trình Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

export default function SmoothScrollVideo() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  // 1. Tải trước toàn bộ frames vào bộ nhớ Image
  useEffect(() => {
    const images = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      img.src = \`/frames/frame_\${num}.webp\`;
      img.onload = () => {
        loaded++;
        setLoadedPercent(Math.round((loaded / TOTAL_FRAMES) * 100));
        if (loaded === 1 && canvasRef.current) {
          drawCover(img, 1.0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  // 2. Vẽ hình ảnh phủ kín Canvas (Object-fit: Cover)
  const drawCover = (img, alpha = 1.0) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const nw = img.naturalWidth * ratio;
    const nh = img.naturalHeight * ratio;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, cx, cy, nw, nh);
  };

  // 3. Vòng lặp render đồng bộ LERP + Sub-frame Blending + Cập nhật Content
  useEffect(() => {
    let animId;
    let targetProgress = 0;
    let smoothProgress = 0;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgress = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      // Delta-time LERP siêu mượt độc lập tần số quét
      const step = 1 - Math.exp(-12.0 * dt);
      smoothProgress += (targetProgress - smoothProgress) * step;
      setScrollProgress(smoothProgress);

      const exact = smoothProgress * (TOTAL_FRAMES - 1);
      const baseIdx = Math.floor(exact);
      const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
      const fraction = exact - baseIdx;

      const img1 = imagesRef.current[baseIdx];
      const img2 = imagesRef.current[nextIdx];

      if (img1 && img1.complete) {
        drawCover(img1, 1.0);
        if (fraction > 0.02 && img2 && img2.complete && img1 !== img2) {
          drawCover(img2, fraction);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh] bg-black text-white">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={1920} 
          height={1080} 
          className="w-full h-full object-cover"
        />

        {/* Lớp phủ Nội dung Storyboard theo Scroll */}
        <div className="absolute inset-0 pointer-events-none p-8">
          {STORY_NODES.map((node) => {
            const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
            return (
              <div
                key={node.id}
                className={\`absolute transition-all duration-700 \${
                  isVisible 
                    ? 'opacity-100 translate-y-0 filter-none pointer-events-auto' 
                    : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                }\`}
                style={{
                  top: node.position.includes('top') ? '5rem' : node.position.includes('bottom') ? 'auto' : '50%',
                  bottom: node.position.includes('bottom') ? '5rem' : 'auto',
                  left: node.position.includes('left') ? '3rem' : node.position.includes('right') ? 'auto' : '50%',
                  right: node.position.includes('right') ? '3rem' : 'auto',
                  transform: node.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                  textAlign: node.position.includes('right') ? 'right' : node.position === 'center' ? 'center' : 'left'
                }}
              >
                {node.tag && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 px-3 py-1 bg-cyan-950/70 border border-cyan-800 rounded-full">
                    {node.tag}
                  </span>
                )}
                <h2 className="text-4xl md:text-5xl font-black drop-shadow-xl">{node.title}</h2>
                <p className="mt-2 text-sm md:text-base text-slate-300 max-w-md backdrop-blur-sm bg-black/40 p-3 rounded-xl border border-white/10">
                  {node.description}
                </p>
                {node.ctaText && (
                  <button className="mt-4 px-5 py-2.5 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-cyan-400 transition">
                    {node.ctaText}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white font-mono text-sm">
            Tải khung hình: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
}`;

    return (
        <div className="min-h-screen bg-[#05070c] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">

            {/* Video ẩn dùng làm nền decoder */}
            <video
                ref={videoRef}
                src={videoSrc}
                className="hidden"
                playsInline
                muted
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Floating Header Toolbar */}
            <header className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
                <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 sm:px-6 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Zap className="w-5 h-5 text-slate-950 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                                    Ultra-Smooth Scrub Pro
                                </h1>
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-2 py-0.5 rounded-full">
                                    120Hz Ready
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">{videoName}</p>
                        </div>
                    </div>

                    {/* Quick Smooth Toggles & Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

                        {/* Toggle Sub-frame Blending */}
                        <button
                            onClick={() => setEnableFrameBlend(!enableFrameBlend)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${enableFrameBlend
                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                            title="Hòa trộn mờ giữa 2 frame giúp loại bỏ hoàn toàn độ giật khi cuộn chậm"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Frame Blending</span>
                        </button>

                        {/* Frame Density Selector */}
                        <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-slate-400">Frames:</span>
                            <select
                                value={framesCount}
                                onChange={(e) => {
                                    const count = Number(e.target.value);
                                    setFramesCount(count);
                                    if (videoRef.current) extractFrames(videoRef.current, count);
                                }}
                                disabled={isProcessing}
                                className="bg-slate-900 text-cyan-300 font-bold rounded-lg px-2 py-0.5 outline-none cursor-pointer border border-slate-700 focus:border-cyan-500"
                            >
                                <option value={120}>120 frames</option>
                                <option value={200}>200 frames (Rất mượt)</option>
                                <option value={280}>280 frames (Cinematic)</option>
                                <option value={360}>360 frames (Ultra 120fps)</option>
                            </select>
                        </div>

                        {/* Upload Video Button */}
                        <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 active:scale-95">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">Thay Video</span>
                            <span className="sm:hidden">Đổi clip</span>
                            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFileUpload} className="hidden" />
                        </label>

                        {/* Content Manager Button */}
                        <button
                            onClick={() => setActiveModal('manage-content')}
                            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 transition flex items-center gap-1.5 border border-indigo-400/50 text-white active:scale-95 shadow-md shadow-indigo-600/20"
                        >
                            <Type className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Chèn Content ({storyNodes.length})</span>
                        </button>

                        {/* Code Export Button */}
                        <button
                            onClick={() => setActiveModal('export-code')}
                            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 text-slate-200 active:scale-95"
                        >
                            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Lấy Code</span>
                        </button>

                        {/* ZIP Export Button */}
                        <button
                            onClick={() => setActiveModal('export-zip')}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 transition flex items-center gap-1.5 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-950" />
                            <span>Xuất Frame</span>
                        </button>

                    </div>
                </div>
            </header>

            {/* Main Sticky Scroll Section */}
            <main ref={containerRef} className="relative w-full h-[550vh]">

                {/* Sticky Fullscreen Player */}
                <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black perspective-[1200px]">

                    {/* Dynamic Ambient Background Glow */}
                    <div className="absolute w-[60vw] h-[60vw] rounded-full bg-cyan-500/15 filter blur-[120px] pointer-events-none -top-20 -left-20" />
                    <div className="absolute w-[60vw] h-[60vw] rounded-full bg-indigo-500/15 filter blur-[120px] pointer-events-none -bottom-20 -right-20" />

                    {/* Viewport Container với hiệu ứng Cinematic Parallax Zoom & Blur */}
                    <div
                        ref={viewportRef}
                        className="relative w-full h-full flex items-center justify-center transition-all duration-75 ease-out will-change-transform"
                    >
                        {/* HTML5 Canvas làm bề mặt render chính */}
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-cover select-none pointer-events-none filter drop-shadow-2xl"
                        />
                    </div>

                    {/* Processing RAM Frame Modal */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-6">
                            <div className="relative mb-5">
                                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                                </div>
                            </div>
                            <h3 className="text-xl font-extrabold text-white mb-2">Đang nạp {framesCount} frames vào RAM...</h3>
                            <p className="text-xs text-slate-400 mb-5 max-w-sm text-center">
                                Tự động tối ưu hóa kích thước bitmap và chuẩn bị sẵn bộ nhớ đệm chống xé hình.
                            </p>

                            <div className="w-80 bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-150"
                                    style={{ width: `${processProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-cyan-400 mt-2 font-bold">{processProgress}%</span>
                        </div>
                    )}

                    {/* Gradient điện ảnh tạo chiều sâu */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c]/70 pointer-events-none" />

                    {/* Dynamic Story Overlays (Chèn Content theo Scroll linh hoạt) */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {storyNodes.map((node) => {
                            const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
                            const posClass = getPositionClasses(node.position);

                            // Màu sắc theo tag
                            const tagColors = {
                                cyan: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
                                emerald: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
                                indigo: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]',
                                amber: 'bg-amber-950/80 border-amber-700/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            };

                            return (
                                <div
                                    key={node.id}
                                    className={`absolute flex flex-col transition-all duration-700 ${posClass} ${isVisible
                                            ? 'opacity-100 translate-y-0 filter-none pointer-events-auto'
                                            : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                                        }`}
                                >
                                    {node.tag && (
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider mb-3 ${tagColors[node.tagColor] || tagColors.cyan
                                            }`}>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>{node.tag}</span>
                                        </div>
                                    )}

                                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                                        {node.title}
                                    </h2>

                                    {node.description && (
                                        <p className="mt-3 text-sm sm:text-base text-slate-300/90 leading-relaxed backdrop-blur-md bg-black/45 p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-xl max-w-lg">
                                            {node.description}
                                        </p>
                                    )}

                                    {node.ctaText && (
                                        <button className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition">
                                            {node.ctaText}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Realtime Performance HUD */}
                    <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
                        <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] text-xs font-mono space-y-2.5">
                            <div className="flex justify-between items-center text-slate-400">
                                <span>Tiến trình</span>
                                <span className="text-cyan-400 font-bold text-sm">{Math.round(scrollProgress * 100)}%</span>
                            </div>

                            <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400">Frame RAM</span>
                                <span className="text-white font-bold">
                                    {(scrollProgress * (cachedBitmaps.length - 1)).toFixed(1)} / {cachedBitmaps.length}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Tốc độ làm tươi</span>
                                <span className="text-emerald-400 font-bold">~{fps} FPS</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Vận tốc cuộn</span>
                                <span className="text-purple-400 font-semibold">{motionVelocity} px/s</span>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
                                <span className="text-slate-500">Sub-frame Blend</span>
                                <span className={enableFrameBlend ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                                    {enableFrameBlend ? 'BẬT (Siêu mịn)' : 'TẮT'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Hint */}
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-all duration-500 ${scrollProgress > 0.04 ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Cuộn để xem story content</span>
                        <div className="w-5 h-9 rounded-full border-2 border-cyan-400/60 flex justify-center p-1 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                            <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
                        </div>
                    </div>

                </div>
            </main>

            {/* Modal Quản lý & Chèn Content theo Scroll */}
            {activeModal === 'manage-content' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Type className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h3 className="font-bold text-white text-base sm:text-lg">Bộ Biên Tập Story Content Theo Scroll</h3>
                                    <p className="text-xs text-slate-400">Tùy chỉnh các đoạn văn bản, tiêu đề và nút CTA xuất hiện tại từng mốc cuộn</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">

                            {/* Timeline trực quan các mốc Content */}
                            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Scroll Timeline (0% đến 100%)</span>
                                    <span className="text-cyan-400 font-mono">Vị trí hiện tại: {Math.round(scrollProgress * 100)}%</span>
                                </div>
                                <div className="relative w-full h-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-1">
                                    {/* Con trỏ vị trí cuộn hiện tại */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20 shadow-[0_0_8px_#f87171]"
                                        style={{ left: `${scrollProgress * 100}%` }}
                                    />
                                    {/* Các khối mốc content */}
                                    {storyNodes.map((node, i) => (
                                        <div
                                            key={node.id}
                                            onClick={() => setEditingNodeId(node.id)}
                                            className="absolute top-1 bottom-1 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer transition truncate px-2 border"
                                            style={{
                                                left: `${node.startProgress * 100}%`,
                                                width: `${Math.max((node.endProgress - node.startProgress) * 100, 5)}%`,
                                                backgroundColor: node.tagColor === 'emerald' ? 'rgba(16,185,129,0.25)' : node.tagColor === 'indigo' ? 'rgba(99,102,241,0.25)' : 'rgba(6,182,212,0.25)',
                                                borderColor: node.tagColor === 'emerald' ? '#10b981' : node.tagColor === 'indigo' ? '#6366f1' : '#06b6d4',
                                                color: '#fff'
                                            }}
                                            title={`${node.title} (${Math.round(node.startProgress * 100)}% - ${Math.round(node.endProgress * 100)}%)`}
                                        >
                                            {node.title || `Mốc ${i + 1}`}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Danh sách các Thẻ Content */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-300">Danh sách các mốc Story ({storyNodes.length})</h4>
                                    <button
                                        onClick={handleAddStoryNode}
                                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20 active:scale-95"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Thêm mốc mới</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {storyNodes.map((node, idx) => (
                                        <div
                                            key={node.id}
                                            className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-mono font-bold text-cyan-400">#0{idx + 1}</span>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={node.title}
                                                        onChange={(e) => handleUpdateNode(node.id, 'title', e.target.value)}
                                                        placeholder="Tiêu đề chính..."
                                                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={node.tag}
                                                        onChange={(e) => handleUpdateNode(node.id, 'tag', e.target.value)}
                                                        placeholder="Badge phụ đề (Tag)..."
                                                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNode(node.id)}
                                                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                                    title="Xóa mốc này"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                {/* Vị trí trên màn hình */}
                                                <div>
                                                    <label className="text-slate-400 text-[11px] block mb-1">Vị trí hiển thị:</label>
                                                    <select
                                                        value={node.position}
                                                        onChange={(e) => handleUpdateNode(node.id, 'position', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-cyan-500"
                                                    >
                                                        <option value="top-left">Góc trên bên trái</option>
                                                        <option value="top-right">Góc trên bên phải</option>
                                                        <option value="center">Chính giữa màn hình</option>
                                                        <option value="bottom-left">Góc dưới bên trái</option>
                                                        <option value="bottom-right">Góc dưới bên phải</option>
                                                    </select>
                                                </div>

                                                {/* Mốc Scroll Bắt đầu */}
                                                <div>
                                                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                                                        <span>Hiện từ:</span>
                                                        <span className="text-cyan-400 font-mono font-bold">{Math.round(node.startProgress * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="0.9"
                                                        step="0.05"
                                                        value={node.startProgress}
                                                        onChange={(e) => handleUpdateNode(node.id, 'startProgress', parseFloat(e.target.value))}
                                                        className="w-full accent-cyan-400 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Mốc Scroll Kết thúc */}
                                                <div>
                                                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                                                        <span>Ẩn tại:</span>
                                                        <span className="text-cyan-400 font-mono font-bold">{Math.round(node.endProgress * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="1.0"
                                                        step="0.05"
                                                        value={node.endProgress}
                                                        onChange={(e) => handleUpdateNode(node.id, 'endProgress', parseFloat(e.target.value))}
                                                        className="w-full accent-cyan-400 cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                                <div className="sm:col-span-3">
                                                    <textarea
                                                        rows={2}
                                                        value={node.description}
                                                        onChange={(e) => handleUpdateNode(node.id, 'description', e.target.value)}
                                                        placeholder="Đoạn văn miêu tả chi tiết..."
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={node.ctaText}
                                                        onChange={(e) => handleUpdateNode(node.id, 'ctaText', e.target.value)}
                                                        placeholder="Nút CTA (tùy chọn)..."
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-400">Các thay đổi được áp dụng ngay lập tức trên màn hình cuộn phía sau</span>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                            >
                                Hoàn tất
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal Xuất Code React */}
            {activeModal === 'export-code' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">

                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Code2 className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-white text-base sm:text-lg">Xuất Mã Nguồn React Độc Lập</h3>
                                    <p className="text-xs text-slate-400">Chọn chế độ nhúng sẵn frame trong code hoặc đọc từ thư mục ảnh</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">

                            {/* Box 1 Lệnh Cài Đặt Thư Viện Nhanh (Setup CLI) */}
                            <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-950/40 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-cyan-400" />
                                        <span className="font-bold text-white text-xs">Cài đặt dependencies (1 lệnh duy nhất):</span>
                                    </div>
                                    {/* Package Manager Selector */}
                                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                                        {['npm', 'pnpm', 'yarn', 'bun'].map((pm) => (
                                            <button
                                                key={pm}
                                                onClick={() => setPackageManager(pm)}
                                                className={`px-2 py-0.5 rounded-md uppercase font-bold transition ${packageManager === pm
                                                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                                        : 'text-slate-400 hover:text-slate-200'
                                                    }`}
                                            >
                                                {pm}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Command Line Bar */}
                                <div className="flex items-center justify-between gap-3 bg-[#070b13] border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="text-cyan-500 font-bold select-none">$</span>
                                        <span className="text-emerald-300 font-semibold truncate">{getInstallCommand()}</span>
                                    </div>
                                    <button
                                        onClick={() => handleCopyCode(getInstallCommand(), 'install-cmd')}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 transition text-[11px] font-bold active:scale-95 shrink-0"
                                    >
                                        {copiedTab === 'install-cmd' ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Đã copy!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy lệnh</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                    <span>💡 Bạn tạo dự án mới hoàn toàn?</span>
                                    <button
                                        onClick={() => handleCopyCode(getQuickInitCommand(), 'init-cmd')}
                                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1 transition"
                                    >
                                        {copiedTab === 'init-cmd' ? 'Đã copy full lệnh tạo Vite!' : 'Copy 1 lệnh tạo Full Project Vite + Tailwind'}
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Lựa Chọn Chế Độ Xuất */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                                <button
                                    onClick={() => setCodeExportMode('embedded')}
                                    className={`p-3 rounded-xl text-left transition flex flex-col gap-1 border ${codeExportMode === 'embedded'
                                            ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                                            : 'border-transparent text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            1. Nhúng Frame trực tiếp vào Code (All-in-One)
                                        </span>
                                        {codeExportMode === 'embedded' && <Check className="w-4 h-4 text-cyan-400" />}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Toàn bộ frame được mã hóa thành Base64 nằm ngay trong 1 file .jsx duy nhất. Copy và chạy ngay, không cần thư mục ảnh!
                                    </p>
                                </button>

                                <button
                                    onClick={() => setCodeExportMode('folder')}
                                    className={`p-3 rounded-xl text-left transition flex flex-col gap-1 border ${codeExportMode === 'folder'
                                            ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                            : 'border-transparent text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                                            <FileArchive className="w-3.5 h-3.5" />
                                            2. Sử dụng thư mục ảnh tĩnh (Standard WebP)
                                        </span>
                                        {codeExportMode === 'folder' && <Check className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Code đọc từ <code className="text-yellow-400 font-mono">/public/frames/*.webp</code> (dùng kết hợp nút "Xuất Frame" để tải ZIP).
                                    </p>
                                </button>
                            </div>

                            {/* Code Preview Box */}
                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#05070c]">
                                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80">
                                    <span className="text-xs font-mono text-slate-400">
                                        {codeExportMode === 'embedded' ? 'SingleFileScrollVideo.jsx (Đã kèm Base64 Frames)' : 'SmoothScrollVideo.jsx (Đọc từ /public/frames/)'}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {codeExportMode === 'embedded' && !isGeneratingBase64 && (
                                            <button
                                                onClick={generateEmbeddedCode}
                                                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                            >
                                                Tạo lại Base64
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCopyCode(codeExportMode === 'embedded' ? embeddedFramesCode : reactComponentCode, 'comp')}
                                            disabled={isGeneratingBase64}
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition text-xs font-semibold disabled:opacity-50"
                                        >
                                            {copiedTab === 'comp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedTab === 'comp' ? 'Đã sao chép!' : 'Copy Toàn Bộ Code'}</span>
                                        </button>
                                    </div>
                                </div>

                                {isGeneratingBase64 ? (
                                    <div className="p-12 flex flex-col items-center justify-center space-y-3">
                                        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                                        <p className="text-xs text-slate-300 font-mono">Đang đóng gói dữ liệu {cachedBitmaps.length} frame sang Base64 ({base64Progress}%)...</p>
                                        <div className="w-64 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${base64Progress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <pre className="p-4 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[420px]">
                                        {codeExportMode === 'embedded' ? embeddedFramesCode : reactComponentCode}
                                    </pre>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-400">
                                {codeExportMode === 'embedded'
                                    ? '✨ Bạn chỉ cần dán code này vào 1 file bất kỳ là hoạt động ngay lập tức!'
                                    : '💡 Nhớ tải file ZIP và giải nén vào thư mục public/frames/ của dự án'}
                            </span>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal Xuất Trọn Bộ Frames dạng ZIP */}
            {activeModal === 'export-zip' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">

                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <FileArchive className="w-5 h-5 text-cyan-400" />
                                <h3 className="font-bold text-white text-base sm:text-lg">Xuất & Tải Gói Frame Nén</h3>
                            </div>
                            <button
                                onClick={() => !isZipping && setActiveModal(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-5 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-slate-400 font-medium">Tổng số Frame:</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={`${cachedBitmaps.length} frames`}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-slate-400 font-medium">Định dạng nén:</label>
                                    <input
                                        type="text"
                                        disabled
                                        value="WebP (Tối ưu cực nhẹ)"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-cyan-400 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-400">
                                    <span>Chất lượng ảnh nén (WebP Quality):</span>
                                    <span className="text-cyan-400 font-mono font-bold">{Math.round(exportQuality * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1"
                                    step="0.05"
                                    value={exportQuality}
                                    onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                                    disabled={isZipping}
                                    className="w-full accent-cyan-400 cursor-pointer"
                                />
                            </div>

                            {isZipping ? (
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-xs font-mono">
                                        <span className="text-slate-300">Đang đóng gói file ZIP...</span>
                                        <span className="text-cyan-400 font-bold">{zipProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-100"
                                            style={{ width: `${zipProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Sau khi tải file <code className="text-cyan-300">.zip</code>, bạn chỉ cần giải nén thư mục <code className="text-slate-300">frames/</code> vào thư mục <code className="text-yellow-400 font-mono">public/</code> của dự án Next.js hoặc Vite là hoàn tất.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setActiveModal(null)}
                                disabled={isZipping}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={downloadFramesAsZip}
                                disabled={isZipping || cachedBitmaps.length === 0}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isZipping ? 'Đang xuất ZIP...' : 'Tải File ZIP Ngay'}</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}