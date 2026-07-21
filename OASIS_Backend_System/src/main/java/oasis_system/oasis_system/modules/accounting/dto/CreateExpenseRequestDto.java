package oasis_system.oasis_system.modules.accounting.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateExpenseRequestDto {
    private String category; // PAYROLL, MATERIAL, OPERATION, PROJECT
    private Long refId;
    private String recipientName;
    private BigDecimal amount;
    private String paymentMethod; // CASH, BANK_TRANSFER
    private String note;
}
