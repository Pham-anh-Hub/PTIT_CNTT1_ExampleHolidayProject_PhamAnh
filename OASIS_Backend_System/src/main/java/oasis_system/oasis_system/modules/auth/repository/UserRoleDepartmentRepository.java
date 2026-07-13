package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.UserRoleDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * UserRoleDepartmentRepository interface cung cấp các hàm truy vấn dữ liệu 
 * từ bảng trung gian user_role_departments.
 */
@Repository
public interface UserRoleDepartmentRepository extends JpaRepository<UserRoleDepartment, Long> {

    /**
     * Lấy danh sách các liên kết vai trò - phòng ban của một tài khoản nhất định.
     * Dùng để trích xuất quyền hạn của tài khoản tại thời điểm đăng nhập.
     * 
     * @param userId ID người dùng
     * @return Danh sách các bản ghi UserRoleDepartment
     */
    List<UserRoleDepartment> findByUserId(Long userId);
}
