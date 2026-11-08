/**
 * Sinh mã nguồn React component cho chế độ "folder" (đọc từ /public/frames/)
 * Hỗ trợ Responsive toàn diện + Tự động detect tỷ lệ video theo phân giải màn hình
 * Hỗ trợ 2 chế độ style: 'pure-css' (Thuần CSS không phụ thuộc thư viện) & 'tailwind'
 *
 * @param {number} frameCount - Số lượng frame
 * @param {Array} storyNodes - Mảng story nodes
 * @param {string} [stylingFramework='pure-css'] - 'pure-css' | 'tailwind'
 * @returns {string} Mã nguồn JSX
 */
export const generateFolderModeCode = (frameCount, storyNodes, stylingFramework = 'pure-css', enableFrameBlend = true) => {
    if (stylingFramework === 'pure-css') {
        return `import React, { useEffect, useRef, useState, useCallback } from 'react';

// Tổng số khung hình nén tải từ public/frames/
const TOTAL_FRAMES = ${frameCount};

// Dữ liệu nội dung hiển thị theo tiến trình Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);

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
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  // 2. Hàm vẽ frame lên Canvas với tỷ lệ Cover chuẩn xác, tự động căn giữa không bị méo/bể hình
  const drawFrame = useCallback((frameIdx, blendIdx = -1, fraction = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    // Tìm ảnh hợp lệ (hoặc ảnh gần nhất đã tải xong để không bao giờ bị đen màn hình)
    let img1 = imagesRef.current[frameIdx];
    if (!img1 || !img1.complete || !img1.naturalWidth) {
      for (let o = 1; o < TOTAL_FRAMES; o++) {
        const prev = imagesRef.current[Math.max(0, frameIdx - o)];
        if (prev && prev.complete && prev.naturalWidth) { img1 = prev; break; }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES - 1, frameIdx + o)];
        if (next && next.complete && next.naturalWidth) { img1 = next; break; }
      }
    }
    if (!img1 || !img1.naturalWidth) return;

    const sw = img1.naturalWidth || img1.width;
    const sh = img1.naturalHeight || img1.height;
    const ratio = Math.max(cw / sw, ch / sh);
    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    // Luôn phủ màu nền đen rạp chiếu phim trước khi vẽ
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, cx, cy, nw, nh);
${enableFrameBlend ? `
    // Sub-frame blending: Chỉ hòa trộn khi chuyển tiếp rõ rệt, loại bỏ hiện tượng bóng mờ (ghosting)
    if (blendIdx >= 0 && fraction > 0.05 && fraction < 0.95 && blendIdx !== frameIdx) {
      const img2 = imagesRef.current[blendIdx];
      if (img2 && img2.complete && img2.naturalWidth && img2 !== img1) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(img2, cx, cy, nw, nh);
        ctx.globalAlpha = 1.0;
      }
    }` : ''}
  }, []);

  // 3. Tự động resize Canvas đồng bộ DPR và phân giải màn hình
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = Math.round(window.innerWidth * dpr);
      canvasRef.current.height = Math.round(window.innerHeight * dpr);

      // Vẽ lại frame ngay sau khi resize để không bị trắng/đen màn hình
      const curIdx = Math.min(Math.max(0, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1))), TOTAL_FRAMES - 1);
      drawFrame(curIdx);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame]);

  // 4. Vòng lặp render đồng bộ LERP + Sub-frame Blending
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgressRef.current = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const diff = targetProgressRef.current - smoothProgressRef.current;
      const step = 1 - Math.exp(-12.0 * dt);

      if (Math.abs(diff) > 0.0001) {
        smoothProgressRef.current += diff * step;
        setScrollProgress(smoothProgressRef.current);

        const exact = smoothProgressRef.current * (TOTAL_FRAMES - 1);
        const baseIdx = Math.floor(exact);
${enableFrameBlend ? `        const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
        const fraction = exact - baseIdx;

        drawFrame(baseIdx, nextIdx, fraction);` : `        drawFrame(baseIdx);`}
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Kích hoạt ngay để nhận diện vị trí scroll ban đầu
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  // Vị trí node theo Pure CSS
  const getPosClass = (pos) => {
    switch (pos) {
      case 'top-left': return 'v-pos-tl';
      case 'top-right': return 'v-pos-tr';
      case 'center': return 'v-pos-center';
      case 'bottom-right': return 'v-pos-br';
      case 'bottom-left':
      default: return 'v-pos-bl';
    }
  };

  return (
    <div ref={containerRef} className="v-scroll-container">
      {/* Pure CSS độc lập hoàn toàn - Zero Dependencies */}
      <style>{\`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #05070c; color: #fff; width: 100%; min-height: 100%; overflow-x: clip; }
        .v-scroll-container { position: relative; width: 100%; height: 500vh; background-color: #05070c; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
        .v-viewport { position: sticky; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #05070c; }
        .v-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; user-select: none; }
        .v-overlay-layer { position: absolute; inset: 0; pointer-events: none; padding: 24px; box-sizing: border-box; z-index: 10; }
        .v-node { position: absolute; max-width: 500px; transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .v-visible { opacity: 1; transform: translateY(0); filter: blur(0); pointer-events: auto; }
        .v-hidden { opacity: 0; transform: translateY(24px); filter: blur(8px); pointer-events: none; }
        .v-pos-tl { top: 5rem; left: 2.5rem; text-align: left; }
        .v-pos-tr { top: 5rem; right: 2.5rem; text-align: right; }
        .v-pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .v-pos-bl { bottom: 5rem; left: 2.5rem; text-align: left; }
        .v-pos-br { bottom: 5rem; right: 2.5rem; text-align: right; }
        .v-tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 8px; padding: 4px 12px; background: rgba(8, 47, 73, 0.75); border: 1px solid rgba(14, 165, 233, 0.4); border-radius: 9999px; }
        .v-title { font-size: 2.75rem; font-weight: 900; line-height: 1.15; margin: 0; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
        .v-desc { margin-top: 10px; font-size: 15px; color: #cbd5e1; line-height: 1.6; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); }
        .v-btn { margin-top: 14px; padding: 10px 22px; background: #38bdf8; color: #000; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); transition: all 0.2s; }
        .v-btn:hover { background: #7dd3fc; transform: translateY(-2px); }
        .v-loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5,7,12,0.85); font-family: monospace; font-size: 13px; color: #38bdf8; z-index: 20; }
        @media (max-width: 640px) {
          .v-pos-tl, .v-pos-bl { left: 1rem; right: 1rem; }
          .v-pos-tr, .v-pos-br { right: 1rem; left: 1rem; }
          .v-title { font-size: 1.75rem; }
          .v-desc { font-size: 13px; padding: 10px 14px; }
          .v-overlay-layer { padding: 12px; }
        }
      \`}</style>

      <div className="v-viewport">
        <canvas ref={canvasRef} className="v-canvas" />

        <div className="v-overlay-layer">
          {STORY_NODES.map((node) => {
            const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
            return (
              <div
                key={node.id}
                className={\`v-node \${getPosClass(node.position)} \${isVisible ? 'v-visible' : 'v-hidden'}\`}
              >
                {node.contentType === 'custom' ? (
                  <>
                    {node.customCss && <style>{\`\${node.customCss}\`}</style>}
                    <div dangerouslySetInnerHTML={{ __html: node.customHtml || '' }} />
                  </>
                ) : (
                  <>
                    {node.tag && <span className="v-tag">{node.tag}</span>}
                    <h2 className="v-title">{node.title}</h2>
                    {node.description && <p className="v-desc">{node.description}</p>}
                    {node.ctaText && <button className="v-btn">{node.ctaText}</button>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="v-loader">
            Tải khung hình: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
}`;
    }

    // Default: Tailwind CSS Mode
    return `import React, { useEffect, useRef, useState, useCallback } from 'react';

// Tổng số khung hình nén tải từ public/frames/
const TOTAL_FRAMES = ${frameCount};

// Dữ liệu nội dung hiển thị theo tiến trình Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);

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
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  // 2. Hàm vẽ frame lên Canvas với tỷ lệ Cover chuẩn xác, tự động căn giữa không bị méo/bể hình
  const drawFrame = useCallback((frameIdx, blendIdx = -1, fraction = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    // Tìm ảnh hợp lệ (hoặc ảnh gần nhất đã tải xong để không bao giờ bị đen màn hình)
    let img1 = imagesRef.current[frameIdx];
    if (!img1 || !img1.complete || !img1.naturalWidth) {
      for (let o = 1; o < TOTAL_FRAMES; o++) {
        const prev = imagesRef.current[Math.max(0, frameIdx - o)];
        if (prev && prev.complete && prev.naturalWidth) { img1 = prev; break; }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES - 1, frameIdx + o)];
        if (next && next.complete && next.naturalWidth) { img1 = next; break; }
      }
    }
    if (!img1 || !img1.naturalWidth) return;

    const sw = img1.naturalWidth || img1.width;
    const sh = img1.naturalHeight || img1.height;
    const ratio = Math.max(cw / sw, ch / sh);
    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    // Luôn phủ màu nền đen rạp chiếu phim trước khi vẽ
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, cx, cy, nw, nh);
${enableFrameBlend ? `
    // Sub-frame blending: Chỉ hòa trộn khi chuyển tiếp rõ rệt, loại bỏ hiện tượng bóng mờ (ghosting)
    if (blendIdx >= 0 && fraction > 0.05 && fraction < 0.95 && blendIdx !== frameIdx) {
      const img2 = imagesRef.current[blendIdx];
      if (img2 && img2.complete && img2.naturalWidth && img2 !== img1) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(img2, cx, cy, nw, nh);
        ctx.globalAlpha = 1.0;
      }
    }` : ''}
  }, []);

  // 3. Tự động resize Canvas đồng bộ DPR và phân giải màn hình
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = Math.round(window.innerWidth * dpr);
      canvasRef.current.height = Math.round(window.innerHeight * dpr);

      // Vẽ lại frame ngay sau khi resize để không bị trắng/đen màn hình
      const curIdx = Math.min(Math.max(0, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1))), TOTAL_FRAMES - 1);
      drawFrame(curIdx);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame]);

  // 4. Vòng lặp render đồng bộ LERP + Sub-frame Blending
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgressRef.current = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const diff = targetProgressRef.current - smoothProgressRef.current;
      const step = 1 - Math.exp(-12.0 * dt);

      if (Math.abs(diff) > 0.0001) {
        smoothProgressRef.current += diff * step;
        setScrollProgress(smoothProgressRef.current);

        const exact = smoothProgressRef.current * (TOTAL_FRAMES - 1);
        const baseIdx = Math.floor(exact);
${enableFrameBlend ? `        const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
        const fraction = exact - baseIdx;

        drawFrame(baseIdx, nextIdx, fraction);` : `        drawFrame(baseIdx);`}
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Kích hoạt ngay để nhận diện vị trí scroll ban đầu
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh] bg-[#05070c] text-white font-sans overflow-x-clip">
      <div className="sticky top-0 left-0 w-full h-screen h-[100dvh] overflow-hidden flex items-center justify-center bg-[#05070c]">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full block select-none pointer-events-none"
        />

        {/* Lớp phủ Nội dung Storyboard theo Scroll */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-8 md:p-12 z-10">
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
                  left: node.position.includes('left') ? '1.5rem' : node.position.includes('right') ? 'auto' : '50%',
                  right: node.position.includes('right') ? '1.5rem' : 'auto',
                  transform: node.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                  textAlign: node.position.includes('right') ? 'right' : node.position === 'center' ? 'center' : 'left'
                }}
              >
                {node.contentType === 'custom' ? (
                  <>
                    {node.customCss && <style>{\`\${node.customCss}\`}</style>}
                    <div dangerouslySetInnerHTML={{ __html: node.customHtml || '' }} />
                  </>
                ) : (
                  <>
                    {node.tag && (
                      <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 px-3 py-1 bg-cyan-950/70 border border-cyan-800 rounded-full">
                        {node.tag}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black drop-shadow-xl">{node.title}</h2>
                    {node.description && (
                      <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-300 max-w-xs sm:max-w-md backdrop-blur-sm bg-black/50 p-3 sm:p-4 rounded-xl border border-white/10">
                        {node.description}
                      </p>
                    )}
                    {node.ctaText && (
                      <button className="mt-3 sm:mt-4 px-4 sm:px-5 py-2 sm:py-2.5 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-cyan-400 transition">
                        {node.ctaText}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white font-mono text-xs sm:text-sm">
            Tải khung hình: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
}`;
};

