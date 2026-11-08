import React from 'react';

/**
 * Processing Overlay
 * Hiển thị khi đang nạp frame vào RAM
 */
export default function ProcessingOverlay({ framesCount, processProgress }) {
    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-6">
            <div className="relative mb-5">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                </div>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Đang nạp {framesCount} frames vào RAM...</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-sm text-center">
                Tự động tối ưu hóa kích thước bitmap và chuẩn bị sẵn bộ nhớ đệm chống xé hình.
            </p>

            <div className="w-80 bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-150"
                    style={{ width: `${processProgress}%` }}
                />
            </div>
            <span className="text-xs font-mono text-cyan-400 mt-2 font-bold">{processProgress}%</span>
        </div>
    );
}

