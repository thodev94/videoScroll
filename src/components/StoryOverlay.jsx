import React from 'react';
import { Sparkles } from 'lucide-react';
import { getPositionClasses, tagColorMap } from '../utils/helpers';

/**
 * Dynamic Story Overlays - Fully Responsive & Custom Code Support
 * Hỗ trợ hiển thị cả nội dung chuẩn (Tiêu đề, mô tả) lẫn nội dung Custom JSX / HTML & CSS
 */
export default function StoryOverlay({ storyNodes, scrollProgress }) {
    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {storyNodes.map((node) => {
                const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
                const posClass = getPositionClasses(node.position);

                return (
                    <div
                        key={node.id}
                        className={`absolute flex flex-col transition-all duration-700 px-3 sm:px-0 ${posClass} ${
                            isVisible
                                ? 'opacity-100 translate-y-0 filter-none pointer-events-auto'
                                : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                        }`}
                    >
                        {/* Custom CSS Scoped nếu có */}
                        {node.contentType === 'custom' && node.customCss && (
                            <style>{node.customCss}</style>
                        )}

                        {/* Render Custom HTML/JSX hoặc Standard Typography */}
                        {node.contentType === 'custom' ? (
                            <div
                                className="custom-story-container"
                                dangerouslySetInnerHTML={{
                                    __html: node.customHtml || '<div style="padding:16px;background:rgba(0,0,0,0.6);border-radius:12px;border:1px dashed #38bdf8;color:#38bdf8;">Chưa có mã JSX/HTML tùy chỉnh</div>'
                                }}
                            />
                        ) : (
                            <>
                                {node.tag && (
                                    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3 shrink-0 ${
                                        tagColorMap[node.tagColor] || tagColorMap.cyan
                                    }`}>
                                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{node.tag}</span>
                                    </div>
                                )}

                                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                                    {node.title}
                                </h2>

                                {node.description && (
                                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-300/90 leading-relaxed backdrop-blur-md bg-black/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-xl max-w-sm sm:max-w-lg">
                                        {node.description}
                                    </p>
                                )}

                                {node.ctaText && (
                                    <button className="mt-3 sm:mt-4 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition">
                                        {node.ctaText}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
