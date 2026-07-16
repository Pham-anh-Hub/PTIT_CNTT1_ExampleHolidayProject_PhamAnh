package oasis_system.oasis_system.modules.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * PositionDto đóng gói dữ liệu của một Chức vụ nhân viên để thêm mới hoặc chỉnh sửa.
 */
@Getter
@Setter
public class PositionDto {

    @NotBlank(message = "Tên chức vụ không được để trống")
    private String name;

    private String description;
}
