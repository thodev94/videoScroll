import React, { useState } from 'react';
import {
    Code2,
    Terminal,
    Check,
    Copy,
    Download,
    Sparkles,
    FileArchive,
    Zap,
    Palette,
    Rocket
} from 'lucide-react';
import { getInstallCommand, downloadCodeFile } from '../../utils/helpers';
import { generateFolderModeCode } from '../../utils/codeGenerators';

/**
 * Modal Xuất Code React
 * Hỗ trợ:
 * 1. Tải trực tiếp file src/App.jsx (1-Click)
 * 2. Tải trọn bộ dự án ZIP (Có sẵn src/App.jsx, public/frames/, package.json)
 * 3. Lựa chọn: THUẦN CSS (Zero Dependencies - Không cần Tailwind) vs TAILWIND CSS
 * 4. Chế độ: Nhúng Base64 All-in-One vs Thư mục ảnh rời
 * 5. Chế độ nén Base64 đa luồng siêu tốc
 */
export default function ExportCodeModal({
    codeExportMode,
    setCodeExportMode,
    stylingFramework = 'pure-css',
    setStylingFramework,
    packageManager,
    setPackageManager,
    copiedTab,
    onCopyCode,
    isGeneratingBase64,
    base64Progress,
    embeddedFramesCode,
    storyNodes,
    cachedBitmapsCount,
    onGenerateEmbeddedCode,
    onCancelBase64,
    onOpenExportZip,
    onDownloadProjectZip,
    onClose,
    enableFrameBlend = true,
}) {
    const [speedPreset, setSpeedPreset] = useState('fast');

    // Tạo code theo framework styling đã chọn theo thời gian thực
    const folderCode = generateFolderModeCode(cachedBitmapsCount || 200, storyNodes, stylingFramework, enableFrameBlend);
    const activeCode = codeExportMode === 'embedded' ? embeddedFramesCode : folderCode;
    const activeFileName = 'App.jsx';

    const handleDownloadFile = () => {
        if (!activeCode) return;
        downloadCodeFile(activeCode, activeFileName);
    };

    // Lệnh chạy dự án ngay lập tức sau khi tải về giải nén
    const getRunProjectCommand = () => {
        switch (packageManager) {
            case 'pnpm': return 'pnpm install && pnpm dev';
            case 'yarn': return 'yarn && yarn dev';
            case 'bun': return 'bun install && bun dev';
            case 'npm':
            default: return 'npm install && npm run dev';
        }
    };

    // Câu lệnh cài đặt phụ thuộc nếu nhúng vào dự án có sẵn
    const getDepCommand = () => {
        if (stylingFramework === 'pure-css') {
            switch (packageManager) {
                case 'pnpm': return 'pnpm add react react-dom';
                case 'yarn': return 'yarn add react react-dom';
                case 'bun': return 'bun add react react-dom';
                case 'npm':
                default: return 'npm install react react-dom';
            }
        }
        return getInstallCommand(packageManager);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Code2 className="w-5 h-5 text-emerald-400" />
                        <div>
                            <h3 className="font-bold text-white text-base sm:text-lg">Xuất Mã Nguồn React Độc Lập</h3>
                            <p className="text-xs text-slate-400">Tải file .jsx về máy ngay lập tức hoặc sao chép mã nguồn</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">

                    {/* HỘP TẢI NHANH TRỌN BỘ DỰ ÁN (CÓ SẴN THƯ MỤC src/App.jsx & public/frames/) */}
                    <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 rounded-2xl border border-cyan-500/40 space-y-2 shadow-lg shadow-cyan-950/30">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                    <Rocket className="w-5 h-5" />
                                </span>
                                <div>
                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                        Trọn Bộ Dự Án React (Có sẵn thư mục <code className="text-cyan-300 font-mono">src/App.jsx</code>)
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">1 Lệnh Chạy Ngay</span>
                                    </h4>
                                    <p className="text-[11px] text-slate-300 mt-0.5">
                                        Cấu trúc chuẩn: <code className="text-cyan-300 font-mono">package.json</code>, <code className="text-yellow-300 font-mono">public/frames/</code>, <code className="text-emerald-300 font-mono">src/App.jsx</code>, <code className="text-slate-300 font-mono">index.html</code>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onDownloadProjectZip && (
                                    <button
                                        onClick={() => onDownloadProjectZip(stylingFramework)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md shadow-cyan-500/25 shrink-0"
                                        title="Tải gói ZIP trọn bộ dự án hoàn chỉnh về máy"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Tải Dự Án ZIP (Có src/App.jsx)</span>
                                    </button>
                                )}
                                {onOpenExportZip && (
                                    <button
                                        onClick={onOpenExportZip}
                                        className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0 font-medium"
                                        title="Tùy chỉnh thông số nén và đóng gói ZIP"
                                    >
                                        Tùy chọn...
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LỰA CHỌN PHONG CÁCH CSS: THUẦN CSS VS TAILWIND CSS */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5 text-indigo-300">
                                <Palette className="w-4 h-4 text-indigo-400" />
                                Định dạng Styling cho File Code tải về:
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                {stylingFramework === 'pure-css' ? '⚡ 0 Phụ Thuộc (Zero Dependencies)' : '🎨 Dành cho dự án Tailwind'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setStylingFramework('pure-css');
                                    if (codeExportMode === 'embedded') {
                                        onGenerateEmbeddedCode(speedPreset, 'pure-css');
                                    }
                                }}
                                className={`p-2.5 rounded-xl text-left border transition ${
                                    stylingFramework === 'pure-css'
                                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-indigo-300">⚡ Thuần CSS (Pure CSS - Khuyên dùng)</span>
                                    {stylingFramework === 'pure-css' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Style được nhúng sẵn hoàn toàn trong component. Không cần cài Tailwind hay thư viện UI nào, chạy được trên mọi dự án React!
                                </p>
                            </button>

                            <button
                                onClick={() => {
                                    setStylingFramework('tailwind');
                                    if (codeExportMode === 'embedded') {
                                        onGenerateEmbeddedCode(speedPreset, 'tailwind');
                                    }
                                }}
                                className={`p-2.5 rounded-xl text-left border transition ${
                                    stylingFramework === 'tailwind'
                                        ? 'bg-cyan-600/25 border-cyan-500 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-cyan-300">🎨 Tailwind CSS</span>
                                    {stylingFramework === 'tailwind' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Sử dụng các class tiện ích Tailwind CSS (thích hợp cho các dự án Next.js, Vite đã cấu hình sẵn Tailwind).
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Box Lệnh CLI Chạy Dự Án & Cài Đặt */}
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-cyan-400" />
                                <span className="font-bold text-white text-xs">
                                    Lệnh chạy dự án sau khi tải về (1 Lệnh khởi chạy ngay):
                                </span>
                            </div>

                            {/* Package Manager Selector */}
                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                                {['npm', 'pnpm', 'yarn', 'bun'].map((pm) => (
                                    <button
                                        key={pm}
                                        onClick={() => setPackageManager(pm)}
                                        className={`px-2 py-0.5 rounded-md uppercase font-bold transition ${
                                            packageManager === pm
                                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {pm}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 1. Lệnh chạy trọn bộ dự án */}
                        <div className="flex items-center justify-between gap-3 bg-[#070b13] border border-cyan-500/30 rounded-xl px-3.5 py-2 font-mono text-xs">
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-cyan-400 font-bold select-none">$</span>
                                <span className="text-emerald-300 font-bold truncate">{getRunProjectCommand()}</span>
                                <span className="text-[10px] text-slate-500 hidden sm:inline">(Cài đặt & chạy dev server)</span>
                            </div>
                            <button
                                onClick={() => onCopyCode(getRunProjectCommand(), 'run-cmd')}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition text-[11px] font-bold active:scale-95 shrink-0"
                            >
                                {copiedTab === 'run-cmd' ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Đã copy!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy lệnh chạy</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 2. Lệnh cài phụ thuộc nếu nhúng vào dự án có sẵn */}
                        <div className="flex items-center justify-between gap-3 bg-[#070b13]/60 border border-slate-800/80 rounded-xl px-3 py-1.5 font-mono text-[11px] text-slate-400">
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-slate-500 select-none">Nhúng dự án ngoài:</span>
                                <code className="text-slate-300 truncate">$ {getDepCommand()}</code>
                            </div>
                            <button
                                onClick={() => onCopyCode(getDepCommand(), 'install-cmd')}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-sans shrink-0"
                            >
                                {copiedTab === 'install-cmd' ? 'Đã copy!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Lựa chọn Chế độ Xuất Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setCodeExportMode('embedded')}
                            className={`p-3.5 rounded-2xl text-left transition flex flex-col gap-1.5 border ${
                                codeExportMode === 'embedded'
                                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    1. Nhúng Trực Tiếp (All-in-One .jsx)
                                </span>
                                {codeExportMode === 'embedded' && <Check className="w-4 h-4 text-cyan-400" />}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Đã nạp {cachedBitmapsCount} frame vào code. Chỉ 1 file duy nhất, copy hoặc tải về là chạy ngay, không cần thư mục ảnh!
                            </p>
                        </button>

                        <button
                            onClick={() => setCodeExportMode('folder')}
                            className={`p-3.5 rounded-2xl text-left transition flex flex-col gap-1.5 border ${
                                codeExportMode === 'folder'
                                    ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                                    <FileArchive className="w-3.5 h-3.5" />
                                    2. Thư mục ảnh rời (Siêu tốc 0s)
                                </span>
                                {codeExportMode === 'folder' && <Check className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                <span className="text-emerald-400 font-semibold">Tải ngay tức thì (0.01s)</span>. Đọc ảnh từ <code className="text-yellow-400 font-mono">/public/frames/*.webp</code> (dùng kết hợp nút Xuất ZIP).
                            </p>
                        </button>
                    </div>

                    {/* Speed Presets Selector for Embedded Mode */}
                    {codeExportMode === 'embedded' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                            <div className="flex items-center gap-2 text-slate-300 font-semibold">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>Chế độ nén Base64 đa luồng:</span>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                                <button
                                    onClick={() => {
                                        setSpeedPreset('fast');
                                        onGenerateEmbeddedCode('fast', stylingFramework);
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                        speedPreset === 'fast'
                                            ? 'bg-amber-400 text-slate-950 shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    ⚡ Siêu tốc (440p)
                                </button>
                                <button
                                    onClick={() => {
                                        setSpeedPreset('balanced');
                                        onGenerateEmbeddedCode('balanced', stylingFramework);
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                        speedPreset === 'balanced'
                                            ? 'bg-cyan-500 text-slate-950 shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    🎯 Cân bằng (500p)
                                </button>
                                <button
                                    onClick={() => {
                                        setSpeedPreset('high');
                                        onGenerateEmbeddedCode('high', stylingFramework);
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                        speedPreset === 'high'
                                            ? 'bg-indigo-500 text-white shadow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    💎 Sắc nét (720p)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Code Preview & Actions Box */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#05070c]">
                        <div className="flex flex-wrap justify-between items-center px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 gap-2">
                            <span className="text-xs font-mono text-slate-400 truncate max-w-xs">
                                src/{activeFileName} ({stylingFramework === 'pure-css' ? 'Thuần CSS' : 'Tailwind'})
                            </span>

                            <div className="flex items-center gap-2">
                                {/* NÚT TẢI FILE src/App.jsx TRỰC TIẾP VỀ MÁY */}
                                <button
                                    onClick={handleDownloadFile}
                                    disabled={isGeneratingBase64 || !activeCode}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/20"
                                    title="Tải trực tiếp file App.jsx để đặt vào thư mục src/App.jsx"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Tải src/App.jsx</span>
                                </button>

                                {/* Nút Copy code */}
                                <button
                                    onClick={() => onCopyCode(activeCode, 'comp')}
                                    disabled={isGeneratingBase64 || !activeCode}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold disabled:opacity-50 border border-slate-700 active:scale-95"
                                >
                                    {copiedTab === 'comp' ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Đã copy!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Code</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Loading Base64 State */}
                        {isGeneratingBase64 ? (
                            <div className="p-10 flex flex-col items-center justify-center space-y-3">
                                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                                <p className="text-xs text-slate-300 font-mono">
                                    Đang nén đa luồng {cachedBitmapsCount} frames sang Base64 ({base64Progress}%)...
                                </p>
                                <div className="w-64 bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                    <div className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-indigo-500 rounded-full transition-all duration-75" style={{ width: `${base64Progress}%` }} />
                                </div>
                                {onCancelBase64 && (
                                    <button
                                        onClick={onCancelBase64}
                                        className="mt-2 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-xs transition active:scale-95"
                                    >
                                        Hủy tạo Base64
                                    </button>
                                )}
                            </div>
                        ) : (
                            <pre className="p-4 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[380px]">
                                {activeCode || '// Đang chuẩn bị mã nguồn...'}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 hidden sm:inline">
                        {stylingFramework === 'pure-css'
                            ? '✨ Chế độ Thuần CSS: Chạy ngay lập tức trên bất kỳ dự án React nào, không cần cài Tailwind!'
                            : '💡 Chế độ Tailwind: Yêu cầu dự án đã cài đặt Tailwind CSS.'}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition ml-auto"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
}
