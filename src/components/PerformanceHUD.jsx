import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Gauge, Activity, Ratio } from 'lucide-react';

/**
 * Realtime Performance HUD - Responsive & Aspect Ratio Info
 * Bảng hiển thị thông số hiệu năng và tỷ lệ màn hình thời gian thực
 */
export default function PerformanceHUD({
    scrollProgress,
    cachedBitmapsCount,
    fps,
    motionVelocity,
    enableFrameBlend,
    videoMetrics,
    screenMetrics,
    renderFitMode,
    currentRamEstimate,
}) {
    // Tự động thu gọn trên màn hình nhỏ để tránh che khuất video
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 640;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setIsCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Giao diện thu gọn (Compact Pill)
    if (isCollapsed) {
        return (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-auto">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition active:scale-95"
                    title="Nhấn để mở rộng bảng thông số hiệu năng & tỷ lệ"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-bold">{fps} FPS</span>
                    <span className="text-slate-600">|</span>
                    <span className={`font-bold ${currentRamEstimate?.colorClass || 'text-cyan-400'}`}>
                        ~{currentRamEstimate?.mb || 400}MB
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-cyan-400 font-bold">{Math.round(scrollProgress * 100)}%</span>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </button>
            </div>
        );
    }

    // Giao diện mở rộng đầy đủ (Full HUD)
    return (
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-auto">
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-2xl w-[220px] sm:w-[240px] text-xs font-mono space-y-2 animate-fade-in">

                        {/* Header HUD + Nút thu nhỏ */}
                        <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-800">
                            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-slate-300">
                                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Chỉ số Realtime</span>
                            </div>
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                                title="Thu gọn HUD"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Scroll Progress Bar */}
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Tiến trình cuộn</span>
                            <span className="text-cyan-400 font-bold text-sm">{Math.round(scrollProgress * 100)}%</span>
                        </div>

                            <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                                />
                            </div>

                                {/* Frames in RAM */}
                                <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-slate-400">Frame RAM</span>
                                    <span className="text-white font-bold">
                                        {(scrollProgress * (cachedBitmapsCount - 1)).toFixed(1)} / {cachedBitmapsCount}
                                    </span>
                                </div>

                                {/* RAM Footprint & Safety */}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Dung lượng RAM</span>
                                    <span className={`font-bold ${currentRamEstimate?.colorClass || 'text-emerald-400'}`}>
                                        ~{currentRamEstimate?.mb || 400} MB
                                    </span>
                                </div>

                                {/* FPS */}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Tần số quét</span>
                                    <span className="text-emerald-400 font-bold">~{fps} FPS</span>
                                </div>

                                {/* Vận tốc cuộn */}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Vận tốc cuộn</span>
                                    <span className="text-purple-400 font-semibold">{motionVelocity} px/s</span>
                                </div>

                                {/* Tỷ lệ Video vs Màn hình */}
                                {videoMetrics && (
                                    <div className="pt-1.5 border-t border-slate-800 text-[11px] space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Video Ratio</span>
                                            <span className="text-cyan-300 font-semibold">{videoMetrics.ratioString}</span>
                                        </div>
                                        {screenMetrics && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Màn hình</span>
                                                <span className="text-indigo-300 font-semibold">
                                                    {screenMetrics.ratioString} ({screenMetrics.width}px)
                                                </span>
                                            </div>
                                        )}
                                        {renderFitMode && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Chế độ Fit</span>
                                                <span className="text-amber-300 font-semibold uppercase">{renderFitMode}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Blend Status */}
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
