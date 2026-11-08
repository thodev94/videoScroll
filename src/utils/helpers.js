// Hàm tiện ích dùng chung cho toàn ứng dụng

/**
 * Tính toán vùng vẽ Cover tỉ lệ chuẩn (giống object-fit: cover)
 * @param {number} cw - Canvas width
 * @param {number} ch - Canvas height
 * @param {number} sw - Source width
 * @param {number} sh - Source height
 * @returns {{ cx: number, cy: number, nw: number, nh: number }}
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
 * Lấy class Tailwind theo vị trí hiển thị của Story Node
 * @param {string} position - Vị trí: top-left | top-right | center | bottom-left | bottom-right
 * @returns {string} Tailwind CSS classes
 */
export const getPositionClasses = (position) => {
    switch (position) {
        case 'top-left': return 'top-20 left-6 sm:left-14 items-start text-left max-w-xl';
        case 'top-right': return 'top-20 right-6 sm:right-14 items-end text-right max-w-xl';
        case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center text-center max-w-2xl';
        case 'bottom-right': return 'bottom-24 right-6 sm:right-14 items-end text-right max-w-xl';
        case 'bottom-left':
        default: return 'bottom-24 left-6 sm:left-14 items-start text-left max-w-xl';
    }
};

/**
 * Tạo câu lệnh cài đặt thư viện theo package manager
 * @param {string} packageManager - 'npm' | 'pnpm' | 'yarn' | 'bun'
 * @returns {string}
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
 * @param {string} packageManager - 'npm' | 'pnpm' | 'yarn' | 'bun'
 * @returns {string}
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
 * @returns {Promise<JSZip>}
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

