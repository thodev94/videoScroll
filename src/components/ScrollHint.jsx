import React from 'react';

/**
 * Scroll Hint
 * Gợi ý cuộn trang, ẩn đi khi người dùng bắt đầu cuộn
 */
export default function ScrollHint({ scrollProgress }) {
    return (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-all duration-500 ${scrollProgress > 0.04 ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Cuộn để xem story content</span>
            <div className="w-5 h-9 rounded-full border-2 border-cyan-400/60 flex justify-center p-1 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
            </div>
        </div>
    );
}

