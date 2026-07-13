package oasis_system.oasis_system.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.auth.service.AdminTenantService;
import oasis_system.oasis_system.modules.hrm.dto.EmployeeCreateDto;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
}
