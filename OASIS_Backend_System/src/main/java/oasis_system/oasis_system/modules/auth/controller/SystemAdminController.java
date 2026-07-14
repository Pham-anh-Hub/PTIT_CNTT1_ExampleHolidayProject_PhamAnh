package oasis_system.oasis_system.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.auth.dto.CompanyRegisterDto;
import oasis_system.oasis_system.modules.auth.dto.CompanyDetailResponse;
import oasis_system.oasis_system.modules.auth.dto.CompanyStatusDto;
import oasis_system.oasis_system.modules.auth.dto.CompanyUpdateDto;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.service.AuthService;
import oasis_system.oasis_system.modules.auth.service.SystemAdminService;
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
    private final SystemAdminService systemAdminService;

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
 
    /**
     * API Lấy danh sách tất cả các doanh nghiệp đã đăng ký trong hệ thống.
     * Chỉ Super Admin mới có quyền gọi API này.
     */
    @GetMapping("/companies")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<Company>>> getAllCompanies() {
        java.util.List<Company> companies = authService.getAllCompanies();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách tất cả doanh nghiệp thành công.", companies)
        );
    }

    /**
     * API Lấy chi tiết thông tin và số liệu thống kê của một doanh nghiệp.
     * Chỉ Super Admin mới có quyền gọi API này.
     * 
     * @param id ID của doanh nghiệp cần xem chi tiết
     * @return Dữ liệu chi tiết doanh nghiệp kèm các chỉ số thống kê
     */
    @GetMapping("/companies/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CompanyDetailResponse>> getCompanyDetail(@PathVariable Long id) {
        CompanyDetailResponse response = systemAdminService.getCompanyDetail(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin chi tiết doanh nghiệp thành công.", response)
        );
    }

    /**
     * @return Thông tin doanh nghiệp đã được chỉnh sửa
     */
    @PutMapping("/companies/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Company>> updateCompany(
            @PathVariable Long id, 
            @Valid @RequestBody CompanyUpdateDto dto
    ) {
        Company company = systemAdminService.updateCompany(id, dto);
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thông tin doanh nghiệp thành công.", company)
        );
    }

    /**
     * API Khóa hoặc mở khóa một doanh nghiệp trong hệ thống.
     * Chỉ Super Admin mới có quyền gọi API này.
     * 
     * @param id ID doanh nghiệp cần khóa/mở khóa
     * @param dto Dữ liệu trạng thái kích hoạt mới
     * @return Thông tin doanh nghiệp đã được cập nhật trạng thái
     */
    @PutMapping("/companies/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Company>> updateCompanyStatus(
            @PathVariable Long id, 
            @Valid @RequestBody CompanyStatusDto dto
    ) {
        Company company = systemAdminService.updateCompanyStatus(id, dto);
        String msg = dto.getIsActive() ? "Mở khóa doanh nghiệp thành công." : "Tạm khóa doanh nghiệp thành công.";
        return ResponseEntity.ok(ApiResponse.success(msg, company));
    }
}
