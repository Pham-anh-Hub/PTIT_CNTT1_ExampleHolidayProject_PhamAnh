package oasis_system.oasis_system.modules.accounting.repository;

import oasis_system.oasis_system.modules.accounting.entity.ReceiptVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReceiptVoucherRepository extends JpaRepository<ReceiptVoucher, Long> {
    List<ReceiptVoucher> findByCompanyId(Long companyId);
    List<ReceiptVoucher> findByCompanyIdAndOrderId(Long companyId, Long orderId);
    List<ReceiptVoucher> findByCompanyIdAndCustomerId(Long companyId, Long customerId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM ReceiptVoucher r WHERE r.companyId = :companyId AND r.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCompanyIdAndDateRange(@Param("companyId") Long companyId, 
                                               @Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
}
