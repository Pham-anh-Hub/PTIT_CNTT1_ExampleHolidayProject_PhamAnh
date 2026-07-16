package oasis_system.oasis_system.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * ApprovalSettingDto đóng gói thông tin cài đặt phê duyệt để cập nhật từ API.
 */
@Getter
@Setter
public class ApprovalSettingDto {
    private Long id;

    @NotBlank(message = "Loại quy tắc không được để trống")
    private String ruleType;

    @NotNull(message = "Giá trị ngưỡng không được để trống")
    private BigDecimal thresholdValue;

    @NotNull(message = "Trạng thái bật/tắt không được để trống")
    private Boolean isEnabled;
}
