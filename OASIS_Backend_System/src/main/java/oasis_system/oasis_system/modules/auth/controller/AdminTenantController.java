package oasis_system.oasis_system.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.auth.dto.CompanyStatusDto;
import oasis_system.oasis_system.modules.auth.dto.CompanyUpdateDto;
import oasis_system.oasis_system.modules.auth.dto.ApprovalSettingDto;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.entity.ApprovalSetting;
import oasis_system.oasis_system.modules.auth.service.AdminTenantService;
import oasis_system.oasis_system.modules.hrm.dto.*;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.entity.Department;
import oasis_system.oasis_system.modules.hrm.entity.Position;
import oasis_system.oasis_system.modules.auth.entity.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * AdminTenantController cung cấp các API quản trị nội bộ dành riêng cho Admin doanh nghiệp (Admin DN).
 * Tất cả các API trong này đều được bảo vệ nghiêm ngặt bằng phân quyền mức phương thức (Method Security).
 */
@RestController
@RequestMapping("/api/v1/sys")
@RequiredArgsConstructor
public class AdminTenantController {

    private final AdminTenantService adminTenantService;

    /**
     * API Thêm mới nhân sự và tùy chọn cấp phát tài khoản đăng nhập cho nhân viên.
     * Chỉ có tài khoản mang vai trò 'ADMIN_DN' mới có quyền gọi API này.
     * 
     * 💡 Kiến thức ứng dụng:
     * 1. Method Security: Chú thích @PreAuthorize kiểm tra vai trò người dùng trong Security Context trước khi cho phép vào hàm.
     * 2. Tenant Isolation: Service xử lý bên dưới tự động cô lập companyId, ngăn chặn IDOR chéo công ty.
     * 
     * @param dto Dữ liệu nhân sự cần thêm
     * @return ResponseEntity chứa kết quả và dữ liệu nhân viên vừa tạo
     */
    @PostMapping("/employees")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Employee>> createEmployeeAndUser(@Valid @RequestBody EmployeeCreateDto dto) {
        Employee employee = adminTenantService.createEmployeeAndUser(dto);
        return ResponseEntity.ok(
                ApiResponse.success("Thêm mới hồ sơ nhân viên và cấp phát tài khoản đăng nhập thành công.", employee)
        );
    }

