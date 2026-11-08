import { loadJSZip } from './helpers';
import { generateFolderModeCode, generateEmbeddedModeCode } from './codeGenerators';

/**
 * Đóng gói và tải trọn bộ DỰ ÁN REACT HOÀN CHỈNH hoặc chỉ Frame ZIP
 *
 * Khi tải trọn bộ dự án (exportMode === 'full-project'):
 * Tự động tạo cấu trúc dự án Vite + React hoàn chỉnh:
 * ├── package.json (Đã cấu hình script dev, build và dependencies)
 * ├── vite.config.js
 * ├── index.html
 * ├── README.md (Hướng dẫn 1 lệnh npm install & npm run dev)
 * ├── public/frames/ (Toàn bộ chuỗi frame ảnh WebP nén)
 * └── src/
 *     ├── main.jsx
 *     └── App.jsx (Chứa toàn bộ mã nguồn cuộn video)
 *
 * Người dùng giải nén chỉ cần chạy `npm install` và `npm run dev` là chạy ngay!
 */
export const downloadProjectZip = async ({
    cachedBitmaps,
    exportQuality = 0.85,
    videoName = 'smooth-video',
    storyNodes = [],
    stylingFramework = 'pure-css',
    exportMode = 'full-project', // 'full-project' | 'frames-only'
    codeExportMode = 'folder', // 'folder' | 'embedded'
    onProgress,
    checkCancelled
}) => {
    if (!cachedBitmaps || cachedBitmaps.length === 0) return false;

    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const cleanName = videoName.replace(/\.[^/.]+$/, '');
    const total = cachedBitmaps.length;

    // 1. Xử lý ảnh Frames WebP đa luồng
    if (codeExportMode === 'folder' || exportMode === 'frames-only') {
        const folder = exportMode === 'full-project' ? zip.folder('public/frames') : zip.folder('frames');

        const concurrency = Math.min(8, Math.max(4, typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4));
        let completed = 0;

        const processFrame = async (index, canvas, ctx) => {
            if (checkCancelled && checkCancelled()) return false;

            const item = cachedBitmaps[index];
            canvas.width = item.width;
            canvas.height = item.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(item, 0, 0);

            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/webp', exportQuality);
            });

            if (checkCancelled && checkCancelled()) return false;

            const fileName = `frame_${String(index).padStart(4, '0')}.webp`;
            folder.file(fileName, blob);

            completed++;
            onProgress(Math.round((completed / total) * (exportMode === 'full-project' ? 80 : 90)));
            return true;
        };

        const runWorker = async (startIndex) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            for (let i = startIndex; i < total; i += concurrency) {
                if (checkCancelled && checkCancelled()) return;
                await processFrame(i, canvas, ctx);
            }
        };

        const workers = [];
        for (let w = 0; w < concurrency; w++) {
            workers.push(runWorker(w));
        }
        await Promise.all(workers);

        if (checkCancelled && checkCancelled()) return false;

        folder.file('metadata.json', JSON.stringify({
            totalFrames: total,
            width: cachedBitmaps[0].width,
            height: cachedBitmaps[0].height,
            fpsTarget: 60,
            originalVideo: videoName,
            blendingSupported: true
        }, null, 2));
    }

    // 2. Tạo toàn bộ cấu trúc dự án React hoàn chỉnh nếu ở chế độ Full Project
    if (exportMode === 'full-project') {
        onProgress(85);

        let appCode = '';
        if (codeExportMode === 'embedded') {
            appCode = await generateEmbeddedModeCode(
                cachedBitmaps,
                storyNodes,
                (p) => onProgress(80 + Math.round(p * 0.1)),
                checkCancelled,
                'fast',
                stylingFramework
            );
            if (checkCancelled && checkCancelled()) return false;
        } else {
            appCode = generateFolderModeCode(total, storyNodes, stylingFramework);
        }

        // 1. src/App.jsx (Chứa code chính)
        zip.file('src/App.jsx', appCode);

        // 2. src/main.jsx
        const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
${stylingFramework === 'tailwind' ? "import './index.css';\n" : ''}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
        zip.file('src/main.jsx', mainJsx);

        // 3. index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ultra-Smooth Scroll Video</title>
  </head>
  <body style="margin:0;padding:0;background:#05070c;overflow-x:hidden;">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
        zip.file('index.html', indexHtml);

        // 4. vite.config.js
        const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
        zip.file('vite.config.js', viteConfig);

        // 5. package.json theo Framework
        if (stylingFramework === 'pure-css') {
            const packageJson = {
                name: cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                private: true,
                version: "1.0.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview"
                },
                dependencies: {
                    react: "^18.3.1",
                    "react-dom": "^18.3.1"
                },
                devDependencies: {
                    "@vitejs/plugin-react": "^4.3.4",
                    vite: "^6.0.0"
                }
            };
            zip.file('package.json', JSON.stringify(packageJson, null, 2));
        } else {
            // Tailwind Framework
            const packageJson = {
                name: cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                private: true,
                version: "1.0.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview"
                },
                dependencies: {
                    react: "^18.3.1",
                    "react-dom": "^18.3.1"
                },
                devDependencies: {
                    "@vitejs/plugin-react": "^4.3.4",
                    vite: "^6.0.0",
                    tailwindcss: "^3.4.16",
                    postcss: "^8.4.49",
                    autoprefixer: "^10.4.20"
                }
            };
            zip.file('package.json', JSON.stringify(packageJson, null, 2));

            zip.file('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`);

            zip.file('postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

            zip.file('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
`);
        }

        // 6. README.md
        const readmeContent = `# ${cleanName} - Ultra-Smooth Scroll Video

Dự án đã được cấu hình sẵn 100% (Vite + React + src/App.jsx).

## Hướng dẫn chạy dự án:
1. Mở cửa sổ dòng lệnh (Terminal/Command Prompt) tại thư mục này.
2. Cài đặt thư viện:
\`\`\`bash
npm install
\`\`\`

3. Khởi chạy dự án:
\`\`\`bash
npm run dev
\`\`\`

Mở trình duyệt tại: \`http://localhost:5173\` để xem kết quả!
`;
        zip.file('README.md', readmeContent);
    }

    onProgress(95);

    // Kỹ thuật nén siêu tốc STORE
    const content = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE'
    });

    if (checkCancelled && checkCancelled()) return false;

    onProgress(100);

    const zipFileName = exportMode === 'full-project'
        ? `${cleanName}-react-project.zip`
        : `${cleanName}-smooth-frames.zip`;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = zipFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1000);

    return true;
};

/**
 * Đóng gói frames ZIP (Backward compatible alias)
 */
export const downloadFramesAsZip = (cachedBitmaps, exportQuality, videoName, onProgress, checkCancelled) => {
    return downloadProjectZip({
        cachedBitmaps,
        exportQuality,
        videoName,
        exportMode: 'full-project',
        onProgress,
        checkCancelled
    });
};
