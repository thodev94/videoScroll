import React, { useState, useEffect, useCallback } from 'react';

// Hooks
import useFrameEngine from './hooks/useFrameEngine';
import useScrollMotion from './hooks/useScrollMotion';

// Components
import Header from './components/Header';
import ScrollViewport from './components/ScrollViewport';

// Modals
import ContentManagerModal from './components/modals/ContentManagerModal';
import ExportCodeModal from './components/modals/ExportCodeModal';
import ExportZipModal from './components/modals/ExportZipModal';

// Utils & Data
import { downloadFramesAsZip } from './utils/zipExporter';
import { generateFolderModeCode, generateEmbeddedModeCode } from './utils/codeGenerators';
import defaultStoryNodes from './data/defaultStoryNodes';

export default function App() {
    // Video & Frame Engine States
    const [videoSrc, setVideoSrc] = useState('https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4');
    const [videoName, setVideoName] = useState('paraglide-mountain.mp4');
    const [framesCount, setFramesCount] = useState(200);
    const [exportQuality, setExportQuality] = useState(0.85);
    const [exportWidth] = useState(1280);

    // Motion Settings
    const [enableFrameBlend, setEnableFrameBlend] = useState(true);
    const [enableMotionBlur] = useState(true);

    // Chế độ xuất Code: 'embedded' hoặc 'folder'
    const [codeExportMode, setCodeExportMode] = useState('embedded');
    const [embeddedFramesCode, setEmbeddedFramesCode] = useState('');
    const [isGeneratingBase64, setIsGeneratingBase64] = useState(false);
    const [base64Progress, setBase64Progress] = useState(0);

    // Package Manager
    const [packageManager, setPackageManager] = useState('npm');

    // Story Overlay Content System
    const [storyNodes, setStoryNodes] = useState(defaultStoryNodes);

    // Modals & UI States
    const [activeModal, setActiveModal] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [copiedTab, setCopiedTab] = useState(null);
    const [zipProgress, setZipProgress] = useState(0);
    const [isZipping, setIsZipping] = useState(false);

    // Custom Hooks
    const {
        isProcessing,
        processProgress,
        cachedBitmaps,
        setVideoDuration,
        canvasRef,
        videoRef,
        renderFrameWithBlending,
        extractFrames,
    } = useFrameEngine({ exportWidth, enableFrameBlend });

    const {
        scrollProgress,
        fps,
        motionVelocity,
        containerRef,
        viewportRef,
        smoothProgressRef,
    } = useScrollMotion({ renderFrameWithBlending, enableMotionBlur });

    // Resize canvas khi thay đổi kích thước cửa sổ -> re-render frame
    useEffect(() => {
        const handleResize = () => {
            renderFrameWithBlending(smoothProgressRef.current);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [renderFrameWithBlending, smoothProgressRef]);

    // Load Metadata của Video
    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setVideoDuration(videoRef.current.duration);
        extractFrames(videoRef.current, framesCount);
    };

    // Xử lý nạp file video từ máy
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoName(file.name);
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
    };

    // Copy code vào clipboard
    const handleCopyCode = (text, tab) => {
        navigator.clipboard.writeText(text);
        setCopiedTab(tab);
        setTimeout(() => setCopiedTab(null), 2500);
    };

    // Đóng gói và tải trọn bộ frames dạng ZIP
    const handleDownloadZip = async () => {
        if (cachedBitmaps.length === 0) return;
        setIsZipping(true);
        setZipProgress(0);

        try {
            await downloadFramesAsZip(cachedBitmaps, exportQuality, videoName, setZipProgress);
        } catch (err) {
            console.error("Lỗi đóng gói ZIP:", err);
        } finally {
            setIsZipping(false);
        }
    };

    // Tạo chuỗi mã nguồn chứa mảng Base64 của toàn bộ Frame
    const generateEmbeddedCode = useCallback(async () => {
        if (cachedBitmaps.length === 0) return;
        setIsGeneratingBase64(true);
        setBase64Progress(0);

        try {
            const code = await generateEmbeddedModeCode(cachedBitmaps, storyNodes, setBase64Progress);
            setEmbeddedFramesCode(code);
        } finally {
            setIsGeneratingBase64(false);
        }
    }, [cachedBitmaps, storyNodes]);

    // Tự động sinh mã nguồn khi mở modal Xuất Code nếu ở chế độ nhúng
    useEffect(() => {
        if (activeModal === 'export-code' && codeExportMode === 'embedded' && !embeddedFramesCode) {
            generateEmbeddedCode();
        }
    }, [activeModal, codeExportMode, embeddedFramesCode, generateEmbeddedCode]);

    // Code React Component cho chế độ folder
    const reactComponentCode = generateFolderModeCode(cachedBitmaps.length || framesCount, storyNodes);

    // --- Story Node Management ---
    const handleAddStoryNode = () => {
        const newNode = {
            id: Date.now().toString(),
            startProgress: Math.min(Math.round(scrollProgress * 10) / 10, 0.7),
            endProgress: Math.min(Math.round(scrollProgress * 10) / 10 + 0.25, 1.0),
            position: 'center',
            tag: `0${storyNodes.length + 1} / NỘI DUNG MỚI`,
            tagColor: 'cyan',
            title: 'Tiêu đề mới',
            description: 'Mô tả nội dung xuất hiện khi người dùng cuộn đến vị trí này.',
            ctaText: ''
        };
        setStoryNodes([...storyNodes, newNode]);
        setEditingNodeId(newNode.id);
    };

    const handleDeleteNode = (id) => {
        setStoryNodes(storyNodes.filter(n => n.id !== id));
    };

    const handleUpdateNode = (id, field, value) => {
        setStoryNodes(storyNodes.map(n => n.id === id ? { ...n, [field]: value } : n));
    };

    return (
        <div className="min-h-screen bg-[#05070c] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">

            {/* Video ẩn dùng làm nền decoder */}
            <video
                ref={videoRef}
                src={videoSrc}
                className="hidden"
                playsInline
                muted
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Floating Header Toolbar */}
            <Header
                videoName={videoName}
                enableFrameBlend={enableFrameBlend}
                setEnableFrameBlend={setEnableFrameBlend}
                framesCount={framesCount}
                setFramesCount={setFramesCount}
                isProcessing={isProcessing}
                extractFrames={extractFrames}
                videoRef={videoRef}
                storyNodesCount={storyNodes.length}
                onUploadFile={handleFileUpload}
                onOpenContentManager={() => setActiveModal('manage-content')}
                onOpenExportCode={() => setActiveModal('export-code')}
                onOpenExportZip={() => setActiveModal('export-zip')}
            />

            {/* Main Sticky Scroll Section */}
            <ScrollViewport
                containerRef={containerRef}
                viewportRef={viewportRef}
                canvasRef={canvasRef}
                isProcessing={isProcessing}
                framesCount={framesCount}
                processProgress={processProgress}
                storyNodes={storyNodes}
                scrollProgress={scrollProgress}
                cachedBitmapsCount={cachedBitmaps.length}
                fps={fps}
                motionVelocity={motionVelocity}
                enableFrameBlend={enableFrameBlend}
            />

            {/* Modal Quản lý & Chèn Content theo Scroll */}
            {activeModal === 'manage-content' && (
                <ContentManagerModal
                    storyNodes={storyNodes}
                    scrollProgress={scrollProgress}
                    editingNodeId={editingNodeId}
                    setEditingNodeId={setEditingNodeId}
                    onAddNode={handleAddStoryNode}
                    onDeleteNode={handleDeleteNode}
                    onUpdateNode={handleUpdateNode}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {/* Modal Xuất Code React */}
            {activeModal === 'export-code' && (
                <ExportCodeModal
                    codeExportMode={codeExportMode}
                    setCodeExportMode={setCodeExportMode}
                    packageManager={packageManager}
                    setPackageManager={setPackageManager}
                    copiedTab={copiedTab}
                    onCopyCode={handleCopyCode}
                    isGeneratingBase64={isGeneratingBase64}
                    base64Progress={base64Progress}
                    embeddedFramesCode={embeddedFramesCode}
                    reactComponentCode={reactComponentCode}
                    cachedBitmapsCount={cachedBitmaps.length}
                    onGenerateEmbeddedCode={generateEmbeddedCode}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {/* Modal Xuất Trọn Bộ Frames dạng ZIP */}
            {activeModal === 'export-zip' && (
                <ExportZipModal
                    cachedBitmapsCount={cachedBitmaps.length}
                    exportQuality={exportQuality}
                    setExportQuality={setExportQuality}
                    isZipping={isZipping}
                    zipProgress={zipProgress}
                    onDownloadZip={handleDownloadZip}
                    onClose={() => setActiveModal(null)}
                />
            )}

        </div>
    );
}

