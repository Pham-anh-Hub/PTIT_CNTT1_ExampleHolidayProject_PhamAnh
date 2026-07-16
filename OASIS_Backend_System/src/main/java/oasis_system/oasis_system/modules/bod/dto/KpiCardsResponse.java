package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * KpiCardsResponse chứa các chỉ số tài chính quan trọng hiển thị ở các thẻ KPI của BOD Dashboard.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiCardsResponse {
    private BigDecimal totalRevenue;       // Tổng doanh thu (Đơn hàng đã duyệt)
    private BigDecimal actualRevenue;      // Doanh thu thực thu (Đã thanh toán)
    private BigDecimal totalProductionCost; // Chi phí sản xuất (Ngân sách vật tư dự toán)
    private BigDecimal netProfit;          // Lợi nhuận ròng
    private BigDecimal totalDebt;          // Tổng công nợ khách hàng
}
