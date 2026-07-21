package oasis_system.oasis_system.modules.worklog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionWorkLogDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate workDate;
    private String productName;
    private Long stageId;
    private String stageName;
    private Integer completedQuantity;
    private BigDecimal hoursWorked;
    private String shiftName;
    private String approvedByName;
    private BigDecimal unitPrice;
    private BigDecimal amount;
}
