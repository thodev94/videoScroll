import React from 'react';
import { Type, Plus, Trash2 } from 'lucide-react';

/**
 * Modal Quản lý & Chèn Content theo Scroll
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Type className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h3 className="font-bold text-white text-base sm:text-lg">Bộ Biên Tập Story Content Theo Scroll</h3>
                            <p className="text-xs text-slate-400">Tùy chỉnh các đoạn văn bản, tiêu đề và nút CTA xuất hiện tại từng mốc cuộn</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Timeline trực quan các mốc Content */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Scroll Timeline (0% đến 100%)</span>
                            <span className="text-cyan-400 font-mono">Vị trí hiện tại: {Math.round(scrollProgress * 100)}%</span>
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
                                    className="absolute top-1 bottom-1 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer transition truncate px-2 border"
                                    style={{
                                        left: `${node.startProgress * 100}%`,
                                        width: `${Math.max((node.endProgress - node.startProgress) * 100, 5)}%`,
                                        backgroundColor: node.tagColor === 'emerald' ? 'rgba(16,185,129,0.25)' : node.tagColor === 'indigo' ? 'rgba(99,102,241,0.25)' : 'rgba(6,182,212,0.25)',
                                        borderColor: node.tagColor === 'emerald' ? '#10b981' : node.tagColor === 'indigo' ? '#6366f1' : '#06b6d4',
                                        color: '#fff'
                                    }}
                                    title={`${node.title} (${Math.round(node.startProgress * 100)}% - ${Math.round(node.endProgress * 100)}%)`}
                                >
                                    {node.title || `Mốc ${i + 1}`}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danh sách các Thẻ Content */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-300">Danh sách các mốc Story ({storyNodes.length})</h4>
                            <button
                                onClick={onAddNode}
                                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20 active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm mốc mới</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {storyNodes.map((node, idx) => (
                                <div
                                    key={node.id}
                                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-mono font-bold text-cyan-400">#0{idx + 1}</span>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={node.title}
                                                onChange={(e) => onUpdateNode(node.id, 'title', e.target.value)}
                                                placeholder="Tiêu đề chính..."
                                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                            />
                                            <input
                                                type="text"
                                                value={node.tag}
                                                onChange={(e) => onUpdateNode(node.id, 'tag', e.target.value)}
                                                placeholder="Badge phụ đề (Tag)..."
                                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => onDeleteNode(node.id)}
                                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                            title="Xóa mốc này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        {/* Vị trí trên màn hình */}
                                        <div>
                                            <label className="text-slate-400 text-[11px] block mb-1">Vị trí hiển thị:</label>
                                            <select
                                                value={node.position}
                                                onChange={(e) => onUpdateNode(node.id, 'position', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-cyan-500"
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
                                                <span>Hiện từ:</span>
                                                <span className="text-cyan-400 font-mono font-bold">{Math.round(node.startProgress * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="0.9"
                                                step="0.05"
                                                value={node.startProgress}
                                                onChange={(e) => onUpdateNode(node.id, 'startProgress', parseFloat(e.target.value))}
                                                className="w-full accent-cyan-400 cursor-pointer"
                                            />
                                        </div>

                                        {/* Mốc Scroll Kết thúc */}
                                        <div>
                                            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                                                <span>Ẩn tại:</span>
                                                <span className="text-cyan-400 font-mono font-bold">{Math.round(node.endProgress * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={node.endProgress}
                                                onChange={(e) => onUpdateNode(node.id, 'endProgress', parseFloat(e.target.value))}
                                                className="w-full accent-cyan-400 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="sm:col-span-3">
                                            <textarea
                                                rows={2}
                                                value={node.description}
                                                onChange={(e) => onUpdateNode(node.id, 'description', e.target.value)}
                                                placeholder="Đoạn văn miêu tả chi tiết..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={node.ctaText}
                                                onChange={(e) => onUpdateNode(node.id, 'ctaText', e.target.value)}
                                                placeholder="Nút CTA (tùy chọn)..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
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

