package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin tóm tắt quỹ lương của một tháng (period) phục vụ BOD giám sát chi phí lương.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollSummaryDto {
    private String period;             // Chu kỳ lương (YYYY-MM)
    private BigDecimal totalFixedCost;  // Tổng lương cố định (baseComponent + allowance + overtimeAmount)
    private BigDecimal totalProductionCost; // Tổng lương sản xuất (productionComponent)
    private BigDecimal totalDeduction;  // Tổng các khoản khấu trừ (bhxh, thuế, tạm ứng)
    private BigDecimal netSalary;       // Tổng thực lĩnh (totalAmount)
    private String status;             // Trạng thái chung: draft, approved, paid
    private double ratioFixed;         // Tỷ lệ phần trăm lương cố định (%)
    private double ratioProduction;    // Tỷ lệ phần trăm lương sản xuất (%)
}
