package oasis_system.oasis_system.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * ContextSelectRequest đóng gói thông tin lựa chọn phòng ban và vai trò hoạt động
 * đối với tài khoản kiêm nhiệm nhiều vị trí.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContextSelectRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotNull(message = "ID vai trò không được để trống")
    private Long roleId;

    private Long departmentId; // Có thể null đối với Super Admin hoặc vai trò hệ thống không trực thuộc phòng ban
}
