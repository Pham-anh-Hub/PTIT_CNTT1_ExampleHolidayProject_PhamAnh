package oasis_system.oasis_system.modules.crm.repository;

import oasis_system.oasis_system.modules.crm.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OrderDetailRepository cung cấp các phương thức truy vấn bảng 'order_details'.
 */
@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    /**
     * Tìm kiếm chi tiết dòng hàng của một đơn hàng.
     */
    List<OrderDetail> findByOrderId(Long orderId);
}
