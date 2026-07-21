package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.ProductionStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProductionStageRepository quản lý các truy vấn liên quan tới Công đoạn sản xuất.
 */
@Repository
public interface ProductionStageRepository extends JpaRepository<ProductionStage, Long> {

    /**
     * Lấy toàn bộ công đoạn thuộc một Kế hoạch sản xuất xếp theo thứ tự công đoạn.
     */
    @Query("SELECT s FROM ProductionStage s WHERE s.productionPlan.id = :planId ORDER BY s.sequenceNo ASC")
    List<ProductionStage> findByProductionPlanIdOrderBySequenceNoAsc(@Param("planId") Long planId);

    /**
     * Lấy tất cả công đoạn thuộc doanh nghiệp đang ở trạng thái chỉ định.
     */
    @Query("SELECT s FROM ProductionStage s WHERE s.productionPlan.company.id = :companyId AND s.status = :status")
    List<ProductionStage> findByCompanyIdAndStatus(
            @Param("companyId") Long companyId,
            @Param("status") String status
    );
}
