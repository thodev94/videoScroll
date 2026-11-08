import React from 'react';
import { Sparkles } from 'lucide-react';
import { getPositionClasses, tagColorMap } from '../utils/helpers';

/**
 * Dynamic Story Overlays
 * Hiển thị nội dung chèn theo tiến trình scroll
 */
export default function StoryOverlay({ storyNodes, scrollProgress }) {
    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {storyNodes.map((node) => {
                const isVisible = scrollProgress >= node.startProgress && scrollProgress <= node.endProgress;
                const posClass = getPositionClasses(node.position);

                return (
                    <div
                        key={node.id}
                        className={`absolute flex flex-col transition-all duration-700 ${posClass} ${isVisible
                                ? 'opacity-100 translate-y-0 filter-none pointer-events-auto'
                                : 'opacity-0 translate-y-8 blur-md pointer-events-none'
                            }`}
                    >
                        {node.tag && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider mb-3 ${tagColorMap[node.tagColor] || tagColorMap.cyan
                                }`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{node.tag}</span>
                            </div>
                        )}

                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                            {node.title}
                        </h2>

                        {node.description && (
                            <p className="mt-3 text-sm sm:text-base text-slate-300/90 leading-relaxed backdrop-blur-md bg-black/45 p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-xl max-w-lg">
                                {node.description}
                            </p>
                        )}

                        {node.ctaText && (
                            <button className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition">
                                {node.ctaText}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

