/**
 * Sinh mã nguồn React component cho chế độ "folder" (đọc từ /public/frames/)
 * @param {number} frameCount - Số lượng frame
 * @param {Array} storyNodes - Mảng story nodes
 * @returns {string} Mã nguồn JSX
 */
export const generateFolderModeCode = (frameCount, storyNodes) => {
    return `import React, { useEffect, useRef, useState } from 'react';

// Tổng số khung hình nén tải từ public/frames/
const TOTAL_FRAMES = ${frameCount};

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
      img.src = \\\`/frames/frame_\\\${num}.webp\\\`;
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
                className={\\\`absolute transition-all duration-700 \\\${
                  isVisible 
                    ? 'opacity-100 translate-y-0 filter-none pointer-events-auto' 
                    : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                }\\\`}
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
};

/**
 * Sinh mã nguồn React component cho chế độ "embedded" (nhúng Base64 trực tiếp)
 * @param {ImageBitmap[]} cachedBitmaps - Mảng bitmap đã cache
 * @param {Array} storyNodes - Mảng story nodes
 * @param {(progress: number) => void} onProgress - Callback cập nhật tiến trình
 * @returns {Promise<string>} Mã nguồn JSX (bất đồng bộ vì cần convert bitmap -> base64)
 */
export const generateEmbeddedModeCode = async (cachedBitmaps, storyNodes, onProgress) => {
    if (cachedBitmaps.length === 0) return '';

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
            onProgress(Math.round(((i + 1) / total) * 100));
            // Cho trình duyệt nhả event loop một chút để không đơ UI
            await new Promise((r) => setTimeout(r, 0));
        }
    }

    return `import React, { useEffect, useRef, useState } from 'react';

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
                className={\\\`absolute transition-all duration-700 \\\${
                  isVisible 
                    ? 'opacity-100 translate-y-0 filter-none pointer-events-auto' 
                    : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                }\\\`}
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
};

