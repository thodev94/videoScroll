import React from 'react';
import {
    Upload,
    Layers,
    Zap,
    Sparkles,
    Code2,
    Download,
    Type
} from 'lucide-react';

/**
 * Floating Header Toolbar
 * Thanh công cụ nổi chứa các nút điều khiển chính
 */
export default function Header({
    videoName,
    enableFrameBlend,
    setEnableFrameBlend,
    framesCount,
    setFramesCount,
    isProcessing,
    extractFrames,
    videoRef,
    storyNodesCount,
    onUploadFile,
    onOpenContentManager,
    onOpenExportCode,
    onOpenExportZip,
}) {
    return (
        <header className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
            <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 sm:px-6 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Zap className="w-5 h-5 text-slate-950 font-bold" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                                Ultra-Smooth Scrub Pro
                            </h1>
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-2 py-0.5 rounded-full">
                                120Hz Ready
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">{videoName}</p>
                    </div>
                </div>

                {/* Quick Smooth Toggles & Controls */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

                    {/* Toggle Sub-frame Blending */}
                    <button
                        onClick={() => setEnableFrameBlend(!enableFrameBlend)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${enableFrameBlend
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                        title="Hòa trộn mờ giữa 2 frame giúp loại bỏ hoàn toàn độ giật khi cuộn chậm"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Frame Blending</span>
                    </button>

                    {/* Frame Density Selector */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-400">Frames:</span>
                        <select
                            value={framesCount}
                            onChange={(e) => {
                                const count = Number(e.target.value);
                                setFramesCount(count);
                                if (videoRef.current) extractFrames(videoRef.current, count);
                            }}
                            disabled={isProcessing}
                            className="bg-slate-900 text-cyan-300 font-bold rounded-lg px-2 py-0.5 outline-none cursor-pointer border border-slate-700 focus:border-cyan-500"
                        >
                            <option value={120}>120 frames</option>
                            <option value={200}>200 frames (Rất mượt)</option>
                            <option value={280}>280 frames (Cinematic)</option>
                            <option value={360}>360 frames (Ultra 120fps)</option>
                        </select>
                    </div>

                    {/* Upload Video Button */}
                    <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 active:scale-95">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Thay Video</span>
                        <span className="sm:hidden">Đổi clip</span>
                        <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onUploadFile} className="hidden" />
                    </label>

                    {/* Content Manager Button */}
                    <button
                        onClick={onOpenContentManager}
                        className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 transition flex items-center gap-1.5 border border-indigo-400/50 text-white active:scale-95 shadow-md shadow-indigo-600/20"
                    >
                        <Type className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Chèn Content ({storyNodesCount})</span>
                    </button>

                    {/* Code Export Button */}
                    <button
                        onClick={onOpenExportCode}
                        className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 text-slate-200 active:scale-95"
                    >
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lấy Code</span>
                    </button>

                    {/* ZIP Export Button */}
                    <button
                        onClick={onOpenExportZip}
                        className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 transition flex items-center gap-1.5 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5 text-slate-950" />
                        <span>Xuất Frame</span>
                    </button>

                </div>
            </div>
        </header>
    );
}

