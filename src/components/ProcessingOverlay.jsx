import React from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * Processing Overlay
 * Hiển thị khi đang nạp frame từ video source vào RAM, kèm nút HỦY nạp
 */
export default function ProcessingOverlay({ framesCount, processProgress, onCancel }) {
    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">

            {/* Spinner */}
            <div className="relative mb-5">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                Đang tải & nạp {framesCount} frames vào RAM...
            </h3>

            <p className="text-xs text-slate-400 mb-5 max-w-sm leading-relaxed">
                Hệ thống đang trích xuất chuỗi frame từ video nguồn, tự động điều chỉnh tỷ lệ và nạp bộ nhớ đệm chống xé hình.
            </p>

            {/* Progress Bar */}
            <div className="w-72 sm:w-80 bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-150"
                    style={{ width: `${processProgress}%` }}
                />
            </div>

            <span className="text-xs font-mono text-cyan-400 mt-2 font-bold">{processProgress}%</span>

            {/* Nút Hủy tải / nạp source */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 border border-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-2 active:scale-95 shadow-xl shadow-black/50"
                    title="Dừng và hủy bỏ quá trình nạp frame hiện tại"
                >
                    <X className="w-4 h-4 text-red-400" />
                    <span>Hủy tải source</span>
                </button>
            )}

        </div>
    );
}
