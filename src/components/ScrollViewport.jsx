import React from 'react';
import StoryOverlay from './StoryOverlay';
import PerformanceHUD from './PerformanceHUD';
import ProcessingOverlay from './ProcessingOverlay';
import ScrollHint from './ScrollHint';

/**
 * ScrollViewport
 * Khu vực chính: sticky fullscreen player với canvas, story overlay, HUD
 */
export default function ScrollViewport({
    containerRef,
    viewportRef,
    canvasRef,
    isProcessing,
    framesCount,
    processProgress,
    storyNodes,
    scrollProgress,
    cachedBitmapsCount,
    fps,
    motionVelocity,
    enableFrameBlend,
}) {
    return (
        <main ref={containerRef} className="relative w-full h-[550vh]">

            {/* Sticky Fullscreen Player */}
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black perspective-[1200px]">

                {/* Dynamic Ambient Background Glow */}
                <div className="absolute w-[60vw] h-[60vw] rounded-full bg-cyan-500/15 filter blur-[120px] pointer-events-none -top-20 -left-20" />
                <div className="absolute w-[60vw] h-[60vw] rounded-full bg-indigo-500/15 filter blur-[120px] pointer-events-none -bottom-20 -right-20" />

                {/* Viewport Container với hiệu ứng Cinematic Parallax Zoom & Blur */}
                <div
                    ref={viewportRef}
                    className="relative w-full h-full flex items-center justify-center transition-all duration-75 ease-out will-change-transform"
                >
                    {/* HTML5 Canvas làm bề mặt render chính */}
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover select-none pointer-events-none filter drop-shadow-2xl"
                    />
                </div>

                {/* Processing RAM Frame Modal */}
                {isProcessing && (
                    <ProcessingOverlay
                        framesCount={framesCount}
                        processProgress={processProgress}
                    />
                )}

                {/* Gradient điện ảnh tạo chiều sâu */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c]/70 pointer-events-none" />

                {/* Dynamic Story Overlays */}
                <StoryOverlay
                    storyNodes={storyNodes}
                    scrollProgress={scrollProgress}
                />

                {/* Realtime Performance HUD */}
                <PerformanceHUD
                    scrollProgress={scrollProgress}
                    cachedBitmapsCount={cachedBitmapsCount}
                    fps={fps}
                    motionVelocity={motionVelocity}
                    enableFrameBlend={enableFrameBlend}
                />

                {/* Scroll Hint */}
                <ScrollHint scrollProgress={scrollProgress} />

            </div>
        </main>
    );
}

