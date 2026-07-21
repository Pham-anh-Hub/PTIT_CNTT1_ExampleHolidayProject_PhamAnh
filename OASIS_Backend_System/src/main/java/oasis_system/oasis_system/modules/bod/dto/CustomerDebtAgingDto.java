package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin báo cáo tuổi nợ (Aging Report) của khách hàng.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDebtAgingDto {
    private Long customerId;
    private String customerCode;
    private String customerName;
    private BigDecimal totalOrdered;      // Tổng doanh số mua hàng (Đã phê duyệt)
    private BigDecimal totalPaid;         // Tổng số tiền đã thanh toán thực tế
    private BigDecimal totalDebt;         // Tổng số dư nợ còn lại (totalOrdered - totalPaid)
    private BigDecimal agingUnder30Days;  // Nợ trong hạn / mới phát sinh dưới 30 ngày
    private BigDecimal aging30To60Days;   // Nợ quá hạn 30 - 60 ngày
    private BigDecimal aging60To90Days;   // Nợ quá hạn 60 - 90 ngày
    private BigDecimal agingOver90Days;   // Nợ xấu quá hạn trên 90 ngày
}
