package oasis_system.oasis_system.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.auth.dto.LoginRequest;
import oasis_system.oasis_system.modules.auth.dto.LoginResponse;
import oasis_system.oasis_system.modules.auth.dto.ContextSelectRequest;
import oasis_system.oasis_system.modules.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController cung cấp các API công khai liên quan đến xác thực và đăng ký.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * API Đăng nhập hệ thống (Unified Login API).
     * Phục vụ cho cả Super Admin hệ thống, Admin Doanh nghiệp và tất cả nhân viên.
     * 
     * @param request Dữ liệu đăng nhập
     * @return Kết quả chứa Token hoặc Danh sách ngữ cảnh lựa chọn
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticateUser(request);
        String msg = response.isRequireContextSelection() 
                ? "Tài khoản của bạn kiêm nhiệm nhiều vai trò. Vui lòng chọn ngữ cảnh làm việc." 
                : "Đăng nhập thành công.";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    /**
     * API Lựa chọn ngữ cảnh hoạt động.
     * Dành riêng cho tài khoản kiêm nhiệm để chọn vai trò làm việc cụ thể và lấy Access Token chính thức.
     * 
     * @param request Dữ liệu ngữ cảnh lựa chọn
     * @return Kết quả chứa Access Token chính thức
     */
    @PostMapping("/select-context")
    public ResponseEntity<ApiResponse<LoginResponse>> selectContext(@Valid @RequestBody ContextSelectRequest request) {
        LoginResponse response = authService.selectActiveContext(request);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận ngữ cảnh làm việc thành công.", response));
    }
}

