import React, { useState, useEffect, useCallback, useRef } from 'react';

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
    const [exportWidth, setExportWidth] = useState(1280);

    // Motion Settings
    const [enableFrameBlend, setEnableFrameBlend] = useState(true);
    const [enableMotionBlur, setEnableMotionBlur] = useState(true);

    // Chế độ xuất Code: 'embedded' hoặc 'folder'
    const [codeExportMode, setCodeExportMode] = useState('embedded');
    // Định dạng Styling: 'pure-css' (Thuần CSS - Zero Dependencies) hoặc 'tailwind'
    const [stylingFramework, setStylingFramework] = useState('pure-css');
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

    // Refs hỗ trợ hủy bỏ tiến trình
    const cancelZipRef = useRef(false);
    const cancelBase64Ref = useRef(false);

    // Custom Hooks - Tích hợp Auto-Detect Ratio, Responsive & Nút HỦY trích xuất source
    const {
        isProcessing,
        processProgress,
        cachedBitmaps,
        videoDuration,
        setVideoDuration,
        videoMetrics,
        screenMetrics,
        aspectComparison,
        renderFitMode,
        setRenderFitMode,
        canvasRef,
        videoRef,
        renderFrameWithBlending,
        extractFrames,
        cancelExtraction,
    } = useFrameEngine({ exportWidth, enableFrameBlend });

    const {
        scrollProgress,
        fps,
        motionVelocity,
        containerRef,
        viewportRef,
        smoothProgressRef,
    } = useScrollMotion({ renderFrameWithBlending, enableMotionBlur });

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

    // Hủy bỏ đóng gói ZIP
    const handleCancelZip = () => {
        cancelZipRef.current = true;
        setIsZipping(false);
        setZipProgress(0);
    };

    // Đóng gói và tải trọn bộ frames dạng ZIP
    const handleDownloadZip = async () => {
        if (cachedBitmaps.length === 0) return;
        setIsZipping(true);
        setZipProgress(0);
        cancelZipRef.current = false;

        try {
            await downloadFramesAsZip(
                cachedBitmaps,
                exportQuality,
                videoName,
                setZipProgress,
                () => cancelZipRef.current
            );
        } catch (err) {
            console.error("Lỗi đóng gói ZIP:", err);
        } finally {
            setIsZipping(false);
        }
    };

    // Hủy bỏ sinh Base64
    const handleCancelBase64 = () => {
        cancelBase64Ref.current = true;
        setIsGeneratingBase64(false);
        setBase64Progress(0);
    };

    // Tạo chuỗi mã nguồn chứa mảng Base64 của toàn bộ Frame đa luồng siêu tốc
    const generateEmbeddedCode = useCallback(async (preset = 'fast', framework = stylingFramework) => {
        if (cachedBitmaps.length === 0) return;
        setIsGeneratingBase64(true);
        setBase64Progress(0);
        cancelBase64Ref.current = false;

        try {
            const code = await generateEmbeddedModeCode(
                cachedBitmaps,
                storyNodes,
                setBase64Progress,
                () => cancelBase64Ref.current,
                preset,
                framework
            );
            if (code) {
                setEmbeddedFramesCode(code);
            }
        } finally {
            setIsGeneratingBase64(false);
        }
    }, [cachedBitmaps, storyNodes, stylingFramework]);

    // Tự động sinh mã nguồn khi mở modal Xuất Code nếu ở chế độ nhúng
    useEffect(() => {
        if (activeModal === 'export-code' && codeExportMode === 'embedded' && !embeddedFramesCode) {
            generateEmbeddedCode('fast', stylingFramework);
        }
    }, [activeModal, codeExportMode, embeddedFramesCode, generateEmbeddedCode, stylingFramework]);

    // --- Story Node Management ---
    const handleAddStoryNode = () => {
        let nextStart = Math.round(scrollProgress * 20) / 20;
        if (nextStart >= 0.85) nextStart = 0.5;
        const nextEnd = Math.min(1.0, Math.round((nextStart + 0.25) * 20) / 20);

        const newNode = {
            id: Date.now().toString(),
            startProgress: nextStart,
            endProgress: nextEnd,
            position: 'center',
            tag: `0${storyNodes.length + 1} / NỘI DUNG MỚI`,
            tagColor: 'cyan',
            title: 'Tiêu đề mốc mới',
            description: 'Mô tả nội dung xuất hiện khi người dùng cuộn đến vị trí này.',
            ctaText: '',
            contentType: 'standard', // 'standard' | 'custom'
            customHtml: '',
            customCss: '',
        };
        setStoryNodes(prev => [...prev, newNode]);
        setEditingNodeId(newNode.id);
        setEmbeddedFramesCode(''); // Đảm bảo code xuất ra luôn cập nhật mới
    };

    const handleDeleteNode = (id) => {
        setStoryNodes(prev => prev.filter(n => n.id !== id));
        setEmbeddedFramesCode('');
    };

    const handleUpdateNode = (id, field, value) => {
        setStoryNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
        setEmbeddedFramesCode('');
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
                videoMetrics={videoMetrics}
                screenMetrics={screenMetrics}
                aspectComparison={aspectComparison}
                renderFitMode={renderFitMode}
                setRenderFitMode={setRenderFitMode}
            />

            {/* Main Sticky Scroll Section - Tự động đồng bộ DPR & Nút HỦY nạp source */}
            <ScrollViewport
                containerRef={containerRef}
                viewportRef={viewportRef}
                canvasRef={canvasRef}
                isProcessing={isProcessing}
                framesCount={framesCount}
                processProgress={processProgress}
                onCancelProcessing={cancelExtraction}
                storyNodes={storyNodes}
                scrollProgress={scrollProgress}
                cachedBitmapsCount={cachedBitmaps.length}
                fps={fps}
                motionVelocity={motionVelocity}
                enableFrameBlend={enableFrameBlend}
                videoMetrics={videoMetrics}
                screenMetrics={screenMetrics}
                renderFitMode={renderFitMode}
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

            {/* Modal Xuất Code React - Hỗ trợ THUẦN CSS & Tải file .jsx */}
            {activeModal === 'export-code' && (
                <ExportCodeModal
                    codeExportMode={codeExportMode}
                    setCodeExportMode={setCodeExportMode}
                    stylingFramework={stylingFramework}
                    setStylingFramework={setStylingFramework}
                    packageManager={packageManager}
                    setPackageManager={setPackageManager}
                    copiedTab={copiedTab}
                    onCopyCode={handleCopyCode}
                    isGeneratingBase64={isGeneratingBase64}
                    base64Progress={base64Progress}
                    embeddedFramesCode={embeddedFramesCode}
                    storyNodes={storyNodes}
                    cachedBitmapsCount={cachedBitmaps.length}
                    onGenerateEmbeddedCode={(preset, framework) => generateEmbeddedCode(preset, framework || stylingFramework)}
                    onCancelBase64={handleCancelBase64}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {/* Modal Xuất Trọn Bộ Frames dạng ZIP - Hỗ trợ nút HỦY */}
            {activeModal === 'export-zip' && (
                <ExportZipModal
                    cachedBitmapsCount={cachedBitmaps.length}
                    exportQuality={exportQuality}
                    setExportQuality={setExportQuality}
                    isZipping={isZipping}
                    zipProgress={zipProgress}
                    onDownloadZip={handleDownloadZip}
                    onCancelZip={handleCancelZip}
                    onClose={() => setActiveModal(null)}
                />
            )}

        </div>
    );
}
