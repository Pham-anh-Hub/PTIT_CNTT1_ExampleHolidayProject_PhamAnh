package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ContractRepository cung cấp các phương thức truy vấn bảng 'contracts'.
 */
@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    /**
     * Lấy danh sách hợp đồng theo trạng thái phê duyệt của doanh nghiệp.
     */
    @Query("SELECT c FROM Contract c WHERE c.employee.company.id = :companyId AND c.approvalStatus = :approvalStatus")
    List<Contract> findByCompanyIdAndApprovalStatus(
            @Param("companyId") Long companyId, 
            @Param("approvalStatus") String approvalStatus
    );

    /**
     * Lấy toàn bộ hợp đồng thuộc doanh nghiệp.
     */
    @Query("SELECT c FROM Contract c WHERE c.employee.company.id = :companyId")
    List<Contract> findByCompanyId(@Param("companyId") Long companyId);

    /**
     * Tìm hợp đồng đang có hiệu lực (active) và đã được phê duyệt của nhân viên.
     */
    @Query("SELECT c FROM Contract c WHERE c.employee.id = :employeeId AND c.status = 'active' AND c.approvalStatus = 'Đã phê duyệt'")
    List<Contract> findActiveApprovedContract(@Param("employeeId") Long employeeId);
}
