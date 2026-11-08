// Hàm tiện ích dùng chung cho toàn ứng dụng

/**
 * Tự động detect tỷ lệ khung hình chuẩn từ width & height
 * Nhận diện: 16:9, 9:16, 4:3, 3:4, 1:1, 21:9, 16:10, 9:19.5, v.v.
 * @param {number} width 
 * @param {number} height 
 */
export const detectAspectRatio = (width, height) => {
    if (!width || !height) {
        return {
            width: 1280,
            height: 720,
            ratio: 1.7778,
            ratioString: '16:9',
            orientation: 'landscape',
            orientationLabel: 'Ngang (Landscape)',
            label: '16:9 • HD',
            isPortrait: false,
            isLandscape: true,
            isSquare: false
        };
    }

    const r = width / height;
    const isPortrait = height > width && Math.abs(width - height) > 10;
    const isLandscape = width > height && Math.abs(width - height) > 10;
    const isSquare = Math.abs(width - height) <= 10;

    let ratioString = `${width}:${height}`;
    let label = `${width}x${height}`;

    // So sánh với các tỷ lệ tiêu chuẩn phổ biến (dung sai sai số 0.05)
    const standardRatios = [
        { name: '16:9', val: 16 / 9, tag: '16:9 (Chuẩn ngang HD)' },
        { name: '9:16', val: 9 / 16, tag: '9:16 (Dọc TikTok/Shorts)' },
        { name: '4:3', val: 4 / 3, tag: '4:3 (Cổ điển)' },
        { name: '3:4', val: 3 / 4, tag: '3:4 (Dọc Tablet)' },
        { name: '1:1', val: 1.0, tag: '1:1 (Vuông Instagram)' },
        { name: '21:9', val: 21 / 9, tag: '21:9 (Ultrawide Cinematic)' },
        { name: '16:10', val: 16 / 10, tag: '16:10 (Màn hình Laptop)' },
        { name: '9:19.5', val: 9 / 19.5, tag: '9:19.5 (iPhone hiện đại)' },
        { name: '9:20', val: 9 / 20, tag: '9:20 (Android Flagship)' },
        { name: '3:2', val: 3 / 2, tag: '3:2 (Tablet/DSLR)' },
    ];

    let closest = null;
    let minDiff = 0.05;
    for (const item of standardRatios) {
        const diff = Math.abs(r - item.val);
        if (diff < minDiff) {
            minDiff = diff;
            closest = item;
        }
    }

    if (closest) {
        ratioString = closest.name;
        label = closest.tag;
    } else {
        ratioString = r > 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`;
        label = `${ratioString} (${isPortrait ? 'Dọc' : isLandscape ? 'Ngang' : 'Vuông'})`;
    }

    return {
        width,
        height,
        ratio: r,
        ratioString,
        label,
        orientation: isPortrait ? 'portrait' : isLandscape ? 'landscape' : 'square',
        orientationLabel: isPortrait ? 'Dọc (Portrait)' : isLandscape ? 'Ngang (Landscape)' : 'Vuông (Square)',
        isPortrait,
        isLandscape,
        isSquare
    };
};

/**
 * Tự động detect phân giải màn hình / viewport hiện tại
 */
export const detectScreenMetrics = () => {
    if (typeof window === 'undefined') {
        return {
            width: 1920,
            height: 1080,
            dpr: 1,
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            orientation: 'landscape',
            ratioString: '16:9',
            label: '16:9 • Desktop'
        };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const aspect = detectAspectRatio(width, height);

    return {
        ...aspect,
        dpr,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024
    };
};

/**
 * So sánh tỉ lệ giữa video và màn hình thiết bị
 */
export const compareAspectRatios = (videoMetrics, screenMetrics) => {
    if (!videoMetrics || !screenMetrics) return null;

    const sameOrientation = videoMetrics.orientation === screenMetrics.orientation;
    const diff = Math.abs(videoMetrics.ratio - screenMetrics.ratio);
    const matchScore = Math.max(0, Math.min(100, Math.round((1 - diff / Math.max(videoMetrics.ratio, screenMetrics.ratio)) * 100)));

    let status = 'perfect'; // perfect | good | mismatch
    let message = 'Tỷ lệ video và màn hình tương thích hoàn hảo.';

    if (!sameOrientation && !videoMetrics.isSquare && !screenMetrics.isSquare) {
        status = 'mismatch';
        if (videoMetrics.isPortrait && screenMetrics.isLandscape) {
            message = 'Video dọc (9:16) trên màn hình máy tính ngang. Chế độ "Adaptive" sẽ giữ trọn khung hình với hiệu ứng ambient blur.';
        } else {
            message = 'Video ngang (16:9) trên màn hình điện thoại dọc. Chế độ "Cover" sẽ lấy trọn trọng tâm video.';
        }
    } else if (matchScore < 75) {
        status = 'good';
        message = `Tương thích ${matchScore}%. Tự động căn chỉnh mượt mà theo màn hình.`;
    }

    return {
        sameOrientation,
        matchScore,
        status,
        message
    };
};

/**
 * Tính toán tọa độ và kích thước vẽ theo chế độ render (cover | contain | adaptive)
 * @param {string} fitMode - 'cover' | 'contain' | 'adaptive'
 * @param {number} cw - Canvas width
 * @param {number} ch - Canvas height
 * @param {number} sw - Source width
 * @param {number} sh - Source height
 */
export const getDrawMetrics = (fitMode = 'adaptive', cw, ch, sw, sh) => {
    if (!sw || !sh) return { cx: 0, cy: 0, nw: cw, nh: ch, activeMode: 'cover', isLetterboxed: false };

    let effectiveMode = fitMode;
    if (fitMode === 'adaptive') {
        const isScreenPortrait = ch > cw;
        const isVideoPortrait = sh > sw;
        // Nếu cùng hướng -> Cover tràn viền. Khác hướng -> Contain tránh mất góc
        effectiveMode = (isScreenPortrait === isVideoPortrait) ? 'cover' : 'contain';
    }

    let ratio;
    if (effectiveMode === 'contain') {
        ratio = Math.min(cw / sw, ch / sh);
    } else {
        ratio = Math.max(cw / sw, ch / sh);
    }

    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;
    const isLetterboxed = effectiveMode === 'contain' && (nw < cw - 2 || nh < ch - 2);

    return {
        cx,
        cy,
        nw,
        nh,
        activeMode: effectiveMode,
        isLetterboxed
    };
};

/**
 * Tính toán vùng vẽ Cover tỉ lệ chuẩn (giữ để backward compatible)
 */
export const getCoverDrawMetrics = (cw, ch, sw, sh) => {
    const ratio = Math.max(cw / sw, ch / sh);
    const nw = sw * ratio;
    const nh = sh * ratio;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;
    return { cx, cy, nw, nh };
};

/**
 * Lấy class Tailwind theo vị trí hiển thị của Story Node - Responsive cho mobile
 * @param {string} position - Vị trí: top-left | top-right | center | bottom-left | bottom-right
 * @returns {string} Tailwind CSS classes
 */
export const getPositionClasses = (position) => {
    switch (position) {
        case 'top-left':
            return 'top-24 sm:top-24 left-4 sm:left-14 right-4 sm:right-auto items-start text-left max-w-xl';
        case 'top-right':
            return 'top-24 sm:top-24 right-4 sm:right-14 left-4 sm:left-auto items-end text-right max-w-xl';
        case 'center':
            return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center text-center w-full max-w-xl px-4 sm:px-0';
        case 'bottom-right':
            return 'bottom-24 sm:bottom-24 right-4 sm:right-14 left-4 sm:left-auto items-end text-right max-w-xl';
        case 'bottom-left':
        default:
            return 'bottom-24 sm:bottom-24 left-4 sm:left-14 right-4 sm:right-auto items-start text-left max-w-xl';
    }
};

/**
 * Tạo câu lệnh cài đặt thư viện theo package manager
 */
export const getInstallCommand = (packageManager) => {
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

/**
 * Tạo câu lệnh khởi tạo dự án Vite mới siêu tốc 1 dòng
 */
export const getQuickInitCommand = (packageManager) => {
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

/**
 * Nạp thư viện JSZip từ CDN để hỗ trợ nén và xuất file ZIP
 */
export const loadJSZip = () => {
    return new Promise((resolve, reject) => {
        if (window.JSZip) return resolve(window.JSZip);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Bảng màu sắc theo tagColor cho Story Node
 */
export const tagColorMap = {
    cyan: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
    emerald: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    indigo: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]',
    amber: 'bg-amber-950/80 border-amber-700/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
};
