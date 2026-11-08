import React, { useState } from 'react';
import { FileArchive, Download, Info, X, Check, Rocket, FolderArchive, Palette, Sparkles } from 'lucide-react';

/**
 * Modal Xuất Trọn Bộ Dự Án Web hoặc Frames dạng ZIP
 * Tự động tạo sẵn cấu trúc src/App.jsx, public/frames/, package.json, index.html
 * Tăng cường chất lượng frame tối đa (Video Gốc 2K/4K, Full HD 1080p, WebP 95% chống vỡ hình)
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
    videoMetrics,
    enableFrameBlend = false
}) {
    const [exportProjectMode, setExportProjectMode] = useState('full-project'); // 'full-project' | 'frames-only'
    const [zipFramework, setZipFramework] = useState('pure-css'); // 'pure-css' | 'tailwind'
    const [exportResolution, setExportResolution] = useState('original'); // 'original' | '1080p' | 'cached'
    const [exportFormat, setExportFormat] = useState('webp'); // 'webp' | 'png' | 'jpg'
    const [zipBlend, setZipBlend] = useState(false); // Mặc định tắt blend để hiển thị sắc nét 100% như video gốc

    const handleStartDownload = () => {
        onDownloadZip(exportProjectMode, zipFramework, exportResolution, exportQuality, zipBlend, exportFormat);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <FileArchive className="w-5 h-5 text-cyan-400" />
                        <div>
                            <h3 className="font-bold text-white text-base sm:text-lg">Xuất & Tải Dự Án Hoàn Chỉnh</h3>
                            <p className="text-xs text-slate-400">Tự động cấu hình sẵn src/App.jsx và public/frames/ độ nét cao để chạy ngay</p>
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

                <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto custom-scrollbar flex-1">

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

                    {/* LỰA CHỌN ĐỘ PHÂN GIẢI FRAME (CHỐNG MỜ & GIỮ ĐỘ SẮC NÉT TUYỆT ĐỐI) */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                Độ phân giải khung hình xuất (Tăng nét):
                            </span>
                            <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono font-bold">
                                {exportResolution === 'original' ? 'Nguyên bản Video (Siêu nét)' : exportResolution === '1080p' ? 'Full HD 1080p' : 'Theo RAM preview'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setExportResolution('original')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportResolution === 'original'
                                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-cyan-300 flex items-center justify-between">
                                    <span>🌟 Gốc từ Video</span>
                                    {exportResolution === 'original' && <Check className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {videoMetrics ? `${videoMetrics.width}x${videoMetrics.height}` : '2K/4K/Gốc'} (100% Cực nét)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportResolution('1080p')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportResolution === '1080p'
                                        ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-md shadow-indigo-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-indigo-300 flex items-center justify-between">
                                    <span>💎 Full HD</span>
                                    {exportResolution === '1080p' && <Check className="w-3 h-3 text-indigo-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    1920x1080 (Chuẩn Web sắc nét)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportResolution('cached')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportResolution === 'cached'
                                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-amber-300 flex items-center justify-between">
                                    <span>⚡ Theo RAM</span>
                                    {exportResolution === 'cached' && <Check className="w-3 h-3 text-amber-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Nhanh nhất (Theo preview)
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

                    {/* ĐỊNH DẠNG HÌNH ẢNH XUẤT: WEBP VS PNG (LOSSLESS 100%) VS JPG */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                                Định dạng ảnh khung hình:
                            </span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                                {exportFormat === 'png' ? '💎 PNG: 100% Lossless (Giống tuyệt đối Video gốc)' : exportFormat === 'jpg' ? '📸 JPG 98%' : '🌟 WebP 98% (Sắc nét cao)'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setExportFormat('webp')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportFormat === 'webp'
                                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-cyan-300 flex items-center justify-between">
                                    <span>🌟 WebP (98%)</span>
                                    {exportFormat === 'webp' && <Check className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Rất nét + Nhẹ cho Web
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportFormat('png')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportFormat === 'png'
                                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-emerald-300 flex items-center justify-between">
                                    <span>💎 PNG Lossless</span>
                                    {exportFormat === 'png' && <Check className="w-3 h-3 text-emerald-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    100% Giống hệt video gốc
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportFormat('jpg')}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                    exportFormat === 'jpg'
                                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/15'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="font-bold text-xs text-amber-300 flex items-center justify-between">
                                    <span>📸 JPG (98%)</span>
                                    {exportFormat === 'jpg' && <Check className="w-3 h-3 text-amber-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Tương thích cao
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Chế độ hiển thị: Sắc nét 100% vs Làm mượt */}
                    <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <div className="space-y-0.5 pr-2">
                            <span className="text-xs font-semibold text-slate-200 block">
                                Chế độ hiển thị khung hình trong code:
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                                {zipBlend
                                    ? '✨ Đang bật Hòa Trộn Mờ (Sub-frame Blend - Chuyển động liên tục)'
                                    : '🎯 Sắc Nét 100% Chuẩn Video (Từng frame trong veo, không bóng mờ khi dừng - KHUYÊN DÙNG)'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setZipBlend(!zipBlend)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                                zipBlend
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                            }`}
                        >
                            {zipBlend ? 'Hòa Trộn Mờ' : 'Sắc Nét Gốc 100%'}
                        </button>
                    </div>

                    {/* Chất lượng ảnh nén (Nếu không phải PNG) */}
                    {exportFormat === 'png' ? (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Định dạng PNG là Lossless 100% (Không nén suy hao) — Từng pixel, viền chi tiết và màu sắc bảo toàn 100% như video gốc bạn tải lên!</span>
                        </div>
                    ) : (
                        <div className="space-y-1.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-300 font-medium">Chất lượng ảnh nén ({exportFormat.toUpperCase()} Quality):</span>
                                <span className="text-cyan-400 font-mono font-bold bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                                    {Math.round(exportQuality * 100)}% {exportQuality >= 0.95 ? '🔥 Siêu nét cực đại' : '⚡ Chuẩn nét'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.80"
                                max="1"
                                step="0.02"
                                value={exportQuality}
                                onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                                disabled={isZipping}
                                className="w-full accent-cyan-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>80%</span>
                                <span className="text-cyan-400 font-bold">98% (Chuẩn Studio)</span>
                                <span>100% (Cao nhất)</span>
                            </div>
                        </div>
                    )}

                    {/* Loading State or Instruction Note */}
                    {isZipping ? (
                        <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3 shadow-lg">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-300 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                    Đang trích xuất frame độ nét cao & đóng gói dự án (.zip)...
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
                                    ? <span>Sau khi tải về, bạn chỉ cần giải nén thư mục và mở terminal gõ: <code className="text-emerald-400 font-mono font-bold">npm install && npm run dev</code> là dự án chạy ngay lập tức với chất lượng sắc nét 100%!</span>
                                    : <span>Giải nén thư mục <code className="text-cyan-300 font-mono">frames/</code> vào thư mục <code className="text-yellow-400 font-mono">public/</code> của dự án Next.js hoặc Vite của bạn.</span>}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3 shrink-0">
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
                                ? 'Đang xuất độ nét cao...'
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
