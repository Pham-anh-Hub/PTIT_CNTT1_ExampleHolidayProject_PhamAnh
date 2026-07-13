package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * PositionRepository interface quản lý truy cập dữ liệu liên quan đến chức vụ nhân viên.
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    /**
     * Tìm chức vụ theo tên chức vụ và mã doanh nghiệp.
     */
    Optional<Position> findByNameAndCompanyId(String name, Long companyId);

    /**
     * Lấy danh sách chức vụ thuộc một doanh nghiệp cụ thể.
     */
    List<Position> findByCompanyId(Long companyId);
}
