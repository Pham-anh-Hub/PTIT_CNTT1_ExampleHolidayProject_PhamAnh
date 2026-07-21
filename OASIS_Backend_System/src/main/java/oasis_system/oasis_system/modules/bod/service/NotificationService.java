package oasis_system.oasis_system.modules.bod.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.repository.CompanyRepository;
import oasis_system.oasis_system.modules.bod.dto.NotificationPayload;
import oasis_system.oasis_system.modules.bod.entity.Notification;
import oasis_system.oasis_system.modules.bod.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * NotificationService chịu trách nhiệm phát (broadcast) các tin nhắn thời gian thực qua WebSocket,
 * đồng thời tự động lưu trữ lịch sử hộp thư thông báo vào Cơ sở dữ liệu.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final CompanyRepository companyRepository;

    /**
     * Gửi thông báo phê duyệt thời gian thực đến kênh đăng ký của doanh nghiệp cụ thể,
     * đồng thời lưu thông báo đó vào CSDL để duy trì hộp thư lưu trữ.
     * 
     * @param companyId ID Doanh nghiệp (Tenant)
     * @param payload Thông tin chi tiết thông báo
     */
    @Transactional
    public void sendApprovalNotification(Long companyId, NotificationPayload payload) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp có ID: " + companyId));

        // 1. Xác định targetRole (nếu chưa có thì mặc định là BOD hoặc dựa trên type)
        String targetRole = payload.getTargetRole();
        if (targetRole == null || targetRole.isBlank()) {
            if ("ACCOUNTANT_EXPLANATION".equals(payload.getType())) {
                targetRole = "ACCOUNTANT";
            } else {
                targetRole = "BOD";
            }
        }

        // 1b. Tạo thực thể lưu trữ vào database
        Notification notification = Notification.builder()
                .company(company)
                .title(payload.getTitle())
                .message(payload.getMessage())
                .type(payload.getType())
                .referenceId(payload.getReferenceId())
                .targetRole(targetRole)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // 2. Gán ID & targetRole vừa sinh vào payload và phát qua WebSocket
        payload.setId(notification.getId());
        payload.setTargetRole(targetRole);
        payload.setTimestamp(notification.getCreatedAt());

        // Nếu thông báo dành cho Accountant -> phát tới channel accountant, ngược lại tới approvals
        String destination = "ACCOUNTANT".equals(targetRole) 
                ? "/topic/accountant/notifications" 
                : "/topic/approvals/" + companyId;
        messagingTemplate.convertAndSend(destination, payload);
    }

    /**
     * Lấy danh sách lịch sử thông báo của doanh nghiệp dành riêng cho BOD.
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotifications() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        // Lọc thông báo dành cho BOD (bao gồm BOD và null/rỗng cho tương thích ngược)
        return notificationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .filter(n -> n.getTargetRole() == null || "BOD".equalsIgnoreCase(n.getTargetRole()))
                .toList();
    }

    /**
     * Đếm số lượng thông báo chưa đọc dành riêng cho BOD.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return notificationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .filter(n -> !n.getIsRead() && (n.getTargetRole() == null || "BOD".equalsIgnoreCase(n.getTargetRole())))
                .count();
    }

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     */
    @Transactional
    public void markAsRead(Long id) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông báo có ID: " + id));

        if (!notification.getCompany().getId().equals(companyId)) {
            throw new SecurityException("Cảnh báo bảo mật: Bạn không có quyền chỉnh sửa thông báo này.");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Đánh dấu toàn bộ thông báo của doanh nghiệp là đã đọc.
     */
    @Transactional
    public void markAllAsRead() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }

        List<Notification> unreadNotifications = notificationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .filter(n -> !n.getIsRead())
                .toList();

        for (Notification n : unreadNotifications) {
            n.setIsRead(true);
        }

        notificationRepository.saveAll(unreadNotifications);
    }
}
