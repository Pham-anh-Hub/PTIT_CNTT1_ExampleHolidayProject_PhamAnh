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
public class ProjectBudgetStatusDto {
    private Long projectId;
    private String projectName;
    private BigDecimal allocatedBudget;
    private BigDecimal actualMaterialCost;
    private BigDecimal actualLaborCost;
    private BigDecimal actualOtherCost;
    private BigDecimal totalSpent;
    private BigDecimal remainingBudget;
    private Double budgetUsagePercent;
}
