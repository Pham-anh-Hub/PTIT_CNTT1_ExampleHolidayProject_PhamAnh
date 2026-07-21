package oasis_system.oasis_system.modules.bod.repository;

import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ApprovalLogRepository cung cấp các phương thức truy vấn bảng 'approval_logs'.
 */
@Repository
public interface ApprovalLogRepository extends JpaRepository<ApprovalLog, Long> {

    /**
     * Lấy toàn bộ lịch sử phê duyệt của doanh nghiệp xếp theo thời gian mới nhất.
     */
    List<ApprovalLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    /**
     * Lấy lịch sử phê duyệt của doanh nghiệp theo loại tài liệu (CONTRACT, PAYROLL, etc.).
     */
    List<ApprovalLog> findByCompanyIdAndDocumentTypeOrderByCreatedAtDesc(Long companyId, String documentType);
}
