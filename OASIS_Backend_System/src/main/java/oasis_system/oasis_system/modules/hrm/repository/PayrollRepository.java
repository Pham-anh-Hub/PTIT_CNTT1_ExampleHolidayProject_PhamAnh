package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PayrollRepository cung cấp các phương thức truy vấn bảng 'payrolls'.
 */
@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    /**
     * Lấy toàn bộ danh sách bản ghi bảng lương thuộc doanh nghiệp.
     */
    @Query("SELECT p FROM Payroll p WHERE p.employee.company.id = :companyId")
    List<Payroll> findByCompanyId(@Param("companyId") Long companyId);

    /**
     * Lấy danh sách bảng lương chi tiết của một chu kỳ tháng trong doanh nghiệp.
     */
    @Query("SELECT p FROM Payroll p WHERE p.employee.company.id = :companyId AND p.period = :period")
    List<Payroll> findByCompanyIdAndPeriod(@Param("companyId") Long companyId, @Param("period") String period);

    /**
     * Lấy danh sách tổng hợp quỹ lương theo từng chu kỳ tháng trong doanh nghiệp.
     * Tính toán tổng các thành phần lương cố định, lương sản xuất, các khoản khấu trừ và tổng thực lĩnh.
     */
    @Query("SELECT p.period, " +
           "SUM(COALESCE(p.baseComponent, 0) + COALESCE(p.allowance, 0) + COALESCE(p.overtimeAmount, 0)), " +
           "SUM(COALESCE(p.productionComponent, 0)), " +
           "SUM(COALESCE(p.deductionBhxh, 0) + COALESCE(p.deductionTax, 0) + COALESCE(p.deductionAdvance, 0)), " +
           "SUM(COALESCE(p.totalAmount, 0)), " +
           "p.status " +
           "FROM Payroll p WHERE p.employee.company.id = :companyId " +
           "GROUP BY p.period, p.status " +
           "ORDER BY p.period DESC")
    List<Object[]> getMonthlyPayrollSummary(@Param("companyId") Long companyId);
}
