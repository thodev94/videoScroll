import React, { useState } from 'react';
import { FileArchive, Download, Info, X, Check, Rocket, FolderArchive, Palette } from 'lucide-react';

/**
 * Modal Xuất Trọn Bộ Dự Án Web hoặc Frames dạng ZIP
 * Tự động tạo sẵn cấu trúc src/App.jsx, public/frames/, package.json, index.html
 * Người dùng tải về chỉ cần chạy lệnh `npm install && npm run dev` là chạy ngay!
 */
export default function ExportZipModal({
    cachedBitmapsCount,
    exportQuality,
    setExportQuality,
    isZipping,
    zipProgress,
    onDownloadZip,
    onCancelZip,
    onClose,
}) {
    const [exportProjectMode, setExportProjectMode] = useState('full-project'); // 'full-project' | 'frames-only'
    const [zipFramework, setZipFramework] = useState('pure-css'); // 'pure-css' | 'tailwind'

    const handleStartDownload = () => {
        onDownloadZip(exportProjectMode, zipFramework);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">

                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FileArchive className="w-5 h-5 text-cyan-400" />
                        <div>
                            <h3 className="font-bold text-white text-base sm:text-lg">Xuất & Tải Dự Án Hoàn Chỉnh</h3>
                            <p className="text-xs text-slate-400">Tự động cấu hình sẵn src/App.jsx và public/frames/ để chạy ngay</p>
                        </div>
                    </div>
                    <button
                        onClick={isZipping ? onCancelZip : onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                        title={isZipping ? 'Hủy tải và đóng' : 'Đóng'}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">

                    {/* LỰA CHỌN: TRỌN BỘ DỰ ÁN (CÓ src/App.jsx) VS CHỈ THƯ MỤC FRAMES */}
                    <div className="space-y-2">
                        <label className="text-slate-300 font-semibold block text-xs">Cấu trúc gói tải về:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setExportProjectMode('full-project')}
                                className={`p-3 rounded-2xl text-left border transition ${
                                    exportProjectMode === 'full-project'
                                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                                        <Rocket className="w-3.5 h-3.5" />
                                        1. Trọn bộ Dự Án (Khuyên dùng)
                                    </span>
                                    {exportProjectMode === 'full-project' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Có sẵn thư mục <code className="text-cyan-300 font-mono">src/App.jsx</code>, <code className="text-yellow-300 font-mono">public/frames/</code>, <code className="text-slate-300 font-mono">package.json</code>.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportProjectMode('frames-only')}
                                className={`p-3 rounded-2xl text-left border transition ${
                                    exportProjectMode === 'frames-only'
                                        ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                                        <FolderArchive className="w-3.5 h-3.5" />
                                        2. Chỉ thư mục frames/
                                    </span>
                                    {exportProjectMode === 'frames-only' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Chỉ chứa các file ảnh WebP cho ai đã có sẵn dự án React.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* LỰA CHỌN CSS KHI TẢI TRỌN BỘ DỰ ÁN */}
                    {exportProjectMode === 'full-project' && (
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                                Định dạng CSS cho file src/App.jsx:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setZipFramework('pure-css')}
                                    className={`py-1.5 px-2.5 rounded-lg font-semibold text-center border transition ${
                                        zipFramework === 'pure-css'
                                            ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300'
                                            : 'bg-slate-900 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    ⚡ Thuần CSS (0 Phụ thuộc)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZipFramework('tailwind')}
                                    className={`py-1.5 px-2.5 rounded-lg font-semibold text-center border transition ${
                                        zipFramework === 'tailwind'
                                            ? 'bg-cyan-500/25 border-cyan-500 text-cyan-300'
                                            : 'bg-slate-900 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    🎨 Tailwind CSS
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Thông tin số frame & định dạng */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-medium">Tổng số Frame:</label>
                            <input
                                type="text"
                                disabled
                                value={`${cachedBitmapsCount} frames`}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs font-medium">Định dạng nén:</label>
                            <input
                                type="text"
                                disabled
                                value="WebP (Tối ưu cực nhẹ)"
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-cyan-400 font-semibold text-xs"
                            />
                        </div>
                    </div>

                    {/* Chất lượng ảnh nén */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-400">
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

                    {/* Loading State or Instruction Note */}
                    {isZipping ? (
                        <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3 shadow-lg">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-300 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                    Đang đóng gói cấu trúc dự án (.zip)...
                                </span>
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
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                {exportProjectMode === 'full-project'
                                    ? <span>Sau khi tải về, bạn chỉ cần giải nén thư mục và mở terminal gõ: <code className="text-emerald-400 font-mono font-bold">npm install && npm run dev</code> là dự án chạy ngay lập tức!</span>
                                    : <span>Giải nén thư mục <code className="text-cyan-300 font-mono">frames/</code> vào thư mục <code className="text-yellow-400 font-mono">public/</code> của dự án Next.js hoặc Vite của bạn.</span>}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
                    {isZipping ? (
                        <button
                            onClick={onCancelZip}
                            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-red-950/40"
                        >
                            <X className="w-3.5 h-3.5 text-red-400" />
                            <span>Hủy đóng gói</span>
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
                        >
                            Đóng
                        </button>
                    )}

                    <button
                        onClick={handleStartDownload}
                        disabled={isZipping || cachedBitmapsCount === 0}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                            {isZipping
                                ? 'Đang tạo gói...'
                                : exportProjectMode === 'full-project'
                                ? 'Tải Trọn Bộ Dự Án .ZIP (Có src/App.jsx)'
                                : 'Tải Thư Mục Frames .ZIP'}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
}
