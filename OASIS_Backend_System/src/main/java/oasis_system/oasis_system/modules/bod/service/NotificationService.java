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

        // 1. Tạo thực thể lưu trữ vào database
        Notification notification = Notification.builder()
                .company(company)
                .title(payload.getTitle())
                .message(payload.getMessage())
                .type(payload.getType())
                .referenceId(payload.getReferenceId())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // 2. Gán ID vừa được sinh vào payload và phát qua WebSocket
        payload.setId(notification.getId());
        payload.setTimestamp(notification.getCreatedAt());

        String destination = "/topic/approvals/" + companyId;
        messagingTemplate.convertAndSend(destination, payload);
    }

    /**
     * Lấy danh sách lịch sử thông báo của doanh nghiệp hiện tại.
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotifications() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return notificationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    /**
     * Đếm số lượng thông báo chưa đọc của doanh nghiệp hiện tại.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin doanh nghiệp hiện tại. Vui lòng đăng nhập lại.");
        }
        return notificationRepository.countByCompanyIdAndIsReadFalse(companyId);
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
