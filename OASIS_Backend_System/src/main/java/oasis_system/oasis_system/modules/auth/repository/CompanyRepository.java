package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * CompanyRepository interface cung cấp các hàm truy cập và thao tác dữ liệu 
 * liên quan đến thực thể Company.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Tìm kiếm doanh nghiệp theo mã duy nhất.
     */
    Optional<Company> findByCode(String code);

    /**
     * Kiểm tra xem mã doanh nghiệp đã tồn tại trong hệ thống chưa.
     */
    boolean existsByCode(String code);

    /**
     * Tìm tài khoản Admin đại diện của Doanh nghiệp (Vai trò ADMIN_DN).
     */
    @Query("SELECT u FROM User u JOIN UserRoleDepartment urd ON u.id = urd.user.id " +
           "JOIN Role r ON urd.role.id = r.id " +
           "WHERE u.company.id = :companyId AND r.name = 'ADMIN_DN'")
    Optional<oasis_system.oasis_system.modules.auth.entity.User> findAdminUserByCompanyId(@Param("companyId") Long companyId);

    // --- CÁC HÀM TRUY VẤN NATIVE ĐẾM SỐ LIỆU THỐNG KÊ HOẠT ĐỘNG ---
    
    @Query(value = "SELECT COUNT(*) FROM users WHERE company_id = :companyId", nativeQuery = true)
    long countUsersByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM employees WHERE company_id = :companyId", nativeQuery = true)
    long countEmployeesByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM departments WHERE company_id = :companyId", nativeQuery = true)
    long countDepartmentsByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM customers WHERE company_id = :companyId", nativeQuery = true)
    long countCustomersByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM orders WHERE company_id = :companyId", nativeQuery = true)
    long countOrdersByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0.00) FROM payments p " +
                   "JOIN orders o ON p.order_id = o.id " +
                   "WHERE o.company_id = :companyId", nativeQuery = true)
    java.math.BigDecimal sumRevenueByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM products WHERE company_id = :companyId", nativeQuery = true)
    long countProductsByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM production_plans WHERE company_id = :companyId", nativeQuery = true)
    long countProductionPlansByCompanyId(@Param("companyId") Long companyId);

    @Query(value = "SELECT COUNT(*) FROM recruitment_posts WHERE company_id = :companyId", nativeQuery = true)
    long countRecruitmentPostsByCompanyId(@Param("companyId") Long companyId);
}
