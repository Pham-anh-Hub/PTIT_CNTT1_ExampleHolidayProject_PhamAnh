package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa chỉ số Radar Sức khỏe Tài chính và Lợi nhuận Ròng cho Giám đốc (BOD).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialHealthRadarDto {
    private BigDecimal nominalRevenue;          // Doanh thu danh nghĩa (Tổng đơn hàng Sales chốt)
    private BigDecimal realCashInflow;          // Thực thu thực tế vào tài khoản (Tổng tiền khách đã trả)
    private BigDecimal totalOperatingExpenses;  // Tổng chi phí vận hành (Lương + Vật tư đã thanh toán)
    private BigDecimal netProfit;               // Lợi nhuận ròng thực tế (realCashInflow - totalOperatingExpenses)
    private double netProfitMargin;             // Biên lợi nhuận ròng (%)
    private double cashInflowEfficiency;        // Hiệu suất thực thu / Doanh thu danh nghĩa (%)
    private double expenseToRevenueRatio;       // Tỷ lệ chi phí / Doanh thu (%)
    private String financialWarningMessage;     // Thông điệp cảnh báo rủi ro tài chính tự động
}
