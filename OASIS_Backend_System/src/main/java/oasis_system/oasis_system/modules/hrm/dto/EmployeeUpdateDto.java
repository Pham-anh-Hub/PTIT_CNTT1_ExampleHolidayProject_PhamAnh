package oasis_system.oasis_system.modules.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * EmployeeUpdateDto đóng gói dữ liệu phục vụ yêu cầu cập nhật thông tin nhân viên.
 */
@Getter
@Setter
public class EmployeeUpdateDto {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullname;

    private String phone;
    private String avatarUrl;

    @NotBlank(message = "Trạng thái nhân sự không được để trống")
    private String status; // Thử việc, Chính thức, Đã nghỉ việc

    @NotNull(message = "Phòng ban không được để trống")
    private Long departmentId;

    @NotNull(message = "Chức vụ không được để trống")
    private Long positionId;
}