/**
 * Sinh mã nguồn React component cho chế độ "embedded" (nhúng Base64 trực tiếp)
 * TỐI ƯU SIÊU TỐC:
 * 1. Đa luồng song song (Multi-threaded Concurrency)
 * 2. Asynchronous toBlob + FileReader (không lock UI thread)
 * 3. Hỗ trợ Speed Presets: 'fast' (siêu nhanh ~1-2s), 'balanced' (~3-4s), 'high'
 * 4. Hỗ trợ 2 chế độ style: 'pure-css' (Zero-Dependency) & 'tailwind'
 *
 * @param {ImageBitmap[]} cachedBitmaps - Mảng bitmap đã cache trong RAM
 * @param {Array} storyNodes - Mảng story nodes
 * @param {(progress: number) => void} onProgress - Callback cập nhật tiến trình
 * @param {() => boolean} [checkCancelled] - Kiểm tra tín hiệu hủy
 * @param {string} [speedPreset='fast'] - 'fast' | 'balanced' | 'high'
 * @param {string} [stylingFramework='pure-css'] - 'pure-css' | 'tailwind'
 * @returns {Promise<string>} Mã nguồn JSX
 */
export const generateEmbeddedModeCode = async (
    cachedBitmaps,
    storyNodes,
    onProgress,
    checkCancelled,
    speedPreset = 'fast',
    stylingFramework = 'pure-css',
    enableFrameBlend = true
) => {
    if (cachedBitmaps.length === 0) return '';

    // Cấu hình theo preset để tối ưu dung lượng và tốc độ sinh Base64
    let maxScale = 640;
    let webpQuality = 0.70;
    if (speedPreset === 'fast') {
        maxScale = 540;
        webpQuality = 0.65;
    } else if (speedPreset === 'high') {
        maxScale = 960;
        webpQuality = 0.82;
    }

    const firstBm = cachedBitmaps[0];
    const aspect = (firstBm.height || 720) / (firstBm.width || 1280);
    const targetW = Math.min(firstBm.width || 1280, maxScale);
    const targetH = Math.round(targetW * aspect);

    const total = cachedBitmaps.length;
    const base64List = new Array(total);
    const concurrency = Math.min(8, Math.max(4, typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4));
    let completed = 0;

    const convertItem = async (index, canvas, ctx) => {
        if (checkCancelled && checkCancelled()) return;
        const bm = cachedBitmaps[index];
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(bm, 0, 0, targetW, targetH);

        const b64 = await new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(canvas.toDataURL('image/webp', webpQuality));
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            }, 'image/webp', webpQuality);
        });

        if (checkCancelled && checkCancelled()) return;
        base64List[index] = b64;
        completed++;
        onProgress(Math.round((completed / total) * 100));
    };

    const runWorker = async (startIndex) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        for (let i = startIndex; i < total; i += concurrency) {
            if (checkCancelled && checkCancelled()) return;
            await convertItem(i, canvas, ctx);
        }
    };

    const workers = [];
    for (let w = 0; w < concurrency; w++) {
        workers.push(runWorker(w));
    }
    await Promise.all(workers);

    if (checkCancelled && checkCancelled()) return '';

    if (stylingFramework === 'pure-css') {
        return `import React, { useEffect, useRef, useState, useCallback } from 'react';

// Dữ liệu nội dung Storyboard theo Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

// Mảng chứa toàn bộ dữ liệu khung hình dạng Base64 Data URL (Nhúng sẵn trong code)
const EMBEDDED_FRAMES = ${JSON.stringify(base64List, null, 2)};

const TOTAL_FRAMES = EMBEDDED_FRAMES.length;

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);

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
          drawFrame(0);
        }
      };
      images.push(img);
    });
    imagesRef.current = images;
  }, []);

  // 2. Hàm vẽ frame lên Canvas với tỷ lệ Cover chuẩn xác, tự động căn giữa không bị méo/bể hình
  const drawFrame = useCallback((frameIdx, blendIdx = -1, fraction = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    let img1 = imagesRef.current[frameIdx];
    if (!img1 || !img1.complete || !img1.naturalWidth) {
      for (let o = 1; o < TOTAL_FRAMES; o++) {
        const prev = imagesRef.current[Math.max(0, frameIdx - o)];
        if (prev && prev.complete && prev.naturalWidth) { img1 = prev; break; }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES - 1, frameIdx + o)];
        if (next && next.complete && next.naturalWidth) { img1 = next; break; }
      }
    }
    if (!img1 || !img1.naturalWidth) return;

    const sw = img1.naturalWidth || img1.width;
    const sh = img1.naturalHeight || img1.height;
    const ratio = Math.max(cw / sw, ch / sh);
    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, cx, cy, nw, nh);

    if (blendIdx >= 0 && fraction > 0.02 && blendIdx !== frameIdx) {
      const img2 = imagesRef.current[blendIdx];
      if (img2 && img2.complete && img2.naturalWidth && img2 !== img1) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(img2, cx, cy, nw, nh);
        ctx.globalAlpha = 1.0;
      }
    }
  }, []);

  // 3. Tự động resize Canvas theo phân giải màn hình & Device Pixel Ratio (DPR)
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = window.innerWidth * dpr;
      canvasRef.current.height = window.innerHeight * dpr;

      const curIdx = Math.min(Math.max(0, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1))), TOTAL_FRAMES - 1);
      drawFrame(curIdx);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame]);

  // 4. Vòng lặp render đồng bộ LERP + Sub-frame Blending
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgressRef.current = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const diff = targetProgressRef.current - smoothProgressRef.current;
      const step = 1 - Math.exp(-12.0 * dt);

      if (Math.abs(diff) > 0.0001) {
        smoothProgressRef.current += diff * step;
        setScrollProgress(smoothProgressRef.current);

        const exact = smoothProgressRef.current * (TOTAL_FRAMES - 1);
        const baseIdx = Math.floor(exact);
${enableFrameBlend ? `        const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
        const fraction = exact - baseIdx;

        drawFrame(baseIdx, nextIdx, fraction);` : `        drawFrame(baseIdx);`}
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  const getPosClass = (pos) => {
    switch (pos) {
      case 'top-left': return 'v-pos-tl';
      case 'top-right': return 'v-pos-tr';
      case 'center': return 'v-pos-center';
      case 'bottom-right': return 'v-pos-br';
      case 'bottom-left':
      default: return 'v-pos-bl';
    }
  };

  return (
    <div ref={containerRef} className="v-scroll-container">
      {/* Pure CSS độc lập hoàn toàn - Zero Dependencies */}
      <style>{\`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #05070c; color: #fff; width: 100%; min-height: 100%; overflow-x: clip; }
        .v-scroll-container { position: relative; width: 100%; height: 500vh; background-color: #05070c; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
        .v-viewport { position: sticky; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #05070c; }
        .v-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; user-select: none; }
        .v-overlay-layer { position: absolute; inset: 0; pointer-events: none; padding: 24px; box-sizing: border-box; z-index: 10; }
        .v-node { position: absolute; max-width: 500px; transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .v-visible { opacity: 1; transform: translateY(0); filter: blur(0); pointer-events: auto; }
        .v-hidden { opacity: 0; transform: translateY(24px); filter: blur(8px); pointer-events: none; }
        .v-pos-tl { top: 5rem; left: 2.5rem; text-align: left; }
        .v-pos-tr { top: 5rem; right: 2.5rem; text-align: right; }
        .v-pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .v-pos-bl { bottom: 5rem; left: 2.5rem; text-align: left; }
        .v-pos-br { bottom: 5rem; right: 2.5rem; text-align: right; }
        .v-tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 8px; padding: 4px 12px; background: rgba(8, 47, 73, 0.75); border: 1px solid rgba(14, 165, 233, 0.4); border-radius: 9999px; }
        .v-title { font-size: 2.75rem; font-weight: 900; line-height: 1.15; margin: 0; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
        .v-desc { margin-top: 10px; font-size: 15px; color: #cbd5e1; line-height: 1.6; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); }
        .v-btn { margin-top: 14px; padding: 10px 22px; background: #38bdf8; color: #000; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); transition: all 0.2s; }
        .v-btn:hover { background: #7dd3fc; transform: translateY(-2px); }
        .v-loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5,7,12,0.85); font-family: monospace; font-size: 13px; color: #38bdf8; z-index: 20; }
        @media (max-width: 640px) {
          .v-pos-tl, .v-pos-bl { left: 1rem; right: 1rem; }
          .v-pos-tr, .v-pos-br { right: 1rem; left: 1rem; }
          .v-title { font-size: 1.75rem; }
          .v-desc { font-size: 13px; padding: 10px 14px; }
          .v-overlay-layer { padding: 12px; }
        }
      \`}</style>

      <div className="v-viewport">
        <canvas ref={canvasRef} className="v-canvas" />

        <div className="v-overlay-layer">
          {STORY_NODES.map((node) => {
            const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
            return (
              <div
                key={node.id}
                className={\`v-node \${getPosClass(node.position)} \${isVisible ? 'v-visible' : 'v-hidden'}\`}
              >
                {node.contentType === 'custom' ? (
                  <>
                    {node.customCss && <style>{\`\${node.customCss}\`}</style>}
                    <div dangerouslySetInnerHTML={{ __html: node.customHtml || '' }} />
                  </>
                ) : (
                  <>
                    {node.tag && <span className="v-tag">{node.tag}</span>}
                    <h2 className="v-title">{node.title}</h2>
                    {node.description && <p className="v-desc">{node.description}</p>}
                    {node.ctaText && <button className="v-btn">{node.ctaText}</button>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="v-loader">
            Nạp bộ nhớ đệm Base64: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
}`;
    }

    // Default: Tailwind CSS Embedded Mode
    return `import React, { useEffect, useRef, useState, useCallback } from 'react';

// Dữ liệu nội dung Storyboard theo Scroll (0.0 -> 1.0)
const STORY_NODES = ${JSON.stringify(storyNodes, null, 2)};

// Mảng chứa toàn bộ dữ liệu khung hình dạng Base64 Data URL (Nhúng sẵn trong code)
const EMBEDDED_FRAMES = ${JSON.stringify(base64List, null, 2)};

const TOTAL_FRAMES = EMBEDDED_FRAMES.length;

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadedPercent, setLoadedPercent] = useState(0);

  // 1. Khởi tạo và nạp Image objects từ mảng Base64 có sẵn
  useEffect(() => {
    const images = [];
    let loaded = 0;

    EMBEDDED_FRAMES.forEach((b64) => {
      const img = new Image();
      img.src = b64;
      img.onload = () => {
        loaded++;
        setLoadedPercent(Math.round((loaded / TOTAL_FRAMES) * 100));
        if (loaded === 1 && canvasRef.current) {
          drawFrame(0);
        }
      };
      images.push(img);
    });
    imagesRef.current = images;
  }, []);

  // 2. Vẽ hình ảnh phủ kín Canvas - Tự động detect tỷ lệ video & màn hình + Fallback an toàn
  const drawFrame = useCallback((frameIdx, blendIdx = -1, fraction = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    let img1 = imagesRef.current[frameIdx];
    if (!img1 || !img1.complete || !img1.naturalWidth) {
      for (let o = 1; o < TOTAL_FRAMES; o++) {
        const prev = imagesRef.current[Math.max(0, frameIdx - o)];
        if (prev && prev.complete && prev.naturalWidth) { img1 = prev; break; }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES - 1, frameIdx + o)];
        if (next && next.complete && next.naturalWidth) { img1 = next; break; }
      }
    }
    if (!img1 || !img1.naturalWidth) return;

    const sw = img1.naturalWidth || img1.width;
    const sh = img1.naturalHeight || img1.height;
    const ratio = Math.max(cw / sw, ch / sh);
    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, cx, cy, nw, nh);

    if (blendIdx >= 0 && fraction > 0.02 && blendIdx !== frameIdx) {
      const img2 = imagesRef.current[blendIdx];
      if (img2 && img2.complete && img2.naturalWidth && img2 !== img1) {
        ctx.globalAlpha = fraction;
        ctx.drawImage(img2, cx, cy, nw, nh);
        ctx.globalAlpha = 1.0;
      }
    }
  }, []);

  // 3. Tự động resize Canvas theo phân giải màn hình & Device Pixel Ratio (DPR)
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = window.innerWidth * dpr;
      canvasRef.current.height = window.innerHeight * dpr;

      const curIdx = Math.min(Math.max(0, Math.floor(smoothProgressRef.current * (TOTAL_FRAMES - 1))), TOTAL_FRAMES - 1);
      drawFrame(curIdx);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame]);

  // 4. Vòng lặp render đồng bộ LERP + Sub-frame Blending
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      targetProgressRef.current = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    };

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const diff = targetProgressRef.current - smoothProgressRef.current;
      const step = 1 - Math.exp(-12.0 * dt);

      if (Math.abs(diff) > 0.0001) {
        smoothProgressRef.current += diff * step;
        setScrollProgress(smoothProgressRef.current);

        const exact = smoothProgressRef.current * (TOTAL_FRAMES - 1);
        const baseIdx = Math.floor(exact);
${enableFrameBlend ? `        const nextIdx = Math.min(baseIdx + 1, TOTAL_FRAMES - 1);
        const fraction = exact - baseIdx;

        drawFrame(baseIdx, nextIdx, fraction);` : `        drawFrame(baseIdx);`}
      }

      animId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh] bg-[#05070c] text-white font-sans overflow-x-clip">
      <div className="sticky top-0 left-0 w-full h-screen h-[100dvh] overflow-hidden flex items-center justify-center bg-[#05070c]">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full block select-none pointer-events-none"
        />

        {/* Lớp phủ Nội dung Storyboard theo Scroll */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-8 md:p-12 z-10">
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
                  left: node.position.includes('left') ? '1.5rem' : node.position.includes('right') ? 'auto' : '50%',
                  right: node.position.includes('right') ? '1.5rem' : 'auto',
                  transform: node.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                  textAlign: node.position.includes('right') ? 'right' : node.position === 'center' ? 'center' : 'left'
                }}
              >
                {node.contentType === 'custom' ? (
                  <>
                    {node.customCss && <style>{\`\${node.customCss}\`}</style>}
                    <div dangerouslySetInnerHTML={{ __html: node.customHtml || '' }} />
                  </>
                ) : (
                  <>
                    {node.tag && (
                      <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 px-3 py-1 bg-cyan-950/70 border border-cyan-800 rounded-full">
                        {node.tag}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black drop-shadow-xl">{node.title}</h2>
                    {node.description && (
                      <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-300 max-w-xs sm:max-w-md backdrop-blur-sm bg-black/50 p-3 sm:p-4 rounded-xl border border-white/10">
                        {node.description}
                      </p>
                    )}
                    {node.ctaText && (
                      <button className="mt-3 sm:mt-4 px-4 sm:px-5 py-2 sm:py-2.5 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-cyan-400 transition">
                        {node.ctaText}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loadedPercent < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white font-mono text-xs sm:text-sm">
            Nạp bộ nhớ đệm Base64: {loadedPercent}%
          </div>
        )}
      </div>
    </div>
  );
};
`;
};
