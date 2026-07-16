package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * DepartmentRepository interface quản lý truy vấn dữ liệu cho thực thể phòng ban.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Tìm phòng ban theo mã bộ phận và mã doanh nghiệp.
     */
    Optional<Department> findByCodeAndCompanyId(String code, Long companyId);

    /**
     * Lấy danh sách các phòng ban trực thuộc doanh nghiệp.
     */
    List<Department> findByCompanyId(Long companyId);

    /**
     * Kiểm tra xem mã phòng ban đã tồn tại trong doanh nghiệp chưa.
     */
    boolean existsByCodeAndCompanyId(String code, Long companyId);

    /**
     * Kiểm tra xem phòng ban có bất kỳ phòng ban con trực thuộc nào không.
     */
    boolean existsByParentDepartmentId(Long parentId);
}
