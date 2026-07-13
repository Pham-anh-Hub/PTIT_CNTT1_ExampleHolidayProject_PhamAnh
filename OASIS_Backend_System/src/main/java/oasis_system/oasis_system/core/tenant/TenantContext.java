package oasis_system.oasis_system.core.tenant;

/**
 * Lớp TenantContext đóng vai trò lưu trữ thông tin "Mã Doanh nghiệp" (companyId) 
 * phục vụ cho mô hình đa doanh nghiệp SaaS Multi-tenant (Shared-Database).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. ThreadLocal (Java Core): Dùng để lưu trữ dữ liệu riêng biệt cho từng Thread (tiến trình xử lý request).
 *    Do Spring Boot xử lý mỗi request HTTP trên một Thread riêng biệt, việc dùng ThreadLocal giúp 
 *    truyền companyId đi xuyên suốt các tầng (Controller -> Service -> Repository) mà không cần 
 *    truyền tham số qua các hàm một cách thủ công (giảm thiểu Insecure Direct Object Reference - IDOR).
 * 2. Static Methods: Cho phép các tầng truy cập trực tiếp mọi lúc mọi nơi trong cùng một luồng xử lý.
 */
public class TenantContext {

    // ThreadLocal lưu giữ ID của doanh nghiệp (Tenant) cho thread xử lý hiện tại
    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();

    /**
     * Thiết lập ID của doanh nghiệp cho luồng xử lý hiện tại.
     * Thường được gọi tại bộ lọc JWT (JwtAuthenticationFilter) sau khi giải mã Token thành công.
     * 
     * @param tenantId Mã định danh doanh nghiệp (companyId)
     */
    public static void setCurrentTenant(Long tenantId) {
        currentTenant.set(tenantId);
    }

    /**
     * Lấy ID của doanh nghiệp đang hoạt động trong luồng xử lý này.
     * Được các tầng Repository hoặc Audit Log lấy ra để tự động lọc dữ liệu WHERE company_id = ?.
     * 
     * @return Long mã doanh nghiệp
     */
    public static Long getCurrentTenant() {
        return currentTenant.get();
    }

    /**
     * Xóa thông tin doanh nghiệp khỏi luồng xử lý.
     * CỰC KỲ QUAN TRỌNG: Phải luôn gọi hàm này trong khối finally của Filter/Interceptor
     * để tránh việc rò rỉ dữ liệu (Memory Leak) hoặc Thread-pooling reuse (thread cũ giữ tenant cũ 
     * gán cho request của người dùng khác).
     */
    public static void clear() {
        currentTenant.remove();
    }
}
