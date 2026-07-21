package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.ProductionStageWorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * ProductionStageWorkLogRepository quản lý truy cập cơ sở dữ liệu cho bảng 'production_stage_work_logs'.
 */
@Repository
public interface ProductionStageWorkLogRepository extends JpaRepository<ProductionStageWorkLog, Long> {

    /**
     * Lấy nhật ký làm việc chi tiết của một nhân viên trong khoảng thời gian xác định.
     */
    @Query("SELECT w FROM ProductionStageWorkLog w " +
           "JOIN FETCH w.productionStage s " +
           "JOIN FETCH s.productionPlan p " +
           "JOIN FETCH p.product pr " +
           "WHERE w.employee.id = :employeeId " +
           "AND w.workDate >= :startDate " +
           "AND w.workDate <= :endDate " +
           "ORDER BY w.workDate DESC")
    List<ProductionStageWorkLog> findByEmployeeIdAndDateRange(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Lấy tất cả nhật ký công việc thuộc một doanh nghiệp trong khoảng thời gian.
     */
    @Query("SELECT w FROM ProductionStageWorkLog w " +
           "JOIN FETCH w.productionStage s " +
           "JOIN FETCH s.productionPlan p " +
           "WHERE p.company.id = :companyId " +
           "AND w.workDate >= :startDate " +
           "AND w.workDate <= :endDate")
    List<ProductionStageWorkLog> findByCompanyIdAndDateRange(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
