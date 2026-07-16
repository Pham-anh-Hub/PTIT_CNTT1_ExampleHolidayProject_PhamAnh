package oasis_system.oasis_system.modules.bod.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.CostStructureDto;
import oasis_system.oasis_system.modules.bod.dto.CustomerDebtDto;
import oasis_system.oasis_system.modules.bod.dto.KpiCardsResponse;
import oasis_system.oasis_system.modules.bod.dto.RevenueTrendDto;
import oasis_system.oasis_system.modules.bod.dto.NotificationPayload;
import oasis_system.oasis_system.modules.bod.service.BodDashboardService;
import oasis_system.oasis_system.modules.bod.service.NotificationService;
import oasis_system.oasis_system.core.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import oasis_system.oasis_system.modules.bod.entity.Notification;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodDashboardController cung cấp các đầu endpoint phục vụ cho màn hình Dashboard
 * thống kê báo cáo tài chính của Giám đốc (BOD).
 */
@RestController
@RequestMapping("/api/v1/bod/dashboard")
@RequiredArgsConstructor
public class BodDashboardController {

    private final BodDashboardService bodDashboardService;
    private final NotificationService notificationService;

    /**
     * API Lấy danh sách số liệu 5 thẻ KPI đầu trang Dashboard.
     */
    @GetMapping("/kpi-cards")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<KpiCardsResponse>> getKpiCards() {
        KpiCardsResponse kpiCards = bodDashboardService.getKpiCards();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy số liệu KPI thành công.", kpiCards)
        );
    }

    /**
     * API Lấy xu hướng doanh thu và lợi nhuận ròng 12 tháng gần nhất (Combo Chart).
     */
    @GetMapping("/charts/revenue-trend")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<RevenueTrendDto>>> getRevenueTrend() {
        List<RevenueTrendDto> revenueTrend = bodDashboardService.getRevenueTrend();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy dữ liệu xu hướng doanh thu thành công.", revenueTrend)
        );
    }

    /**
     * API Lấy cơ cấu phân bổ chi phí của doanh nghiệp (Donut Chart).
     */
    @GetMapping("/charts/cost-structure")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<CostStructureDto>>> getCostStructure() {
        List<CostStructureDto> costStructure = bodDashboardService.getCostStructure();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy cơ cấu chi phí thành công.", costStructure)
        );
    }

    /**
     * API Lấy danh sách công nợ của khách hàng (Bar Chart).
     */
    @GetMapping("/charts/customer-debt")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<CustomerDebtDto>>> getCustomerDebt() {
        List<CustomerDebtDto> customerDebt = bodDashboardService.getCustomerDebt();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy dữ liệu công nợ khách hàng thành công.", customerDebt)
        );
    }

    /**
     * API Mô phỏng gửi thông báo phê duyệt thời gian thực đến Giám đốc để kiểm thử WebSocket.
     * Chỉ người dùng có vai trò BOD/DIRECTOR/ADMIN_DN của doanh nghiệp mới gọi được.
     */
    @PostMapping("/simulate-notification")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<Void>> simulateNotification(@RequestBody NotificationPayload payload) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        notificationService.sendApprovalNotification(companyId, payload);
        return ResponseEntity.ok(
                ApiResponse.success("Mô phỏng gửi thông báo thời gian thực thành công.", null)
        );
    }

    /**
     * API Lấy danh sách toàn bộ lịch sử thông báo của doanh nghiệp.
     * Chỉ người dùng có vai trò BOD/DIRECTOR/ADMIN_DN mới gọi được.
     */
    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        List<Notification> notifications = notificationService.getNotifications();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách thông báo thành công.", notifications)
        );
    }

    /**
     * API Đếm số lượng thông báo chưa đọc.
     * Chỉ người dùng có vai trò BOD/DIRECTOR/ADMIN_DN mới gọi được.
     */
    @GetMapping("/notifications/unread-count")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(
                ApiResponse.success("Đếm số thông báo chưa đọc thành công.", count)
        );
    }

    /**
     * API Đánh dấu một thông báo cụ thể là đã đọc.
     * Chỉ người dùng có vai trò BOD/DIRECTOR/ADMIN_DN mới gọi được.
     */
    @PutMapping("/notifications/{id}/read")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đánh dấu đã đọc thành công.", null)
        );
    }

    /**
     * API Đánh dấu toàn bộ thông báo là đã đọc.
     * Chỉ người dùng có vai trò BOD/DIRECTOR/ADMIN_DN mới gọi được.
     */
    @PutMapping("/notifications/read-all")
    @PreAuthorize("hasAnyRole('BOD', 'DIRECTOR', 'ADMIN_DN')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(
                ApiResponse.success("Đánh dấu đọc tất cả thành công.", null)
        );
    }
}
