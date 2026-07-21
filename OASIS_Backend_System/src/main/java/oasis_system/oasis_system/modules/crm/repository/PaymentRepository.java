package oasis_system.oasis_system.modules.crm.repository;

import oasis_system.oasis_system.modules.crm.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PaymentRepository cung cấp các phương thức truy vấn bảng 'payments'.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Tìm kiếm toàn bộ các đợt thanh toán của một khách hàng cụ thể.
     */
    @Query("SELECT p FROM Payment p JOIN p.order o WHERE o.customer.id = :customerId")
    List<Payment> findPaymentsByCustomerId(@Param("customerId") Long customerId);
}
