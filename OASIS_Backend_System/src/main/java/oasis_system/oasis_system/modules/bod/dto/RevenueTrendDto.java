package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * RevenueTrendDto lưu giữ dữ liệu doanh thu và lợi nhuận ròng của một tháng cụ thể.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueTrendDto {
    private String period;      // Định dạng YYYY-MM
    private BigDecimal revenue; // Doanh thu thực thu
    private BigDecimal sales;   // Doanh thu bán hàng tạo ra (Doanh thu danh nghĩa)
    private BigDecimal profit;  // Lợi nhuận ròng
}
