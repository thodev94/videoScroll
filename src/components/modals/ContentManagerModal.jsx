import React, { useRef, useEffect } from 'react';
import { Type, Plus, Trash2, Code2, Sparkles, SlidersHorizontal, Check, Copy } from 'lucide-react';

/**
 * Modal Quản lý & Chèn Content theo Scroll
 * Hỗ trợ tạo mốc mới, chỉnh sửa thông số, và nhúng code Custom JSX + CSS
 */
export default function ContentManagerModal({
    storyNodes,
    scrollProgress,
    editingNodeId,
    setEditingNodeId,
    onAddNode,
    onDeleteNode,
    onUpdateNode,
    onClose,
}) {
    const listEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Mẫu code Custom mẫu để người dùng chèn nhanh
    const sampleTemplates = {
        glassCard: {
            html: `<div class="glass-card">
  <span class="badge">PRO EDITION</span>
  <h3 class="card-title">Thiết Kế Tự Do</h3>
  <p class="card-desc">Bạn có thể tùy ý chèn bất kỳ cấu trúc HTML/JSX nào kết hợp với CSS riêng biệt!</p>
  <button class="action-btn">Khám phá ngay &rarr;</button>
</div>`,
            css: `.glass-card {
  padding: 24px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  max-width: 440px;
}
.glass-card .badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #38bdf8;
  background: rgba(8, 47, 73, 0.8);
  border: 1px solid rgba(14, 165, 233, 0.4);
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}
.glass-card .card-title {
  color: #ffffff;
  font-size: 26px;
  font-weight: 900;
  margin: 6px 0;
  line-height: 1.2;
}
.glass-card .card-desc {
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}
.glass-card .action-btn {
  margin-top: 14px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #030712;
  font-weight: 800;
  font-size: 12px;
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
}`
        },
        neonBadge: {
            html: `<div class="neon-pill">
  <span class="pulsing-dot"></span>
  <span class="neon-text">LIVE DEMO 120HZ READY</span>
</div>`,
            css: `.neon-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid #06b6d4;
  border-radius: 9999px;
  box-shadow: 0 0 25px rgba(6, 182, 212, 0.4);
}
.neon-pill .pulsing-dot {
  width: 8px;
  height: 8px;
  background-color: #22d3ee;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
.neon-pill .neon-text {
  color: #22d3ee;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 0.08em;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}`
        }
    };

    const handleCreateNew = () => {
        onAddNode();
        setTimeout(() => {
            listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                            <Type className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base sm:text-lg">Bộ Biên Tập Story Content Theo Scroll</h3>
                            <p className="text-xs text-slate-400">Tùy chỉnh văn bản hoặc tự viết code JSX & CSS cho từng mốc xuất hiện</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <div ref={scrollContainerRef} className="p-4 sm:p-6 overflow-y-auto space-y-6">

                    {/* Timeline trực quan các mốc Content */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">Scroll Timeline (0% đến 100%)</span>
                            <span className="text-cyan-400 font-mono font-bold">Vị trí hiện tại: {Math.round(scrollProgress * 100)}%</span>
                        </div>
                        <div className="relative w-full h-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-1">
                            {/* Con trỏ vị trí cuộn hiện tại */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20 shadow-[0_0_8px_#f87171]"
                                style={{ left: `${scrollProgress * 100}%` }}
                            />
                            {/* Các khối mốc content */}
                            {storyNodes.map((node, i) => (
                                <div
                                    key={node.id}
                                    onClick={() => setEditingNodeId(node.id)}
                                    className={`absolute top-1 bottom-1 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer transition truncate px-2 border ${
                                        editingNodeId === node.id ? 'ring-2 ring-white shadow-lg' : ''
                                    }`}
                                    style={{
                                        left: `${node.startProgress * 100}%`,
                                        width: `${Math.max((node.endProgress - node.startProgress) * 100, 6)}%`,
                                        backgroundColor: node.contentType === 'custom'
                                            ? 'rgba(236,72,153,0.3)'
                                            : node.tagColor === 'emerald'
                                            ? 'rgba(16,185,129,0.25)'
                                            : node.tagColor === 'indigo'
                                            ? 'rgba(99,102,241,0.25)'
                                            : 'rgba(6,182,212,0.25)',
                                        borderColor: node.contentType === 'custom'
                                            ? '#ec4899'
                                            : node.tagColor === 'emerald'
                                            ? '#10b981'
                                            : node.tagColor === 'indigo'
                                            ? '#6366f1'
                                            : '#06b6d4',
                                        color: '#fff'
                                    }}
                                    title={`${node.title || 'Mốc ' + (i + 1)} (${Math.round(node.startProgress * 100)}% - ${Math.round(node.endProgress * 100)}%)`}
                                >
                                    {node.title || `Mốc ${i + 1}`}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danh sách các Thẻ Content */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-300">
                                Danh sách các mốc Story ({storyNodes.length})
                            </h4>
                            <button
                                onClick={handleCreateNew}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm mốc mới</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {storyNodes.map((node, idx) => (
                                <div
                                    key={node.id}
                                    className={`p-4 sm:p-5 bg-slate-950/80 border rounded-2xl space-y-4 transition ${
                                        editingNodeId === node.id ? 'border-cyan-500/70 shadow-lg shadow-cyan-950/30' : 'border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {/* Header thẻ: Tên mốc + Chế độ Content + Nút Xóa */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400">
                                                #{String(idx + 1).padStart(2, '0')}
                                            </span>

                                            {/* Tab Switcher: Tiêu chuẩn VS Custom JSX+CSS */}
                                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                                                <button
                                                    onClick={() => onUpdateNode(node.id, 'contentType', 'standard')}
                                                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                                                        node.contentType !== 'custom'
                                                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    📝 Tiêu chuẩn
                                                </button>
                                                <button
                                                    onClick={() => onUpdateNode(node.id, 'contentType', 'custom')}
                                                    className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                                                        node.contentType === 'custom'
                                                            ? 'bg-pink-500 text-white shadow-sm'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <Code2 className="w-3 h-3" />
                                                    <span>Custom JSX + CSS</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onDeleteNode(node.id)}
                                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                            title="Xóa mốc này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Các thanh điều khiển Vị trí & Timeline Range */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                                        {/* Vị trí trên màn hình */}
                                        <div>
                                            <label className="text-slate-400 text-[11px] block mb-1 font-semibold">Vị trí hiển thị:</label>
                                            <select
                                                value={node.position || 'center'}
                                                onChange={(e) => onUpdateNode(node.id, 'position', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-cyan-500 cursor-pointer"
                                            >
                                                <option value="top-left">Góc trên bên trái</option>
                                                <option value="top-right">Góc trên bên phải</option>
                                                <option value="center">Chính giữa màn hình</option>
                                                <option value="bottom-left">Góc dưới bên trái</option>
                                                <option value="bottom-right">Góc dưới bên phải</option>
                                            </select>
                                        </div>

                                        {/* Mốc Scroll Bắt đầu */}
                                        <div>
                                            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                                                <span>Bắt đầu hiện:</span>
                                                <span className="text-cyan-400 font-mono font-bold">{Math.round(node.startProgress * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="0.95"
                                                step="0.02"
                                                value={node.startProgress}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateNode(node.id, 'startProgress', val);
                                                    if (val >= node.endProgress) {
                                                        onUpdateNode(node.id, 'endProgress', Math.min(1.0, val + 0.1));
                                                    }
                                                }}
                                                className="w-full accent-cyan-400 cursor-pointer"
                                            />
                                        </div>

                                        {/* Mốc Scroll Kết thúc */}
                                        <div>
                                            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                                                <span>Bắt đầu ẩn:</span>
                                                <span className="text-indigo-400 font-mono font-bold">{Math.round(node.endProgress * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.05"
                                                max="1.0"
                                                step="0.02"
                                                value={node.endProgress}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateNode(node.id, 'endProgress', val);
                                                    if (val <= node.startProgress) {
                                                        onUpdateNode(node.id, 'startProgress', Math.max(0, val - 0.1));
                                                    }
                                                }}
                                                className="w-full accent-indigo-400 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Chế độ 1: Tiêu chuẩn (Tiêu đề, Tag, Mô tả, CTA) */}
                                    {node.contentType !== 'custom' ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề chính:</label>
                                                    <input
                                                        type="text"
                                                        value={node.title || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'title', e.target.value)}
                                                        placeholder="Nhập tiêu đề xuất hiện..."
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-slate-400 block mb-1">Badge phụ đề (Tag):</label>
                                                    <input
                                                        type="text"
                                                        value={node.tag || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'tag', e.target.value)}
                                                        placeholder="VD: 01 / GIỚI THIỆU"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                                <div className="sm:col-span-3">
                                                    <label className="text-[11px] text-slate-400 block mb-1">Đoạn văn miêu tả:</label>
                                                    <textarea
                                                        rows={2}
                                                        value={node.description || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'description', e.target.value)}
                                                        placeholder="Mô tả nội dung xuất hiện khi cuộn đến mốc này..."
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-cyan-500 leading-relaxed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] text-slate-400 block mb-1">Nút CTA (tùy chọn):</label>
                                                    <input
                                                        type="text"
                                                        value={node.ctaText || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'ctaText', e.target.value)}
                                                        placeholder="VD: Mua Ngay"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Chế độ 2: Tự do Custom JSX / HTML + CSS */
                                        <div className="space-y-3 pt-1">
                                            {/* Quick Templates Buttons */}
                                            <div className="flex flex-wrap items-center gap-2 pb-1">
                                                <span className="text-[11px] text-slate-400 font-semibold">Chèn nhanh code mẫu:</span>
                                                <button
                                                    onClick={() => {
                                                        onUpdateNode(node.id, 'customHtml', sampleTemplates.glassCard.html);
                                                        onUpdateNode(node.id, 'customCss', sampleTemplates.glassCard.css);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[11px] font-semibold transition"
                                                >
                                                    ✨ Card Kính Mờ (Glass Card)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onUpdateNode(node.id, 'customHtml', sampleTemplates.neonBadge.html);
                                                        onUpdateNode(node.id, 'customCss', sampleTemplates.neonBadge.css);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition"
                                                >
                                                    ⚡ Badge Neon Phát Sáng
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {/* Ô nhập Custom HTML/JSX */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-[11px] font-bold text-pink-300 font-mono">Custom HTML / JSX:</label>
                                                        <span className="text-[10px] text-slate-500">Hỗ trợ class, tags, buttons</span>
                                                    </div>
                                                    <textarea
                                                        rows={7}
                                                        value={node.customHtml || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'customHtml', e.target.value)}
                                                        placeholder={`<div class="my-box">\n  <h3>Tiêu đề tự do</h3>\n  <p>Nội dung bất kỳ...</p>\n</div>`}
                                                        className="w-full bg-[#030610] border border-pink-500/40 rounded-xl p-3 text-xs font-mono text-pink-200 outline-none focus:border-pink-400 leading-relaxed"
                                                    />
                                                </div>

                                                {/* Ô nhập Custom CSS */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-[11px] font-bold text-cyan-300 font-mono">Custom CSS riêng:</label>
                                                        <span className="text-[10px] text-slate-500">Tự động áp dụng scoped</span>
                                                    </div>
                                                    <textarea
                                                        rows={7}
                                                        value={node.customCss || ''}
                                                        onChange={(e) => onUpdateNode(node.id, 'customCss', e.target.value)}
                                                        placeholder={`.my-box {\n  background: rgba(0,0,0,0.6);\n  padding: 20px;\n  border-radius: 16px;\n}`}
                                                        className="w-full bg-[#030610] border border-cyan-500/40 rounded-xl p-3 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400 leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>

                        {/* Nút Thêm mốc mới ở đáy danh sách */}
                        <div ref={listEndRef} className="pt-2">
                            <button
                                onClick={handleCreateNew}
                                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm mốc Story mới vào danh sách</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Các thay đổi được áp dụng ngay lập tức trên màn hình cuộn phía sau</span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                    >
                        Hoàn tất
                    </button>
                </div>

            </div>
        </div>
    );
}
