// Dữ liệu mặc định cho Story Overlay Content System
// Chứa các đoạn nội dung hiển thị theo tiến trình Scroll (0.0 -> 1.0)

const defaultStoryNodes = [
    {
        id: '1',
        startProgress: 0.0,
        endProgress: 0.28,
        position: 'top-left', // top-left | top-right | center | bottom-left | bottom-right
        tag: '01 / ĐIỂM XUẤT PHÁT',
        tagColor: 'cyan',
        title: 'Lướt mượt từng nhịp',
        description: 'Công nghệ Frame Blending kết hợp quán tính LERP biến từng mili-giây cuộn thành trải nghiệm phim điện ảnh.',
        ctaText: 'Khám phá thông số'
    },
    {
        id: '2',
        startProgress: 0.35,
        endProgress: 0.65,
        position: 'bottom-right',
        tag: '02 / DÒNG CHẢY TỰ DO',
        tagColor: 'emerald',
        title: 'Thăng hoa cùng tốc độ',
        description: 'Lực cản quán tính lũy thừa tự động làm chậm mượt mà khi bạn buông tay khỏi chuột hoặc màn hình cảm ứng.',
        ctaText: 'Xem demo'
    },
    {
        id: '3',
        startProgress: 0.72,
        endProgress: 1.0,
        position: 'bottom-left',
        tag: '03 / VỀ ĐÍCH AN TOÀN',
        tagColor: 'indigo',
        title: 'Hiệu năng hoàn hảo',
        description: 'Sẵn sàng tích hợp trực tiếp vào Next.js, Vite hoặc Landing page với bộ file frame và code tối ưu sẵn.',
        ctaText: 'Tải ngay dự án'
    }
];

export default defaultStoryNodes;

