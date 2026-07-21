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

    /**
     * Tìm kiếm và lọc nhân viên động theo tên/mã, phòng ban và trạng thái trong doanh nghiệp.
     */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE e.company.id = :companyId " +
           "AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:status IS NULL OR e.status = :status)")
    List<Employee> findEmployeesWithFilters(
            @org.springframework.data.repository.query.Param("companyId") Long companyId,
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId,
            @org.springframework.data.repository.query.Param("status") String status
    );

    /**
     * Kiểm tra xem có bất kỳ nhân viên nào đang thuộc phòng ban này không.
     */
    boolean existsByDepartmentId(Long departmentId);

    /**
     * Kiểm tra xem có bất kỳ nhân viên nào đang có chức vụ này không.
     */
    boolean existsByPositionId(Long positionId);

    /**
     * Tìm hồ sơ nhân viên dựa trên user_id của tài khoản đăng nhập.
     */
    Optional<Employee> findByUserId(Long userId);
}
