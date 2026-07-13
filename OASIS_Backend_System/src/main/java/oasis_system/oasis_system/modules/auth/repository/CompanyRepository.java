package oasis_system.oasis_system.modules.auth.repository;

import oasis_system.oasis_system.modules.auth.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * CompanyRepository interface cung cấp các hàm truy cập và thao tác dữ liệu 
 * liên quan đến thực thể Company.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Tìm kiếm doanh nghiệp theo mã duy nhất.
     */
    Optional<Company> findByCode(String code);

    /**
     * Kiểm tra xem mã doanh nghiệp đã tồn tại trong hệ thống chưa.
     */
    boolean existsByCode(String code);
}
