package oasis_system.oasis_system.modules.accounting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDebtDto {
    private Long customerId;
    private String customerName;
    private BigDecimal totalOrdersValue;
    private BigDecimal totalPaid;
    private BigDecimal remainingDebt;
    private Integer unpaidOrdersCount;
}
