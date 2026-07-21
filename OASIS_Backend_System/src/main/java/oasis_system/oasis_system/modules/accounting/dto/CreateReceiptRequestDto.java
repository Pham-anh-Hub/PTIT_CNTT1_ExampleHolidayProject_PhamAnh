package oasis_system.oasis_system.modules.accounting.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateReceiptRequestDto {
    private Long orderId;
    private Long customerId;
    private BigDecimal amount;
    private String paymentMethod; // CASH, BANK_TRANSFER
    private String note;
}
