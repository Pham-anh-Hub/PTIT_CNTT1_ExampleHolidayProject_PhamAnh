package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository interface mở rộng JpaRepository để cung cấp các hàm CRUD cơ bản 
 * và các truy vấn tùy biến cho thực thể User.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm kiếm tài khoản người dùng theo email đăng nhập.
     * 
     * @param email Địa chỉ email
     * @return Optional chứa User nếu tìm thấy
     */
    Optional<User> findByEmail(String email);
}
