package oasis_system.oasis_system.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * CompanyRegisterDto đóng gói thông tin đăng ký doanh nghiệp mới (Tenant)
 * và khởi tạo tài khoản quản trị doanh nghiệp (Admin DN) đi kèm.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyRegisterDto {

    @NotBlank(message = "Tên doanh nghiệp không được để trống")
    private String companyName;

    @NotBlank(message = "Mã doanh nghiệp không được để trống")
    @Size(max = 50, message = "Mã doanh nghiệp không được quá 50 ký tự")
    private String companyCode;

    @NotBlank(message = "Email quản trị viên không được để trống")
    @Email(message = "Email không hợp lệ")
    private String adminEmail;

    @NotBlank(message = "Họ tên quản trị viên không được để trống")
    private String adminFullname;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có độ dài tối thiểu 6 ký tự")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._\\-#/]).{6,}$",
        message = "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&._-#/)"
    )
    private String adminPassword;
}
