package oasis_system.oasis_system.modules.hrm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * EmployeeCreateDto đóng gói dữ liệu phục vụ yêu cầu tạo hồ sơ nhân viên mới
 * và tùy chọn tạo tài khoản đăng nhập đi kèm của Admin doanh nghiệp.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeCreateDto {

    @NotBlank(message = "Họ tên nhân viên không được để trống")
    private String fullname;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String phone;

    private String employeeCode; // Nếu trống, hệ thống sẽ tự động sinh theo mẫu: CTY-DEPT-XXXX

    @NotNull(message = "ID phòng ban không được để trống")
    private Long departmentId;

    @NotNull(message = "ID chức vụ không được để trống")
    private Long positionId;

    @NotNull(message = "ID vai trò phân quyền không được để trống")
    private Long roleId; // Vai trò gán cho tài khoản (Ví dụ: DIRECTOR, HR_STAFF,...)

    @Builder.Default
    private Boolean createAccount = true; // Thiết lập mặc định tự động cấp tài khoản đăng nhập Web

    @Size(min = 6, message = "Mật khẩu đăng nhập tối thiểu phải từ 6 ký tự")
    private String password; // Mật khẩu của tài khoản (yêu cầu nếu createAccount = true)
}
