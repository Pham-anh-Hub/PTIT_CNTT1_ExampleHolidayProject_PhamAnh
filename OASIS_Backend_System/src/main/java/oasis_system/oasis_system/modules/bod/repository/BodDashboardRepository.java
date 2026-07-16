package oasis_system.oasis_system.modules.bod.repository;

import oasis_system.oasis_system.modules.auth.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * BodDashboardRepository cung cấp các truy vấn native SQL để phục vụ các biểu đồ
 * và các KPI của Ban giám đốc (BOD).
 */
@Repository
public interface BodDashboardRepository extends JpaRepository<Company, Long> {

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE company_id = :companyId AND approval_status = 'Đã phê duyệt'", nativeQuery = true)
    BigDecimal getTotalRevenue(@Param("companyId") Long companyId);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.company_id = :companyId", nativeQuery = true)
    BigDecimal getActualRevenue(@Param("companyId") Long companyId);

    @Query(value = "SELECT COALESCE(SUM(estimated_budget), 0) FROM production_plans WHERE company_id = :companyId AND approval_status = 'Đã phê duyệt'", nativeQuery = true)
    BigDecimal getTotalProductionCost(@Param("companyId") Long companyId);

    @Query(value = "SELECT COALESCE(SUM(COALESCE(p.base_component, 0) + COALESCE(p.production_component, 0) + COALESCE(p.allowance, 0) + COALESCE(p.overtime_amount, 0)), 0) FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.company_id = :companyId", nativeQuery = true)
    BigDecimal getTotalLaborCost(@Param("companyId") Long companyId);

    @Query(value = "SELECT COALESCE(SUM(p.deduction_tax), 0) FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.company_id = :companyId", nativeQuery = true)
    BigDecimal getTotalTaxCost(@Param("companyId") Long companyId);

    @Query(value = "SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS period, COALESCE(SUM(o.total_amount), 0) AS val FROM orders o WHERE o.company_id = :companyId AND o.approval_status = 'Đã phê duyệt' GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')", nativeQuery = true)
    List<Object[]> getMonthlySalesTrend(@Param("companyId") Long companyId);

    @Query(value = "SELECT DATE_FORMAT(p.payment_date, '%Y-%m') AS period, COALESCE(SUM(p.amount), 0) AS val FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.company_id = :companyId GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')", nativeQuery = true)
    List<Object[]> getMonthlyActualRevenueTrend(@Param("companyId") Long companyId);

    @Query(value = "SELECT DATE_FORMAT(pp.start_date, '%Y-%m') AS period, COALESCE(SUM(pp.estimated_budget), 0) AS val FROM production_plans pp WHERE pp.company_id = :companyId AND pp.approval_status = 'Đã phê duyệt' GROUP BY DATE_FORMAT(pp.start_date, '%Y-%m')", nativeQuery = true)
    List<Object[]> getMonthlyProductionCostTrend(@Param("companyId") Long companyId);

    @Query(value = "SELECT p.period AS period, COALESCE(SUM(COALESCE(p.base_component, 0) + COALESCE(p.production_component, 0) + COALESCE(p.allowance, 0) + COALESCE(p.overtime_amount, 0)), 0) AS val FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.company_id = :companyId GROUP BY p.period", nativeQuery = true)
    List<Object[]> getMonthlyLaborCostTrend(@Param("companyId") Long companyId);

    @Query(value = "SELECT p.period AS period, COALESCE(SUM(p.deduction_tax), 0) AS val FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.company_id = :companyId GROUP BY p.period", nativeQuery = true)
    List<Object[]> getMonthlyTaxCostTrend(@Param("companyId") Long companyId);

    @Query(value = "SELECT c.code AS customerCode, c.name AS customerName, " +
                  "COALESCE(SUM(o.total_amount), 0) AS totalOrdered, " +
                  "COALESCE((SELECT SUM(p.amount) FROM payments p JOIN orders o2 ON p.order_id = o2.id WHERE o2.customer_id = c.id), 0) AS totalPaid " +
                  "FROM customers c " +
                  "LEFT JOIN orders o ON o.customer_id = c.id AND o.approval_status = 'Đã phê duyệt' " +
                  "WHERE c.company_id = :companyId " +
                  "GROUP BY c.id, c.code, c.name " +
                  "HAVING (COALESCE(SUM(o.total_amount), 0) - COALESCE((SELECT SUM(p.amount) FROM payments p JOIN orders o2 ON p.order_id = o2.id WHERE o2.customer_id = c.id), 0)) > 0", nativeQuery = true)
    List<Object[]> getCustomerDebtData(@Param("companyId") Long companyId);
}