    /**
     * API Lấy danh sách nhân viên của doanh nghiệp kèm tìm kiếm và lọc dữ liệu.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/employees")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<Employee>>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status
    ) {
        List<Employee> list = adminTenantService.getEmployees(search, departmentId, status);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách nhân viên thành công.", list)
        );
    }

    /**
     * API Lấy chi tiết thông tin và trạng thái tài khoản của một nhân viên.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/employees/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeDetail(@PathVariable Long id) {
        Employee employee = adminTenantService.getEmployeeDetail(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết nhân viên thành công.", employee)
        );
    }

    /**
     * API Chỉnh sửa lý lịch thông tin cơ bản của nhân viên.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/employees/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Employee>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateDto dto
    ) {
        Employee employee = adminTenantService.updateEmployee(id, dto);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thông tin hồ sơ nhân viên thành công.", employee)
        );
    }

    /**
     * API Khóa hoặc mở khóa tài khoản đăng nhập Web của nhân viên.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/employees/{id}/status")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Employee>> updateEmployeeAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody CompanyStatusDto dto
    ) {
        Employee employee = adminTenantService.updateEmployeeAccountStatus(id, dto.getIsActive());
        String msg = dto.getIsActive() ? "Mở khóa tài khoản nhân viên thành công." : "Khóa tài khoản nhân viên thành công.";
        return ResponseEntity.ok(ApiResponse.success(msg, employee));
    }

    /**
     * API Phân quyền kiêm nhiệm phòng ban & vai trò hoạt động cho nhân viên.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/employees/{id}/roles")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Employee>> assignUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody List<UserRoleAssignmentDto> assignments
    ) {
        Employee employee = adminTenantService.assignUserRoles(id, assignments);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật phân quyền kiêm nhiệm nhân viên thành công.", employee)
        );
    }

    /**
     * API Lấy danh sách các phòng ban của doanh nghiệp.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/departments")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<Department>>> getDepartments() {
        List<Department> departments = adminTenantService.getDepartments();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách phòng ban thành công.", departments)
        );
    }

    /**
     * API Lấy danh sách các chức danh của doanh nghiệp.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/positions")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<Position>>> getPositions() {
        List<Position> positions = adminTenantService.getPositions();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách chức danh thành công.", positions)
        );
    }

    /**
     * API Lấy danh sách các vai trò hoạt động hợp lệ.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<Role>>> getRoles() {
        List<Role> roles = adminTenantService.getRoles();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách vai trò phân quyền thành công.", roles)
        );
    }

    /**
     * API Lấy thông tin chi tiết của doanh nghiệp hiện tại.
     * Cho phép các cấp quản lý và nhân sự được xem thông tin để hiển thị tên doanh nghiệp.
     */
    @GetMapping("/company")
    @PreAuthorize("hasAnyRole('ADMIN_DN', 'BOD', 'DIRECTOR', 'HR_STAFF', 'SALES_STAFF', 'ACCOUNTANT', 'WORKER')")
    public ResponseEntity<ApiResponse<Company>> getCompanyProfile() {
        Company company = adminTenantService.getCompanyProfile();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin doanh nghiệp thành công.", company)
        );
    }

    /**
     * API Cập nhật thông tin chi tiết của doanh nghiệp hiện tại.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/company")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Company>> updateCompanyProfile(@Valid @RequestBody CompanyUpdateDto dto) {
        Company company = adminTenantService.updateCompanyProfile(dto);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thông tin doanh nghiệp thành công.", company)
        );
    }

    /**
     * API Lấy cấu hình phê duyệt của doanh nghiệp.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @GetMapping("/approval-settings")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<ApprovalSetting>>> getApprovalSettings() {
        List<ApprovalSetting> settings = adminTenantService.getApprovalSettings();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy cấu hình phê duyệt thành công.", settings)
        );
    }

    /**
     * API Cập nhật hàng loạt cấu hình phê duyệt cho doanh nghiệp.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/approval-settings")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<List<ApprovalSetting>>> updateApprovalSettings(
            @Valid @RequestBody List<ApprovalSettingDto> dtos
    ) {
        List<ApprovalSetting> settings = adminTenantService.updateApprovalSettings(dtos);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật cấu hình phê duyệt thành công.", settings)
        );
    }

    /**
     * API Tạo mới phòng ban.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Department>> createDepartment(
            @Valid @RequestBody DepartmentDto dto
    ) {
        Department department = adminTenantService.createDepartment(dto);
        return ResponseEntity.ok(
                ApiResponse.success("Tạo mới phòng ban thành công.", department)
        );
    }

    /**
     * API Cập nhật phòng ban.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Department>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentDto dto
    ) {
        Department department = adminTenantService.updateDepartment(id, dto);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật phòng ban thành công.", department)
        );
    }

    /**
     * API Xóa phòng ban.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        adminTenantService.deleteDepartment(id);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa phòng ban thành công.", null)
        );
    }

    /**
     * API Tạo mới chức danh/chức vụ.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PostMapping("/positions")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Position>> createPosition(
            @Valid @RequestBody PositionDto dto
    ) {
        Position position = adminTenantService.createPosition(dto);
        return ResponseEntity.ok(
                ApiResponse.success("Tạo mới chức danh thành công.", position)
        );
    }

    /**
     * API Cập nhật chức danh/chức vụ.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @PutMapping("/positions/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Position>> updatePosition(
            @PathVariable Long id,
            @Valid @RequestBody PositionDto dto
    ) {
        Position position = adminTenantService.updatePosition(id, dto);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật chức danh thành công.", position)
        );
    }

    /**
     * API Xóa chức danh/chức vụ.
     * Chỉ Admin Doanh nghiệp mới có quyền gọi API này.
     */
    @DeleteMapping("/positions/{id}")
    @PreAuthorize("hasRole('ADMIN_DN')")
    public ResponseEntity<ApiResponse<Void>> deletePosition(@PathVariable Long id) {
        adminTenantService.deletePosition(id);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa chức danh thành công.", null)
        );
    }
}
