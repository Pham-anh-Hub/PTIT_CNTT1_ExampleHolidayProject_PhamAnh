package oasis_system.oasis_system.modules.accounting.repository;

import oasis_system.oasis_system.modules.accounting.entity.ExpenseVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseVoucherRepository extends JpaRepository<ExpenseVoucher, Long> {
    List<ExpenseVoucher> findByCompanyId(Long companyId);
    List<ExpenseVoucher> findByCompanyIdAndCategory(Long companyId, String category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseVoucher e WHERE e.companyId = :companyId AND e.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCompanyIdAndDateRange(@Param("companyId") Long companyId, 
                                               @Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseVoucher e WHERE e.companyId = :companyId AND e.category = :category AND e.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCompanyIdAndCategoryAndDateRange(@Param("companyId") Long companyId,
                                                            @Param("category") String category,
                                                            @Param("startDate") LocalDateTime startDate,
                                                            @Param("endDate") LocalDateTime endDate);
}
