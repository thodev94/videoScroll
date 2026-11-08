import React from 'react';
import {
    Code2,
    Terminal,
    Check,
    Copy,
    Sparkles,
    FileArchive,
} from 'lucide-react';
import { getInstallCommand, getQuickInitCommand } from '../../utils/helpers';

/**
 * Modal Xuất Code React
 */
export default function ExportCodeModal({
    codeExportMode,
    setCodeExportMode,
    packageManager,
    setPackageManager,
    copiedTab,
    onCopyCode,
    isGeneratingBase64,
    base64Progress,
    embeddedFramesCode,
    reactComponentCode,
    cachedBitmapsCount,
    onGenerateEmbeddedCode,
    onClose,
}) {
    return (
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
                        onClick={onClose}
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
                                <span className="text-emerald-300 font-semibold truncate">{getInstallCommand(packageManager)}</span>
                            </div>
                            <button
                                onClick={() => onCopyCode(getInstallCommand(packageManager), 'install-cmd')}
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
                                onClick={() => onCopyCode(getQuickInitCommand(packageManager), 'init-cmd')}
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
                                        onClick={onGenerateEmbeddedCode}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                    >
                                        Tạo lại Base64
                                    </button>
                                )}
                                <button
                                    onClick={() => onCopyCode(codeExportMode === 'embedded' ? embeddedFramesCode : reactComponentCode, 'comp')}
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
                                <p className="text-xs text-slate-300 font-mono">Đang đóng gói dữ liệu {cachedBitmapsCount} frame sang Base64 ({base64Progress}%)...</p>
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
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
}

