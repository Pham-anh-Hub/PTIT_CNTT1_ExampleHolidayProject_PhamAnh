/**
 * LoadingSpinner — Hiển thị khi Lazy Loading đang tải màn hình mới.
 * Dùng làm fallback cho <Suspense> trong AppRoutes.
 */
export default function LoadingSpinner() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
      id="page-loading-spinner"
    >
      {/* Vòng xoay chính */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-slate-teal,#2a7c73)] animate-spin" />
      </div>
      {/* Text */}
      <p
        className="mt-4 text-xs font-semibold text-slate-400 tracking-widest uppercase animate-pulse"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Đang tải…
      </p>
    </div>
  );
}
