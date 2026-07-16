package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.ApprovalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ApprovalSettingRepository phục vụ việc đọc ghi cài đặt phê duyệt (ngưỡng duyệt).
 */
@Repository
public interface ApprovalSettingRepository extends JpaRepository<ApprovalSetting, Long> {

    /**
     * Tìm tất cả cấu hình phê duyệt của một doanh nghiệp.
     * 
     * @param companyId ID doanh nghiệp
     * @return Danh sách cấu hình phê duyệt
     */
    List<ApprovalSetting> findByCompanyId(Long companyId);
}
