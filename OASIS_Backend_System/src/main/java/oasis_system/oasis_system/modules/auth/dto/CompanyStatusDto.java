package oasis_system.oasis_system.modules.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * CompanyStatusDto chứa trạng thái kích hoạt (hoạt động/khóa) mới cần cập nhật cho doanh nghiệp.
 */
@Getter
@Setter
public class CompanyStatusDto {

    @NotNull(message = "Trạng thái kích hoạt không được để trống")
    private Boolean isActive;
}
