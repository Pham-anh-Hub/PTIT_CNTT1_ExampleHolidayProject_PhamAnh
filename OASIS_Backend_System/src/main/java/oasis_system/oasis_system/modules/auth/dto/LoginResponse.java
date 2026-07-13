package oasis_system.oasis_system.modules.auth.dto;

import lombok.*;

import java.util.List;

/**
 * LoginResponse đóng gói kết quả phản hồi sau khi đăng nhập thành công.
 * Hỗ trợ phân tách giữa luồng đơn vai trò (nhận trực tiếp token) và đa vai trò kiêm nhiệm (chờ chọn ngữ cảnh).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private boolean requireContextSelection; // True nếu người dùng cần chọn một phòng ban/vai trò làm việc
    private String accessToken;              // Token JWT chính thức (chỉ có khi requireContextSelection là false)
    private UserInfo userInfo;               // Thông tin cơ bản người dùng
    private UserContextDto activeContext;    // Ngữ cảnh hoạt động hiện tại (chỉ có khi requireContextSelection là false)
    private List<UserContextDto> contexts;   // Danh sách các vai trò và phòng ban được giao của tài khoản

    /**
     * Thông tin cơ bản người dùng phục vụ hiển thị ở Frontend.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String fullname;
    }

    /**
     * Thông tin chi tiết về từng ngữ cảnh làm việc được kiêm nhiệm.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserContextDto {
        private Long roleId;
        private String roleName;
        private Long departmentId;
        private String departmentName;
    }
}
