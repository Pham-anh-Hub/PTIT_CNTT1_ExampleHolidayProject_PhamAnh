package oasis_system.oasis_system.modules.hrm.repository;

import oasis_system.oasis_system.modules.hrm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * EmployeeRepository interface phục vụ truy vấn dữ liệu hồ sơ nhân sự của hệ thống.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Tìm hồ sơ nhân sự theo mã nhân sự và ID doanh nghiệp.
     */
    Optional<Employee> findByEmployeeCodeAndCompanyId(String employeeCode, Long companyId);

    /**
     * Lấy toàn bộ danh sách nhân viên thuộc doanh nghiệp.
     */
    List<Employee> findByCompanyId(Long companyId);

    /**
     * Kiểm tra xem mã nhân viên đã tồn tại trong doanh nghiệp chưa.
     */
    boolean existsByEmployeeCodeAndCompanyId(String employeeCode, Long companyId);

    /**
     * Tìm kiếm nhân viên theo địa chỉ email và ID doanh nghiệp.
     */
    Optional<Employee> findByEmailAndCompanyId(String email, Long companyId);
}
