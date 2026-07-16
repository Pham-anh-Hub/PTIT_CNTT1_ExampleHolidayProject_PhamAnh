package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * CustomerDebtDto đại diện cho số liệu nợ của một khách hàng cụ thể (Bar Chart).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDebtDto {
    private String customerCode;
    private String customerName;
    private BigDecimal totalOrdered; // Tổng trị giá đơn hàng đã duyệt
    private BigDecimal totalPaid;    // Tổng tiền khách đã thanh toán
    private BigDecimal debtAmount;   // Trị giá nợ (totalOrdered - totalPaid)
}
