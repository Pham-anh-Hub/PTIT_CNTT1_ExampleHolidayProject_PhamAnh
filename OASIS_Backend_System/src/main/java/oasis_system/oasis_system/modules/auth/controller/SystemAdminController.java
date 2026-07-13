package oasis_system.oasis_system.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.auth.dto.CompanyRegisterDto;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * SystemAdminController cung cấp các API dành riêng cho Admin hệ thống (Super Admin / Sys Admin).
 * Được bảo vệ nghiêm ngặt bằng phân quyền vai trò SUPER_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/sys_admin")
@RequiredArgsConstructor
public class SystemAdminController {

    private final AuthService authService;

    /**
     * API Tạo mới doanh nghiệp và tài khoản quản trị doanh nghiệp.
     * Chỉ có Super Admin hệ thống sau khi đăng nhập mới có quyền gọi API này.
     * 
     * @param dto Thông tin doanh nghiệp mới cần tạo
     * @return Thông tin doanh nghiệp vừa tạo
     */
    @PostMapping("/register-company")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Company>> registerCompany(@Valid @RequestBody CompanyRegisterDto dto) {
        Company company = authService.registerCompany(dto);
        return ResponseEntity.ok(
                ApiResponse.success("Khởi tạo doanh nghiệp mới và tài khoản quản trị thành công.", company)
        );
    }
}
