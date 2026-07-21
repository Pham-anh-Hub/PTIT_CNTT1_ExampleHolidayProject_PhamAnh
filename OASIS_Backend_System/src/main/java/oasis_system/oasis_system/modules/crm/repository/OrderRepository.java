package oasis_system.oasis_system.modules.crm.repository;

import oasis_system.oasis_system.modules.crm.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OrderRepository cung cấp các phương thức truy vấn bảng 'orders'.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Lấy danh sách đơn hàng theo trạng thái phê duyệt của doanh nghiệp.
     */
    @Query("SELECT o FROM Order o WHERE o.company.id = :companyId AND o.approvalStatus = :approvalStatus")
    List<Order> findByCompanyIdAndApprovalStatus(
            @Param("companyId") Long companyId, 
            @Param("approvalStatus") String approvalStatus
    );

    /**
     * Lấy toàn bộ đơn hàng thuộc doanh nghiệp.
     */
    @Query("SELECT o FROM Order o WHERE o.company.id = :companyId")
    List<Order> findByCompanyId(@Param("companyId") Long companyId);

    /**
     * Lấy tất cả đơn hàng đã được phê duyệt của một khách hàng cụ thể.
     */
    @Query("SELECT o FROM Order o WHERE o.customer.id = :customerId AND o.approvalStatus = 'Đã phê duyệt'")
    List<Order> findApprovedOrdersByCustomerId(@Param("customerId") Long customerId);
}
