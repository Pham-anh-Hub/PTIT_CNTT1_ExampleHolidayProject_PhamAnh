package oasis_system.oasis_system.modules.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DepartmentDto đóng gói dữ liệu của một Phòng ban để thêm mới hoặc chỉnh sửa.
 */
@Getter
@Setter
public class DepartmentDto {

    @NotBlank(message = "Tên phòng ban không được để trống")
    private String name;

    @NotBlank(message = "Mã phòng ban không được để trống")
    private String code;

    private String description;
    
    private Long parentDepartmentId;
}
