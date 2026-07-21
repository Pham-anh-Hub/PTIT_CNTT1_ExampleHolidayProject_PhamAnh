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
public class ProjectProfitabilityDto {
    private Long projectId;
    private String projectName;
    private BigDecimal totalRevenueCollected;
    private BigDecimal totalExpensesSpent;
    private BigDecimal grossMarginAmount;
    private Double grossMarginRatePercent;
}
