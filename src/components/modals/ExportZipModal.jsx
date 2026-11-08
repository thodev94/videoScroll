import React from 'react';
import { FileArchive, Download, Info, X } from 'lucide-react';

/**
 * Modal Xuất Trọn Bộ Frames dạng ZIP
 * Tích hợp nút HỦY khi đang nén và tải gói ZIP
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">

                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FileArchive className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-white text-base sm:text-lg">Xuất & Tải Gói Frame Nén</h3>
                    </div>
                    <button
                        onClick={isZipping ? onCancelZip : onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                        title={isZipping ? 'Hủy tải và đóng' : 'Đóng'}
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
                                value={`${cachedBitmapsCount} frames`}
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
                        <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3 shadow-lg">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-300 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                    Đang nén & đóng gói ZIP...
                                </span>
                                <span className="text-cyan-400 font-bold">{zipProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-100"
                                    style={{ width: `${zipProgress}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Bạn có thể hủy bỏ tiến trình nén bất kỳ lúc nào bằng nút "Hủy tải" bên dưới.
                            </p>
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
                        onClick={onDownloadZip}
                        disabled={isZipping || cachedBitmapsCount === 0}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isZipping ? 'Đang xuất ZIP...' : 'Tải File ZIP Ngay'}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
