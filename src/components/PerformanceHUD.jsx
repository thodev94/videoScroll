import React from 'react';

/**
 * Realtime Performance HUD
 * Bảng hiển thị thông số hiệu năng thời gian thực
 */
export default function PerformanceHUD({
    scrollProgress,
    cachedBitmapsCount,
    fps,
    motionVelocity,
    enableFrameBlend,
}) {
    return (
        <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
            <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] text-xs font-mono space-y-2.5">
                <div className="flex justify-between items-center text-slate-400">
                    <span>Tiến trình</span>
                    <span className="text-cyan-400 font-bold text-sm">{Math.round(scrollProgress * 100)}%</span>
                </div>

                <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                        style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Frame RAM</span>
                    <span className="text-white font-bold">
                        {(scrollProgress * (cachedBitmapsCount - 1)).toFixed(1)} / {cachedBitmapsCount}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tốc độ làm tươi</span>
                    <span className="text-emerald-400 font-bold">~{fps} FPS</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vận tốc cuộn</span>
                    <span className="text-purple-400 font-semibold">{motionVelocity} px/s</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-500">Sub-frame Blend</span>
                    <span className={enableFrameBlend ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                        {enableFrameBlend ? 'BẬT (Siêu mịn)' : 'TẮT'}
                    </span>
                </div>
            </div>
        </div>
    );
}

