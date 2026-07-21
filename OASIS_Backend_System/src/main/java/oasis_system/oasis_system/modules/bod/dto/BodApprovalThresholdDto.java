package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin cài đặt ngưỡng phê duyệt và cảnh báo rủi ro của doanh nghiệp cho BOD.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BodApprovalThresholdDto {
    private Long id;
    private String ruleType;         // ORDER_AMOUNT_THRESHOLD, MATERIAL_SUPPLEMENT_THRESHOLD, FIXED_SALARY_RATIO_WARNING, RED_ZONE_DEBT_DAYS
    private String ruleName;         // Tên hiển thị tiếng Việt dễ hiểu
    private BigDecimal thresholdValue;// Giá trị ngưỡng thiết lập
    private Boolean isEnabled;       // Bật/Tắt áp dụng ngưỡng
}
