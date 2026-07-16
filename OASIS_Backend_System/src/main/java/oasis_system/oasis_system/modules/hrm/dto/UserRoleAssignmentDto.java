package oasis_system.oasis_system.modules.hrm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * UserRoleAssignmentDto đóng gói dữ liệu của một liên kết vai trò kiêm nhiệm tại một phòng ban.
 */
@Getter
@Setter
public class UserRoleAssignmentDto {

    @NotNull(message = "Mã vai trò không được để trống")
    private Long roleId;

    @NotNull(message = "Mã phòng ban không được để trống")
    private Long departmentId;

    @NotNull(message = "Cờ mặc định không được để trống")
    private Boolean isDefault;
}
