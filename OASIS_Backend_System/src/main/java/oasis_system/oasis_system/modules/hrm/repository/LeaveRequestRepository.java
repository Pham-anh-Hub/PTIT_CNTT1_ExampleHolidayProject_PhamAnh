package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * LeaveRequestRepository cung cấp các phương thức truy vấn bảng 'leave_requests'.
 */
@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    /**
     * Lấy danh sách đơn nghỉ phép theo trạng thái của doanh nghiệp.
     */
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.company.id = :companyId AND lr.status = :status")
    List<LeaveRequest> findByCompanyIdAndStatus(
            @Param("companyId") Long companyId, 
            @Param("status") String status
    );

    /**
     * Lấy toàn bộ đơn nghỉ phép thuộc doanh nghiệp.
     */
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.company.id = :companyId")
    List<LeaveRequest> findByCompanyId(@Param("companyId") Long companyId);
}
