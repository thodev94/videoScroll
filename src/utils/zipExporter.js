import { loadJSZip } from './helpers';

/**
 * Đóng gói và tải trọn bộ frames dạng ZIP
 * @param {ImageBitmap[]} cachedBitmaps - Mảng bitmap đã cache
 * @param {number} exportQuality - Chất lượng WebP (0-1)
 * @param {string} videoName - Tên video gốc
 * @param {(progress: number) => void} onProgress - Callback cập nhật tiến trình
 * @returns {Promise<void>}
 */
export const downloadFramesAsZip = async (cachedBitmaps, exportQuality, videoName, onProgress) => {
    if (cachedBitmaps.length === 0) return;

    const JSZip = await loadJSZip();
    const zip = new JSZip();
    const folder = zip.folder('frames');

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const total = cachedBitmaps.length;
    for (let i = 0; i < total; i++) {
        const item = cachedBitmaps[i];
        tempCanvas.width = item.width;
        tempCanvas.height = item.height;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(item, 0, 0);

        const blob = await new Promise((resolve) => {
            tempCanvas.toBlob(resolve, 'image/webp', exportQuality);
        });

        const fileName = `frame_${String(i).padStart(4, '0')}.webp`;
        folder.file(fileName, blob);

        onProgress(Math.round(((i + 1) / total) * 100));
    }

    folder.file('metadata.json', JSON.stringify({
        totalFrames: total,
        width: cachedBitmaps[0].width,
        height: cachedBitmaps[0].height,
        fpsTarget: 60,
        originalVideo: videoName,
        blendingSupported: true
    }, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = `${videoName.replace(/\.[^/.]+$/, '')}-smooth-frames.zip`;
    downloadLink.click();
};

