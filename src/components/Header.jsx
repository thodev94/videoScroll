import React, { useState } from 'react';
import {
    Upload,
    Layers,
    Zap,
    Sparkles,
    Code2,
    Download,
    Type,
    Maximize2,
    Minimize2,
    Monitor,
    Smartphone,
    Menu,
    X,
    Compass
} from 'lucide-react';

/**
 * Floating Header Toolbar - Responsive & Ratio Detection
 * Tích hợp tính năng phát hiện tỷ lệ khung hình video vs màn hình
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
    // Ratio & Screen props
    videoMetrics,
    screenMetrics,
    aspectComparison,
    renderFitMode = 'adaptive',
    setRenderFitMode,
    // RAM Optimization props
    ramProfile = 'balanced',
    onRamProfileChange,
    currentRamEstimate,
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Chu kỳ chuyển chế độ hiển thị nhanh: adaptive -> cover -> contain
    const cycleFitMode = () => {
        if (!setRenderFitMode) return;
        if (renderFitMode === 'adaptive') setRenderFitMode('cover');
        else if (renderFitMode === 'cover') setRenderFitMode('contain');
        else setRenderFitMode('adaptive');
    };

    const getFitModeLabel = (mode) => {
        switch (mode) {
            case 'cover': return 'Cover (Tràn)';
            case 'contain': return 'Contain (Fit)';
            case 'adaptive':
            default: return 'Adaptive (Auto)';
        }
    };

    return (
        <header className="fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50 max-w-7xl mx-auto">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-3 sm:px-5 py-2.5 shadow-2xl transition-all">

                {/* Main Navigation Bar */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">

                    {/* Left: Branding & Ratio Badge */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-bold" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent truncate">
                                    Ultra-Smooth Scrub Pro
                                </h1>
                                <span className="hidden xl:inline-block text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-1.5 py-0.5 rounded-full">
                                    120Hz
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-xs">{videoName}</p>
                        </div>
                    </div>

                    {/* Center: Live Ratio Detector Indicator (Desktop & Tablet) */}
                    <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-400" title="Độ phân giải và tỷ lệ video gốc">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="font-semibold text-slate-300">Video:</span>
                            <span className="text-cyan-300 font-mono font-bold">
                                {videoMetrics ? `${videoMetrics.width}x${videoMetrics.height} (${videoMetrics.ratioString})` : '16:9'}
                            </span>
                        </div>

                        <span className="text-slate-600">⇄</span>

                        <div className="flex items-center gap-1 text-slate-400" title="Độ phân giải màn hình hiển thị">
                            {screenMetrics?.isMobile ? (
                                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            <span className="font-semibold text-slate-300">Màn hình:</span>
                            <span className="text-indigo-300 font-mono font-bold">
                                {screenMetrics ? `${screenMetrics.width}x${screenMetrics.height} (${screenMetrics.ratioString})` : '16:9'}
                            </span>
                        </div>

                        {aspectComparison && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ml-1 ${aspectComparison.status === 'perfect'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : aspectComparison.status === 'good'
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                }`} title={aspectComparison.message}>
                                {aspectComparison.matchScore}% Khớp
                            </span>
                        )}
                    </div>

                    {/* Right: Quick Fit Mode & Desktop Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">

                        {/* Render Fit Mode Segmented Selector (Desktop) */}
                        <div className="hidden xl:flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-[11px]">
                            <button
                                onClick={() => setRenderFitMode && setRenderFitMode('adaptive')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${renderFitMode === 'adaptive'
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Tự động phát hiện hướng video & màn hình để chọn cách hiển thị đẹp nhất"
                            >
                                Adaptive
                            </button>
                            <button
                                onClick={() => setRenderFitMode && setRenderFitMode('cover')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${renderFitMode === 'cover'
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Tràn viền toàn màn hình (Cinematic Cover)"
                            >
                                Cover
                            </button>
                            <button
                                onClick={() => setRenderFitMode && setRenderFitMode('contain')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${renderFitMode === 'contain'
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Giữ nguyên tỷ lệ trọn vẹn kèm hiệu ứng Ambient Glow"
                            >
                                Contain
                            </button>
                        </div>

                        {/* Quick Fit Mode Button (Mobile/Tablet) */}
                        <button
                            onClick={cycleFitMode}
                            className="xl:hidden text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 flex items-center gap-1 active:scale-95"
                            title="Chạm để chuyển đổi chế độ hiển thị: Adaptive / Cover / Contain"
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-mono">{getFitModeLabel(renderFitMode)}</span>
                        </button>

                        {/* Desktop Controls */}
                        <div className="hidden lg:flex items-center gap-2">

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
                                <span>Blend</span>
                            </button>

                            {/* RAM Profile Selector (Eco / Balanced / High) */}
                            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <select
                                    value={ramProfile}
                                    onChange={(e) => onRamProfileChange && onRamProfileChange(e.target.value)}
                                    disabled={isProcessing}
                                    className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer text-xs"
                                    title="Chế độ tối ưu hóa RAM: Tiết kiệm RAM 50% chống tràn, Cân bằng chuẩn nét, hoặc Cao"
                                >
                                    <option value="eco" className="bg-slate-900">⚡ Tiết kiệm RAM (960p)</option>
                                    <option value="balanced" className="bg-slate-900">🎯 Cân bằng (1152p)</option>
                                    <option value="high" className="bg-slate-900">💎 Độ nét cao (1280p)</option>
                                </select>
                            </div>

                            {/* Frame Density Selector kèm ước tính RAM */}
                            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                <select
                                    value={framesCount}
                                    onChange={(e) => {
                                        const count = Number(e.target.value);
                                        setFramesCount(count);
                                        if (videoRef.current) extractFrames(videoRef.current, count, ramProfile);
                                    }}
                                    disabled={isProcessing}
                                    className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer text-xs"
                                >
                                    <option value={200} className="bg-slate-900">200 frames (~{ramProfile === 'eco' ? '410' : ramProfile === 'high' ? '730' : '470'}MB)</option>
                                    <option value={360} className="bg-slate-900">360 frames (~{ramProfile === 'eco' ? '740' : ramProfile === 'high' ? '1.3GB' : '850'}MB)</option>
                                    <option value={540} className="bg-slate-900">540 frames (~{ramProfile === 'eco' ? '1.1GB' : ramProfile === 'high' ? '2.0GB' : '1.3GB'})</option>
                                    <option value={680} className="bg-slate-900">680 frames (~{ramProfile === 'eco' ? '1.4GB' : ramProfile === 'high' ? '2.5GB' : '1.6GB'})</option>
                                </select>
                            </div>

                            {/* Upload Video Button */}
                            <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 active:scale-95">
                                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Đổi clip</span>
                                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onUploadFile} className="hidden" />
                            </label>

                            {/* Content Manager Button */}
                            <button
                                onClick={onOpenContentManager}
                                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 transition flex items-center gap-1.5 border border-indigo-400/50 text-white active:scale-95 shadow-md shadow-indigo-600/20"
                            >
                                <Type className="w-3.5 h-3.5 text-indigo-300" />
                                <span>Story ({storyNodesCount})</span>
                            </button>

                            {/* Code Export Button */}
                            <button
                                onClick={onOpenExportCode}
                                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700 text-slate-200 active:scale-95"
                            >
                                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Code</span>
                            </button>

                            {/* ZIP Export Button */}
                            <button
                                onClick={onOpenExportZip}
                                className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 transition flex items-center gap-1.5 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 active:scale-95"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-950" />
                                <span>ZIP</span>
                            </button>

                        </div>

                        {/* Mobile Hamburger Menu Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                            aria-label="Toggle Navigation Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                    </div>

                </div>

                {/* Mobile / Tablet Expandable Sheet */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in text-xs">

                        {/* Ratio Info Bar */}
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Tỷ lệ Video:</span>
                                <span className="text-cyan-300 font-mono font-bold">
                                    {videoMetrics ? `${videoMetrics.width}x${videoMetrics.height} (${videoMetrics.ratioString})` : '16:9'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Màn hình:</span>
                                <span className="text-indigo-300 font-mono font-bold">
                                    {screenMetrics ? `${screenMetrics.width}x${screenMetrics.height} (${screenMetrics.ratioString})` : '16:9'}
                                </span>
                            </div>
                            {aspectComparison && (
                                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                                    {aspectComparison.message}
                                </div>
                            )}
                        </div>

                        {/* Render Fit Mode Selector in Mobile Drawer */}
                        <div>
                            <span className="text-slate-400 block mb-1.5">Chế độ hiển thị khung hình:</span>
                            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => setRenderFitMode && setRenderFitMode('adaptive')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${renderFitMode === 'adaptive' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                        }`}
                                >
                                    Adaptive
                                </button>
                                <button
                                    onClick={() => setRenderFitMode && setRenderFitMode('cover')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${renderFitMode === 'cover' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                        }`}
                                >
                                    Cover
                                </button>
                                <button
                                    onClick={() => setRenderFitMode && setRenderFitMode('contain')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${renderFitMode === 'contain' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                        }`}
                                >
                                    Contain
                                </button>
                            </div>
                        </div>

                        {/* RAM Profile in Mobile Drawer */}
                        <div>
                            <span className="text-slate-400 block mb-1.5 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                Tối ưu RAM (Chống tràn & sập nguồn):
                            </span>
                            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                                <button
                                    onClick={() => onRamProfileChange && onRamProfileChange('eco')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${ramProfile === 'eco' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'}`}
                                >
                                    ⚡ Tiết kiệm
                                </button>
                                <button
                                    onClick={() => onRamProfileChange && onRamProfileChange('balanced')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${ramProfile === 'balanced' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                                >
                                    🎯 Cân bằng
                                </button>
                                <button
                                    onClick={() => onRamProfileChange && onRamProfileChange('high')}
                                    className={`py-1.5 rounded-lg font-semibold text-center transition ${ramProfile === 'high' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400'}`}
                                >
                                    💎 Cao
                                </button>
                            </div>
                        </div>

                        {/* Quick Controls Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setEnableFrameBlend(!enableFrameBlend)}
                                className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 ${enableFrameBlend
                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Blend: {enableFrameBlend ? 'BẬT' : 'TẮT'}</span>
                            </button>

                            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                                <span className="text-slate-400">Frames:</span>
                                <select
                                    value={framesCount}
                                    onChange={(e) => {
                                        const count = Number(e.target.value);
                                        setFramesCount(count);
                                        if (videoRef.current) extractFrames(videoRef.current, count, ramProfile);
                                    }}
                                    disabled={isProcessing}
                                    className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer"
                                >
                                    <option value={200} className="bg-slate-900">200 (~{ramProfile === 'eco' ? '410' : ramProfile === 'high' ? '730' : '470'}MB)</option>
                                    <option value={360} className="bg-slate-900">360 (~{ramProfile === 'eco' ? '740' : ramProfile === 'high' ? '1.3GB' : '850'}MB)</option>
                                    <option value={540} className="bg-slate-900">540 (~{ramProfile === 'eco' ? '1.1GB' : ramProfile === 'high' ? '2.0GB' : '1.3GB'})</option>
                                    <option value={680} className="bg-slate-900">680 (~{ramProfile === 'eco' ? '1.4GB' : ramProfile === 'high' ? '2.5GB' : '1.6GB'})</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <label className="cursor-pointer text-xs font-semibold p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center flex items-center justify-center gap-1.5 border border-slate-700">
                                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Đổi clip</span>
                                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onUploadFile} className="hidden" />
                            </label>

                            <button
                                onClick={() => {
                                    onOpenContentManager();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="text-xs font-semibold p-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 flex items-center justify-center gap-1.5 border border-indigo-400/50 text-white"
                            >
                                <Type className="w-3.5 h-3.5 text-indigo-300" />
                                <span>Story ({storyNodesCount})</span>
                            </button>

                            <button
                                onClick={() => {
                                    onOpenExportCode();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="text-xs font-semibold p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-1.5 border border-slate-700 text-slate-200"
                            >
                                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Lấy Code</span>
                            </button>

                            <button
                                onClick={() => {
                                    onOpenExportZip();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="text-xs font-semibold p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-950" />
                                <span>Xuất ZIP</span>
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </header>
    );
}
