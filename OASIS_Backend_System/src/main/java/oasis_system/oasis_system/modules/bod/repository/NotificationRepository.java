package oasis_system.oasis_system.modules.bod.repository;

import oasis_system.oasis_system.modules.bod.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * NotificationRepository cung cấp các phương thức truy vấn và cập nhật bảng 'notifications'.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Lấy danh sách thông báo của doanh nghiệp sắp xếp theo thời gian mới nhất.
     */
    List<Notification> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    /**
     * Đếm số lượng thông báo chưa đọc của doanh nghiệp.
     */
    long countByCompanyIdAndIsReadFalse(Long companyId);
}
