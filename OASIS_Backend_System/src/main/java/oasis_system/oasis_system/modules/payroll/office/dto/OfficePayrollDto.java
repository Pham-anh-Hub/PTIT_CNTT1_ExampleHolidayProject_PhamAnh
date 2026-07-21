package oasis_system.oasis_system.modules.payroll.office.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficePayrollDto {
    private Integer stt;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private BigDecimal baseSalary;
    private BigDecimal allowance;
    private Double otHours;
    private BigDecimal otAmount;
    private Integer lateCount;
    private BigDecimal latePenaltyAmount;
    private String lateNote;
    private BigDecimal otherBonus;
    private BigDecimal netSalary;
    private String status; // Chưa giải quyết, Đã giải quyết
}
