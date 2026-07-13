package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * RoleRepository interface cung cấp các hàm truy cập dữ liệu liên quan đến vai trò phân quyền.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Tìm kiếm vai trò theo tên và mã doanh nghiệp.
     */
    Optional<Role> findByNameAndCompanyId(String name, Long companyId);

    /**
     * Tìm kiếm vai trò theo tên (dùng cho vai trò hệ thống nơi company_id là null).
     */
    Optional<Role> findByName(String name);

    /**
     * Lấy danh sách các vai trò thuộc về một doanh nghiệp cụ thể.
     */
    List<Role> findByCompanyId(Long companyId);

    /**
     * Lấy danh sách các vai trò dùng chung của toàn hệ thống (company_id IS NULL).
     */
    List<Role> findByCompanyIdIsNull();
}
