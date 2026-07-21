package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProductionPlanRepository quản lý các truy vấn liên quan tới Kế hoạch sản xuất trong CSDL.
 */
@Repository
public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Long> {

    /**
     * Lấy danh sách kế hoạch sản xuất theo trạng thái phê duyệt của doanh nghiệp.
     */
    @Query("SELECT p FROM ProductionPlan p WHERE p.company.id = :companyId AND p.approvalStatus = :approvalStatus ORDER BY p.createdAt DESC")
    List<ProductionPlan> findByCompanyIdAndApprovalStatus(
            @Param("companyId") Long companyId,
            @Param("approvalStatus") String approvalStatus
    );

    /**
     * Lấy toàn bộ danh sách kế hoạch sản xuất thuộc doanh nghiệp.
     */
    @Query("SELECT p FROM ProductionPlan p WHERE p.company.id = :companyId ORDER BY p.createdAt DESC")
    List<ProductionPlan> findByCompanyId(@Param("companyId") Long companyId);
}
