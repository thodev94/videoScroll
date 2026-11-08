import React from 'react';
import { X, Zap, ShieldCheck } from 'lucide-react';

/**
 * Processing Overlay
 * Hiển thị khi đang nạp frame từ video source vào RAM, kèm thông số RAM và nút HỦY nạp
 */
export default function ProcessingOverlay({ framesCount, processProgress, onCancel, currentRamEstimate }) {
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
                Đang nạp {framesCount} frames vào RAM...
            </h3>

            {/* RAM Safety Status Badge */}
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Bộ nhớ ước tính:</span>
                <span className={`font-mono font-bold ${currentRamEstimate?.colorClass || 'text-emerald-400'}`}>
                    ~{currentRamEstimate?.mb || 400} MB ({currentRamEstimate?.safetyLabel || 'An toàn 🟢'})
                </span>
            </div>

            <p className="text-xs text-slate-400 mb-5 max-w-md leading-relaxed">
                Đã tối ưu hóa thuật toán nạp đa tầng: <span className="text-cyan-300 font-semibold">Tăng tốc độ 3X</span>, <span className="text-emerald-300 font-semibold">chống xé hình & không bị bể</span>, tự động giải phóng bộ nhớ cũ để <span className="text-amber-300 font-semibold">ngăn chặn sập nguồn do đầy RAM</span>.
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
